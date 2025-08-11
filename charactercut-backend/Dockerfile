FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for rembg
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the u2net model to speed up cold starts
RUN python -c "from rembg import new_session; new_session('u2net')"

# Copy application code
COPY . .

EXPOSE 8080

# Create a simple WSGI server for the API
CMD ["python", "-c", "from api.process import handler; import http.server; http.server.HTTPServer(('0.0.0.0', 8080), handler).serve_forever()"]