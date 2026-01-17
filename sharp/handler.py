"""
RunPod Serverless Handler for Apple SHARP 3DGS Model

SHARP: Single-image High-fidelity Appearance Reconstruction with Primitives
Converts a single image into a 3D Gaussian Splatting representation.

Input: Single image (base64 or URL)
Output: PLY file containing 3D Gaussian Splat
"""

import base64
import logging
import os
import sys
import tempfile
import traceback
from pathlib import Path

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


def handler(job):
    """
    RunPod handler function for SHARP 3DGS inference.

    Input format:
    {
        "input": {
            "image": "<base64_encoded_image>",  # Required (or image_url)
            "image_url": "<url_to_image>",      # Alternative to image
        }
    }

    Output format:
    {
        "ply": "<base64_encoded_ply_file>",
        "status": "success",
        "num_gaussians": <int>
    }
    """
    try:
        job_input = job.get("input", {})

        # Validate input
        if not job_input.get("image") and not job_input.get("image_url"):
            return {
                "status": "error",
                "message": "Either 'image' (base64) or 'image_url' must be provided",
            }

        # Load model
        predictor = get_model()
        device = get_device()

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir = Path(temp_dir)
            input_image_path = temp_dir / "input.png"

            # Get input image
            if job_input.get("image"):
                LOGGER.info("Decoding base64 image...")
                decode_base64_image(job_input["image"], input_image_path)
            else:
                LOGGER.info(f"Downloading image from {job_input['image_url']}...")
                download_image(job_input["image_url"], input_image_path)

            # Load image using SHARP's IO utilities
            LOGGER.info(f"Loading image from {input_image_path}...")
            image, _, f_px = sharp_io.load_rgb(input_image_path)
            height, width = image.shape[:2]

            LOGGER.info(f"Image size: {width}x{height}, focal length: {f_px:.2f}px")

            # Run inference
            gaussians, image_shape = predict_gaussians(predictor, image, f_px, device)

            # Save PLY
            output_ply_path = temp_dir / "output.ply"
            LOGGER.info(f"Saving PLY to {output_ply_path}...")
            save_ply(gaussians, f_px, image_shape, output_ply_path)

            # Count gaussians
            num_gaussians = gaussians.mean_vectors.shape[1]
            LOGGER.info(f"Generated {num_gaussians} Gaussians")

            # Encode PLY to base64
            ply_base64 = encode_file_to_base64(output_ply_path)

            return {
                "status": "success",
                "ply": ply_base64,
                "num_gaussians": num_gaussians,
                "image_size": {"width": width, "height": height},
                "focal_length_px": f_px,
            }

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
