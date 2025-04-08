# Base Variables
REGISTRY := ghcr.io/songphantech
DEV_TAG := latest
RELEASE_TAG := release
SERVER := local
COMPOSE_CMD := docker compose -f docker-compose.mta.yml up

# Image Names
IMAGE_BACKEND := $(REGISTRY)/mta_be
IMAGE_QL_NGUOI_DUNG := $(REGISTRY)/mta-ql-nguoi-dung
IMAGE_THI_TRAC_NGHIEM := $(REGISTRY)/mta-thi-trac-nghiem

# Build Filters
FILTER_BACKEND := @backend/ql-nguoi-dung
FILTER_QL_NGUOI_DUNG := @client/ql-nguoi-dung
FILTER_THI_TRAC_NGHIEM := @client/thi-trac-nghiem

# Package Names
PACKAGE_BACKEND := be
PACKAGE_QL_NGUOI_DUNG := ql-nguoi-dung

# Default target
.PHONY: all build push deploy release clean all-be all-ql-nguoi-dung all-thi-trac-nghiem build-backend build-ql-nguoi-dung build-thi-trac-nghiem

all-be:
	MAKE build-backend
	docker push $(IMAGE_BACKEND):$(DEV_TAG)
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) mta_$(PACKAGE_BACKEND) -d"

all-ql-nguoi-dung:
	MAKE build-ql-nguoi-dung
	docker push $(IMAGE_QL_NGUOI_DUNG):$(DEV_TAG)
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) mta-$(PACKAGE_QL_NGUOI_DUNG) -d"

# Build an image by specifying IMAGE and FILTER dynamically
build:
ifndef IMAGE
	$(error IMAGE is not set. Use 'make build IMAGE=<image-name>')
endif
ifndef FILTER
	$(error FILTER is not set. Use 'make build FILTER=<filter-value>')
endif
	docker build -t $(IMAGE):$(DEV_TAG) --build-arg FILTER=$(FILTER) --build-arg PACKAGE=$(PACKAGE) .

# Named builds for convenience
build-backend:
	docker build -f Dockerfile.backend -t $(IMAGE_BACKEND):$(DEV_TAG) .

build-ql-nguoi-dung:
	MAKE build IMAGE=$(IMAGE_QL_NGUOI_DUNG) FILTER=$(FILTER_QL_NGUOI_DUNG) PACKAGE=$(PACKAGE_QL_NGUOI_DUNG)

# Push a specific image
push:
ifndef IMAGE
	$(error IMAGE is not set. Use 'make push IMAGE=<image-name>')
endif
	docker push $(IMAGE):$(DEV_TAG)

# Deploy the application
deploy:
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) -d"

# Release (Build, push, and deploy release versions)
release:
ifndef IMAGE
	$(error IMAGE is not set. Use 'make release IMAGE=<image-name>')
endif
	docker build -t $(IMAGE):$(RELEASE_TAG) .
	docker push $(IMAGE):$(RELEASE_TAG)
	ssh $(SERVER) "$(COMPOSE_CMD) -d"

# Clean up Docker images
clean:
	docker rmi $(IMAGE_BACKEND):$(DEV_TAG) $(IMAGE_QL_NGUOI_DUNG):$(DEV_TAG) $(IMAGE_THI_TRAC_NGHIEM):$(DEV_TAG) || true
