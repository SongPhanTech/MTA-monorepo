# Variables
IMAGE_NAME=ghcr.io/songphantech/mta
DEV_TAG=latest
RELEASE_TAG=release
SERVER=swantech
COMPOSE_CMD=docker compose up

# TODO: update to prod database
DATABASE_URL="postgresql://root:root@postgres.my-turborepo.orb.local:5432/mydb?schema=public"

.PHONY: all build build-backend build-web push deploy release clean

# Default target: build, push, and deploy for development
all: build push deploy

# Build the Docker image for development
build:
	docker build -t $(IMAGE_NAME):$(DEV_TAG) .

backend-image:
	docker build -f Dockerfile.backend -t $(IMAGE_NAME)-backend:$(DEV_TAG) --build-arg FILTER=backend .

web-image:
	docker build -t $(IMAGE_NAME)-web:$(DEV_TAG) --build-arg FILTER=web --build-arg DATABASE_URL=$(DATABASE_URL) .

# Push the development image to the registry
push:
	docker push $(IMAGE_NAME):$(DEV_TAG)

# Deploy the development image to the remote server
deploy:
	ssh $(SERVER) $(COMPOSE_CMD) mta_be -d

# Build, push, and deploy the release image
release:
	docker build -t $(IMAGE_NAME):$(RELEASE_TAG) .
	docker push $(IMAGE_NAME):$(RELEASE_TAG)
	ssh $(SERVER) $(COMPOSE_CMD) mta_be -d

# Clean up local Docker images
clean:
	docker rmi $(IMAGE_NAME):$(DEV_TAG) $(IMAGE_NAME):$(RELEASE_TAG) || true
