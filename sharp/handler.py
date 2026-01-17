"""
RunPod Serverless Handler for Apple SHARP 3DGS Model

SHARP: Single-image High-fidelity Appearance Reconstruction with Primitives
Converts images into 3D Gaussian Splatting representations.

Input: Single image or batch of images (base64 or URL)
Output: PLY file(s) uploaded to S3/R2, returns URL(s)
"""

import base64
import logging
import os
import sys
import tempfile
import traceback
import uuid
from pathlib import Path

import boto3
import numpy as np
import runpod
import torch
import torch.nn.functional as F

# Add SHARP to path
sys.path.insert(0, "/app/ml-sharp/src")

from sharp.models import PredictorParams, create_predictor
from sharp.utils import io as sharp_io
from sharp.utils.gaussians import save_ply, unproject_gaussians

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

# Model URL for SHARP weights
DEFAULT_MODEL_URL = "https://ml-site.cdn-apple.com/models/sharp/sharp_2572gikvuh.pt"

# Global model instance (loaded once, reused across requests)
_model = None
_device = None


def get_device():
    """Get the best available device."""
    global _device
    if _device is None:
        if torch.cuda.is_available():
            _device = torch.device("cuda")
        elif hasattr(torch, "mps") and torch.mps.is_available():
            _device = torch.device("mps")
        else:
            _device = torch.device("cpu")
        LOGGER.info(f"Using device: {_device}")
    return _device


def get_model():
    """Lazy load the SHARP model on first request."""
    global _model
    if _model is None:
        LOGGER.info("Loading SHARP model...")
        device = get_device()

        # Load checkpoint
        LOGGER.info(f"Downloading model from {DEFAULT_MODEL_URL}")
        state_dict = torch.hub.load_state_dict_from_url(
            DEFAULT_MODEL_URL, progress=True
        )

        # Create predictor
        predictor = create_predictor(PredictorParams())
        predictor.load_state_dict(state_dict)
        predictor.eval()
        predictor.to(device)

        _model = predictor
        LOGGER.info("Model loaded successfully!")
    return _model


def decode_base64_image(base64_string: str, output_path: Path) -> None:
    """Decode a base64 encoded image and save to file."""
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_bytes = base64.b64decode(base64_string)
    with open(output_path, "wb") as f:
        f.write(image_bytes)


def download_image(url: str, output_path: Path) -> None:
    """Download image from URL."""
    import requests

    response = requests.get(url, timeout=60)
    response.raise_for_status()
    with open(output_path, "wb") as f:
        f.write(response.content)


def encode_file_to_base64(file_path: Path) -> str:
    """Encode a file to base64 string."""
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def upload_to_r2(file_path: Path, key: str) -> str:
    """
    Upload file to Cloudflare R2.

    Requires environment variables:
    - CLOUDFLARE_R2_TOKEN (format: "access_key_id:secret_access_key")
    - CLOUDFLARE_R2_ENDPOINT (e.g. "https://xxx.r2.cloudflarestorage.com")
    - CLOUDFLARE_R2_BUCKET (e.g. "splats")
    - CLOUDFLARE_R2_PUBLIC_URL (e.g. "https://pub-xxx.r2.dev")

    Returns public URL.
    """
    r2_endpoint = os.environ["CLOUDFLARE_R2_ENDPOINT"]
    r2_bucket = os.environ["CLOUDFLARE_R2_BUCKET"]
    r2_public_url = os.environ["CLOUDFLARE_R2_PUBLIC_URL"]

    # Parse token (format: "access_key_id:secret_access_key")
    r2_token = os.environ["CLOUDFLARE_R2_TOKEN"]
    access_key_id, secret_access_key = r2_token.split(":", 1)

    s3_client = boto3.client(
        "s3",
        endpoint_url=r2_endpoint,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )

    s3_client.upload_file(
        str(file_path),
        r2_bucket,
        key,
        ExtraArgs={"ContentType": "application/octet-stream"},
    )

    return f"{r2_public_url.rstrip('/')}/{key}"


