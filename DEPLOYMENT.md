# Progress Service - Production Deployment

## Overview

This setup is designed for production deployment where:
- **Development**: Uses `docker-compose.yml` with local MongoDB
- **Production**: Uses `docker-compose.prod.yml` to build the NestJS app only
- **MongoDB**: External (AWS DocumentDB, MongoDB Atlas, etc.)
- **CI/CD**: GitHub workflow builds and pushes to AWS ECR

## Files Structure

```
├── docker-compose.yml          # Development (with MongoDB)
├── docker-compose.prod.yml     # Production (app only)
├── .env.prod.example          # Production environment template
├── deploy.sh                  # Local build script
├── build.sh                   # Simple CI/CD build script
└── .github/workflows/
    └── deploy-to-aws-ecr.yaml # GitHub workflow
```

## Development Setup

```bash
# Start development environment (includes MongoDB)
docker-compose up -d

# Or using pnpm for development
pnpm install
pnpm run start:dev
```

## Production Build

### Local Build

```bash
# Build production image locally
./deploy.sh build

# Build and test
./deploy.sh test
```

### Environment Configuration

1. Copy environment template:
```bash
cp .env.prod.example .env.prod
```

2. Configure your external MongoDB connection:
```bash
# For AWS DocumentDB
MONGODB_URI=mongodb://username:password@your-cluster.cluster-xxxxxx.us-east-1.docdb.amazonaws.com:27017/progress_service_prod?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/progress_service_prod?retryWrites=true&w=majority
```

## CI/CD Pipeline

The GitHub workflow automatically:

1. **On Pull Request**: Runs tests and linting
2. **On Main Branch**: 
   - Runs tests
   - Builds Docker image
   - Pushes to AWS ECR

### Required GitHub Secrets

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### ECR Repository

Ensure your ECR repository exists:
```bash
aws ecr create-repository --repository-name ecs-multi-app-dev-progress-service --region us-east-1
```

## Production Deployment

Once the image is in ECR, you can deploy using your preferred method:

- **AWS ECS/Fargate**
- **Kubernetes**
- **Docker Swarm**
- **Plain Docker**

Example deployment with environment variables:
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="your_mongodb_connection_string" \
  -e JWT_SECRET="your_jwt_secret" \
  your-account.dkr.ecr.us-east-1.amazonaws.com/ecs-multi-app-dev-progress-service:latest
```

## Health Checks

The service includes health check endpoints:
- `/health` - Application health status
- Connects to MongoDB and verifies database connectivity

## Monitoring

Consider adding:
- Application Performance Monitoring (APM)
- Log aggregation (CloudWatch, ELK Stack)
- Metrics collection (Prometheus/Grafana)
- Error tracking (Sentry, Bugsnag)

## Security Notes

- Use environment variables for all secrets
- Enable SSL/TLS for MongoDB connections
- Use IAM roles in AWS instead of access keys when possible
- Regularly update base images and dependencies
- Implement proper CORS and security headers
