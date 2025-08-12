# CharacterCut Docker Setup

This document outlines how to run the CharacterCut backend using Docker while keeping the frontend on Vercel.

## Architecture

- **Frontend**: Deployed on Vercel (https://frontend-rouge-nine-81.vercel.app/)
- **Backend**: Docker container (can be deployed anywhere that supports Docker)

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned locally

## Local Development Setup

### 1. Start the Backend with Docker

```bash
# Navigate to project root
cd background-remover

# Build and start the Docker container
docker-compose up --build -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f charactercut-backend
```

### 2. Test the Backend

```bash
# Health check
curl http://localhost:8000/health

# API endpoints info
curl http://localhost:8000/
```

### 3. Frontend Configuration

The frontend is already configured to connect to:
- **Development**: `http://localhost:8000` (your Docker backend)
- **Production**: `https://background-remover-ekco.onrender.com` (fallback)

You can override the API URL by setting the `VITE_API_URL` environment variable in Vercel.

## Production Deployment Options

### Option 1: Deploy to Cloud Run (Recommended)

1. Build and push to Google Container Registry:
```bash
# Build for production
docker build -t charactercut-backend ./backend

# Tag for GCR
docker tag charactercut-backend gcr.io/your-project/charactercut-backend

# Push to GCR
docker push gcr.io/your-project/charactercut-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy charactercut-backend \
  --image gcr.io/your-project/charactercut-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2
```

### Option 2: Deploy to Railway

1. Connect your repository to Railway
2. Set the following environment variables:
   - `PORT=8000`
   - `STAGE=production`
3. Railway will automatically detect the Dockerfile and deploy

### Option 3: Deploy to AWS ECS

1. Push to AWS ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name charactercut-backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build, tag, and push
docker build -t charactercut-backend ./backend
docker tag charactercut-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/charactercut-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/charactercut-backend:latest
```

2. Create ECS task definition and service

### Option 4: Deploy to DigitalOcean App Platform

1. Create a new app in DigitalOcean
2. Connect to your GitHub repository
3. Configure build settings:
   - Build command: (leave empty - uses Dockerfile)
   - Run command: (leave empty - uses Dockerfile CMD)
   - HTTP port: 8000

## Environment Variables

For production deployment, set these environment variables:

```bash
# Required
STAGE=production
PORT=8000

# Optional
ALLOWED_ORIGINS=https://frontend-rouge-nine-81.vercel.app,https://yourfrontend.com
LOG_LEVEL=INFO
```

## Frontend Configuration for Production

Update your Vercel deployment with the production backend URL:

1. In Vercel dashboard, go to your project settings
2. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-domain.com`
3. Redeploy the frontend

## Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f charactercut-backend

# Rebuild and restart
docker-compose up --build -d

# Check container status
docker-compose ps

# Execute commands in container
docker-compose exec charactercut-backend bash

# Clean up unused images
docker system prune -a
```

## Troubleshooting

### Backend Health Check Failing

1. Check container logs:
```bash
docker-compose logs charactercut-backend
```

2. Verify port mapping:
```bash
docker-compose ps
```

3. Test container directly:
```bash
docker-compose exec charactercut-backend curl http://localhost:8000/health
```

### Frontend Cannot Connect to Backend

1. Verify CORS configuration in backend
2. Check the API URL in browser developer tools
3. Ensure backend is accessible from the internet (for production)

### Image Processing Errors

1. Check available memory in container:
```bash
docker stats charactercut-backend
```

2. Increase memory limits in docker-compose.yml if needed:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
```

## Monitoring and Logs

### Development

- Container logs: `docker-compose logs -f`
- Resource usage: `docker stats`

### Production

- Set up log aggregation (CloudWatch, DataDog, etc.)
- Configure health check endpoints
- Monitor resource usage and auto-scaling

## Security Considerations

1. **CORS**: Configure proper allowed origins in production
2. **Rate Limiting**: Already implemented in the backend
3. **File Validation**: Already implemented with size and type checks
4. **Image Cleanup**: Automatic 1-hour expiration implemented
5. **Container Security**: Using non-root user in Docker container

## Cost Optimization

1. **Auto-scaling**: Configure based on traffic patterns
2. **Resource Limits**: Set appropriate CPU and memory limits
3. **Storage**: Temporary files are automatically cleaned up
4. **CDN**: Consider using a CDN for processed images

## Next Steps

1. Set up monitoring and alerting
2. Configure auto-scaling based on load
3. Implement image caching strategies
4. Add request/response compression
5. Set up automated deployments with CI/CD