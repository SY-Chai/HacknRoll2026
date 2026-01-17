# SHARP 3DGS RunPod Inference Service
# Apple's SHARP: Single-image High-fidelity Appearance Reconstruction with Primitives
FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    build-essential \
    ninja-build \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set python3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Upgrade pip
RUN python -m pip install --upgrade pip setuptools wheel

WORKDIR /app

# Install PyTorch with CUDA 12.4 support
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# Clone Apple's SHARP repository
RUN git clone https://github.com/apple/ml-sharp.git /app/ml-sharp

# Install SHARP as a package (editable install)
WORKDIR /app/ml-sharp
RUN pip install -e .

# Install RunPod
RUN pip install runpod requests

# Copy handler code
WORKDIR /app
COPY handler.py /app/handler.py

# Pre-download the model weights at build time (optional, ~185MB)
# This downloads the default model to torch hub cache
RUN python -c "import torch; torch.hub.load_state_dict_from_url('https://ml-site.cdn-apple.com/models/sharp/sharp_2572gikvuh.pt', progress=True)"

# Set the entrypoint
CMD ["python", "-u", "handler.py"]
