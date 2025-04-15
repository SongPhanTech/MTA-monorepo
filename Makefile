# Base Variables
REGISTRY := ghcr.io/songphantech
DEV_TAG := latest
RELEASE_TAG := release
SERVER := local
COMPOSE_CMD := docker compose up
IMG_PREFIX := mta-

# Package Names
PKG_MODEL := model
PKG_CATEGORIES := ql-danh-muc
PKG_TRAINING := ql-dao-tao
PKG_USER := ql-nguoi-dung

# Maps for build types (backend/frontend)
PKGS := $(PKG_MODEL) $(PKG_CATEGORIES) $(PKG_TRAINING) $(PKG_USER)

# Targets
.PHONY: all clean push deploy release \
	build-% all-%

help:
	@echo "Available targets:"
	@echo "  build-be-$(PKG_MODEL)"
	@echo "  build-be-$(PKG_CATEGORIES)"
	@echo "  build-be-$(PKG_TRAINING)"
	@echo "  build-be-$(PKG_USER)"
	@echo "  build-fe-$(PKG_MODEL)"
	@echo "  build-fe-$(PKG_CATEGORIES)"
	@echo "  build-fe-$(PKG_TRAINING)"
	@echo "  build-fe-$(PKG_USER)"

# Pattern rule: build-<name>
build-be-%:
	$(MAKE) _build-be PACKAGE=$*

build-fe-%:
	$(MAKE) _build-fe PACKAGE=$*

# Pattern rule: all-<name> = build + push + deploy
all-be-%: build-be-%
	docker push $(REGISTRY)/$(IMG_PREFIX)-be-$*:$(DEV_TAG)
	ssh $(SERVER) "cd docker-compose && git pull && $(COMPOSE_CMD) $(IMG_PREFIX)-be-$* -d"

all-fe-%: build-fe-%
	docker push $(REGISTRY)/$(IMG_PREFIX)-fe-$*:$(DEV_TAG)
	ssh $(SERVER) "cd docker-compose && git pull && $(COMPOSE_CMD) $(IMG_PREFIX)-fe-$* -d"

# Internal backend build
_build-be:
	docker build -f Dockerfile.backend --platform linux/amd64 \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
		--build-arg FILTER=@backend/${PACKAGE} \
		--build-arg PACKAGE=${PACKAGE} \
		. --output type=docker

# Internal frontend build
_build-fe:
	docker build --platform linux/amd64 \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
		--build-arg FILTER=@client/${PACKAGE} \
		--build-arg PACKAGE=${PACKAGE} \
		.

# Push specific image manually
push:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make push PACKAGE=<package-name>')
endif
	docker push $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG)

# Release
release:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make release PACKAGE=<package-name>')
endif
	docker build -f Dockerfile.backend --platform linux/amd64 -t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(RELEASE_TAG) .
	docker push $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(RELEASE_TAG)
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) $(IMG_PREFIX)${PACKAGE} -d"

# Deploy only
deploy:
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) $(IMG_PREFIX)${PACKAGE} -d"

# Clean image
clean:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make clean PACKAGE=<package-name>')
endif
	docker rmi $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) || true
