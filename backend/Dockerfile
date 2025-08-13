# CharacterCut Backend Dockerfile - Docker Compatible
FROM python:3.11-slim

# Install system dependencies for image processing
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy lightweight requirements
COPY requirements-docker.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ src/
COPY simple_main.py .

# Expose port
EXPOSE 8000

# Set environment variables for better Docker compatibility
ENV PYTHONPATH=/app
ENV OMP_NUM_THREADS=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Default command
CMD ["uvicorn", "simple_main:app", "--host", "0.0.0.0", "--port", "8000"]