# SHARP 3DGS RunPod Inference Service

Deploy Apple's [SHARP](https://github.com/apple/ml-sharp) (Single-image High-fidelity Appearance Reconstruction with Primitives) model as a serverless inference endpoint on RunPod.

**Input**: Single RGB image  
**Output**: 3D Gaussian Splatting PLY file

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t sharp-runpod .
```

### 2. Push to Docker Hub (or your registry)

```bash
docker tag sharp-runpod your-username/sharp-runpod:latest
docker push your-username/sharp-runpod:latest
```

### 3. Deploy on RunPod

1. Go to [RunPod Serverless](https://www.runpod.io/console/serverless)
2. Create a new endpoint
3. Select your Docker image: `your-username/sharp-runpod:latest`
4. Configure GPU (recommended: RTX 3090/4090 or A10G, minimum 24GB VRAM)
5. Deploy

## API Usage

### Request Format

```json
{
  "input": {
    "image": "<base64_encoded_image>"
  }
}
```

Or using an image URL:

```json
{
  "input": {
    "image_url": "https://example.com/image.jpg"
  }
}
```

### Response Format

```json
{
  "status": "success",
  "ply": "<base64_encoded_ply_file>",
  "num_gaussians": 589824,
  "image_size": {"width": 1920, "height": 1080},
  "focal_length_px": 1234.56
}
```

### Example: Python Client

```python
import runpod
import base64

runpod.api_key = "your-runpod-api-key"

# Load image
with open("input.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Run inference
endpoint = runpod.Endpoint("your-endpoint-id")
result = endpoint.run_sync({
    "input": {
        "image": image_base64
    }
})

# Save PLY output
if result["status"] == "success":
    ply_data = base64.b64decode(result["ply"])
    with open("output.ply", "wb") as f:
        f.write(ply_data)
    print(f"Generated {result['num_gaussians']} Gaussians")
```

### Example: cURL

```bash
# Using base64 image
IMAGE_BASE64=$(base64 -w 0 input.jpg)
curl -X POST "https://api.runpod.ai/v2/your-endpoint-id/runsync" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d "{\"input\": {\"image\": \"$IMAGE_BASE64\"}}"

# Using image URL
curl -X POST "https://api.runpod.ai/v2/your-endpoint-id/runsync" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": {"image_url": "https://example.com/photo.jpg"}}'
```

## Output PLY Format

The output PLY file is compatible with standard 3D Gaussian Splatting viewers:

- [WebGL Gaussian Splat Viewer](https://antimatter15.com/splat/)
- [gsplat](https://github.com/nerfstudio-project/gsplat)
- [3D Gaussian Splatting (original)](https://github.com/graphdeco-inria/gaussian-splatting)

The PLY contains:
- 3D Gaussian positions (mean vectors)
- Covariance matrices (quaternions + scales)
- Spherical harmonics (degree 0, RGB color)
- Opacity values

Coordinate system: OpenCV convention (x right, y down, z forward)

## Local Testing

```bash
# Build
docker build -t sharp-runpod .

# Run locally (requires NVIDIA GPU)
docker run --gpus all -p 8000:8000 sharp-runpod

# Test with a sample request
curl -X POST http://localhost:8000/runsync \
  -H "Content-Type: application/json" \
  -d '{"input": {"image_url": "https://example.com/test.jpg"}}'
```

## Hardware Requirements

- **GPU**: NVIDIA GPU with CUDA support (24GB+ VRAM recommended)
- **Inference time**: ~1 second per image on RTX 4090
- **Model size**: ~185MB (downloaded automatically on first run)

## Model Details

SHARP predicts 3D Gaussian parameters directly from a single image in under one second. The model:

1. Takes an RGB image as input
2. Estimates monocular depth
3. Predicts Gaussian parameters (position, covariance, color, opacity) in NDC space
4. Unprojects to world coordinates using camera intrinsics

The output is a dense 3D representation suitable for novel view synthesis.

## License

SHARP model and code: See [Apple's ml-sharp repository](https://github.com/apple/ml-sharp) for licensing terms.