@torch.no_grad()
def predict_gaussians(predictor, image: np.ndarray, f_px: float, device: torch.device):
    """
    Run SHARP inference to predict 3D Gaussians from an image.

    Args:
        predictor: The SHARP model
        image: Input RGB image as numpy array (H, W, 3), uint8
        f_px: Focal length in pixels
        device: Torch device

    Returns:
        Gaussians3D object
    """
    internal_shape = (1536, 1536)

    LOGGER.info("Running preprocessing...")

    # Convert image to tensor
    image_pt = (
        torch.from_numpy(image.copy()).float().to(device).permute(2, 0, 1) / 255.0
    )
    _, height, width = image_pt.shape
    disparity_factor = torch.tensor([f_px / width]).float().to(device)

    # Resize to internal resolution
    image_resized_pt = F.interpolate(
        image_pt[None],
        size=(internal_shape[1], internal_shape[0]),
        mode="bilinear",
        align_corners=True,
    )

    # Run inference
    LOGGER.info("Running inference...")
    gaussians_ndc = predictor(image_resized_pt, disparity_factor)

    LOGGER.info("Running postprocessing...")

    # Build intrinsics matrix
    intrinsics = (
        torch.tensor(
            [
                [f_px, 0, width / 2, 0],
                [0, f_px, height / 2, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ]
        )
        .float()
        .to(device)
    )

    intrinsics_resized = intrinsics.clone()
    intrinsics_resized[0] *= internal_shape[0] / width
    intrinsics_resized[1] *= internal_shape[1] / height

    # Unproject to world coordinates
    gaussians = unproject_gaussians(
        gaussians_ndc, torch.eye(4).to(device), intrinsics_resized, internal_shape
    )

    return gaussians, (height, width)


def process_single_image(
    predictor,
    device,
    temp_dir: Path,
    image_input: dict,
    index: int,
    job_id: str,
) -> dict:
    """
    Process a single image and return the result.

    Args:
        predictor: The SHARP model
        device: Torch device
        temp_dir: Temporary directory for file operations
        image_input: Dict with 'image' (base64) or 'image_url'
        index: Index of the image in the batch
        job_id: Job ID for naming the output file

    Returns:
        Result dict with status, ply_url, etc.
    """
    try:
        input_image_path = temp_dir / f"input_{index}.png"

        # Get input image
        if image_input.get("image"):
            LOGGER.info(f"[{index}] Decoding base64 image...")
            decode_base64_image(image_input["image"], input_image_path)
        elif image_input.get("image_url"):
            LOGGER.info(
                f"[{index}] Downloading image from {image_input['image_url']}..."
            )
            download_image(image_input["image_url"], input_image_path)
        else:
            return {
                "status": "error",
                "message": "Either 'image' (base64) or 'image_url' must be provided",
            }

        # Load image using SHARP's IO utilities
        LOGGER.info(f"[{index}] Loading image from {input_image_path}...")
        image, _, f_px = sharp_io.load_rgb(input_image_path)
        height, width = image.shape[:2]

        LOGGER.info(
            f"[{index}] Image size: {width}x{height}, focal length: {f_px:.2f}px"
        )

        # Run inference
        gaussians, image_shape = predict_gaussians(predictor, image, f_px, device)

        # Save PLY
        output_ply_path = temp_dir / f"output_{index}.ply"
        LOGGER.info(f"[{index}] Saving PLY to {output_ply_path}...")
        save_ply(gaussians, f_px, image_shape, output_ply_path)

        # Count gaussians
        num_gaussians = gaussians.mean_vectors.shape[1]
        LOGGER.info(f"[{index}] Generated {num_gaussians} Gaussians")

        # Upload to Cloudflare R2
        r2_key = f"{job_id}_{index}.ply"

        LOGGER.info(f"[{index}] Uploading PLY to R2: {r2_key}")
        ply_url = upload_to_r2(output_ply_path, r2_key)

        return {
            "status": "success",
            "ply_url": ply_url,
            "num_gaussians": num_gaussians,
            "image_size": {"width": width, "height": height},
            "focal_length_px": f_px,
        }

    except Exception as e:
        LOGGER.error(f"[{index}] Error during inference: {e}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


def handler(job):
    """
    RunPod handler function for SHARP 3DGS inference.

    Supports both single image and batch processing.

    Input format (single image):
    {
        "input": {
            "image": "<base64_encoded_image>",  # Required (or image_url)
            "image_url": "<url_to_image>",      # Alternative to image
        }
    }

    Input format (batch):
    {
        "input": {
            "images": [
                {"image": "<base64_encoded_image>"},
                {"image_url": "<url_to_image>"},
                ...
            ]
        }
    }

    Output format (single image):
    {
        "status": "success",
        "ply_url": "https://your-bucket.r2.dev/output.ply",
        "num_gaussians": <int>,
        "image_size": {"width": <int>, "height": <int>},
        "focal_length_px": <float>
    }

    Output format (batch):
    {
        "status": "success",
        "results": [
            {
                "status": "success",
                "ply_url": "https://your-bucket.r2.dev/output_0.ply",
                "num_gaussians": <int>,
                "image_size": {"width": <int>, "height": <int>},
                "focal_length_px": <float>
            },
            ...
        ]
    }
    """
    try:
        job_input = job.get("input", {})
        job_id = job.get("id", str(uuid.uuid4()))

        # Determine if batch or single mode
        images_batch = job_input.get("images")
        is_batch = images_batch is not None

        if is_batch:
            # Batch mode: process multiple images
            if not isinstance(images_batch, list) or len(images_batch) == 0:
                return {
                    "status": "error",
                    "message": "'images' must be a non-empty list of image objects",
                }
            LOGGER.info(f"Batch mode: processing {len(images_batch)} images")
        else:
            # Single mode: wrap in list for unified processing
            if not job_input.get("image") and not job_input.get("image_url"):
                return {
                    "status": "error",
                    "message": "Either 'image' (base64), 'image_url', or 'images' (batch) must be provided",
                }
            images_batch = [job_input]
            LOGGER.info("Single mode: processing 1 image")

        # Load model
        predictor = get_model()
        device = get_device()

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir = Path(temp_dir)

            results = []
            for i, image_input in enumerate(images_batch):
                result = process_single_image(
                    predictor, device, temp_dir, image_input, i, job_id
                )
                results.append(result)

            # Return results
            if is_batch:
                # Count successes and failures
                successes = sum(1 for r in results if r["status"] == "success")
                failures = len(results) - successes
                LOGGER.info(f"Batch complete: {successes} succeeded, {failures} failed")

                return {
                    "status": "success" if failures == 0 else "partial",
                    "results": results,
                    "summary": {
                        "total": len(results),
                        "succeeded": successes,
                        "failed": failures,
                    },
                }
            else:
                # Single mode: return the single result directly
                return results[0]

    except Exception as e:
        LOGGER.error(f"Error during inference: {e}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


# RunPod serverless entry point
runpod.serverless.start({"handler": handler})
