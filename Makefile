# Variables
IMAGE_NAME=ghcr.io/songphantech/mta
DEV_TAG=latest
RELEASE_TAG=release
SERVER=swantech
COMPOSE_CMD=docker compose up

# TODO: update to prod database
DATABASE_URL="postgresql://root:root@postgres.mta-monorepo.orb.local:5432/mta?schema=public"

.PHONY: all build build-backend build-web push deploy release clean

# Default target: build, push, and deploy for development
all: build push deploy

# Build the Docker image for development
build:
	docker build -t $(IMAGE_NAME):$(DEV_TAG) .

backend-image:
	docker build -f Dockerfile.backend -t $(IMAGE_NAME)_be:$(DEV_TAG) --build-arg FILTER=backend .

ql-nguoi-dung-image:
	docker build -t $(IMAGE_NAME)-client-ql-nguoi-dung:$(DEV_TAG) --build-arg FILTER=@client/ql-nguoi-dung --build-arg PACKAGE=ql-nguoi-dung .

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
