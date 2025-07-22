# Base Variables
REGISTRY := ghcr.io/songphantech
DEV_TAG := latest
RELEASE_TAG := release
SERVER := local
COMPOSE_CMD := docker compose up
IMG_PREFIX := mta-

# Package Names
PKG_BE_MODEL := be-model
PKG_BE_USER := be-ql-nguoi-dung
PKG_BE_CATEGORIES := be-ql-danh-muc
PKG_BE_DAO_TAO := be-ql-dao-tao

PKG_CATEGORIES := ql-danh-muc
PKG_KHAO_THI := khao-thi
PKG_DAO_TAO := ql-dao-tao
PKG_HO_SO := ql-ho-so
PKG_USER := ql-nguoi-dung
PKG_AI := tro-ly-ao

# Maps for build types (backend/frontend)
BE_PKGS := $(PKG_BE_MODEL) $(PKG_BE_USER) $(PKG_BE_CATEGORIES) $(PKG_BE_DAO_TAO)
FE_PKGS := $(PKG_CATEGORIES) $(PKG_DAO_TAO) $(PKG_USER) $(PKG_AI) $(PKG_KHAO_THI) $(PKG_HO_SO)

# Targets
.PHONY: all clean push deploy release \
	build-% all-%

help:
	@echo "Available targets:"
	@echo "  all-$(PKG_BE_MODEL)"
	@echo "  all-$(PKG_BE_USER)"
	@echo "  all-$(PKG_BE_CATEGORIES)"
	@echo "  all-$(PKG_BE_DAO_TAO)"
	@echo "  all-$(PKG_CATEGORIES)"
	@echo "  all-$(PKG_DAO_TAO)"
	@echo "  all-$(PKG_HO_SO)"
	@echo "  all-$(PKG_KHAO_THI)"
	@echo "  all-$(PKG_USER)"
	@echo "  all-$(PKG_AI)"
	@echo "  all-clients"

ql-dao-tao:
	cd apps/client/ql-dao-tao && \
	pnpm build && \
	zip -r out.zip out && \
	scp out.zip swan1:app && \
	ssh swan1 "cd app && docker compose -f app-docker-compose.yml down && rm -rf lms-cdn && unzip out.zip && mv out lms-cdn && docker compose -f app-docker-compose.yml up -d"

# Pattern rule: build-<name>
build-%:
	@echo "Target: $*"
	@echo "BE_PKGS: $(BE_PKGS)"
	@echo "FE_PKGS: $(FE_PKGS)"
	@if echo "$(BE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		echo "Matched BE → building backend"; \
		$(MAKE) _build-be PACKAGE=$*; \
	elif echo "$(FE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		echo "Matched FE → building frontend"; \
		$(MAKE) _build-fe PACKAGE=$*; \
	else \
		echo "Unknown package '$*'. Must be one of: $(BE_PKGS) $(FE_PKGS)"; \
		exit 1; \
	fi

all-clients: all-$(PKG_CATEGORIES)\
			 all-$(PKG_USER)\
			 all-$(PKG_AI)
# Pattern rule: all-<name> = build + push + deploy
all-%: build-%
	docker push $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG)
	ssh $(SERVER) "cd docker-compose && git pull && $(COMPOSE_CMD) $(IMG_PREFIX)$* -d"

# Internal backend build
_build-be:
	docker build -f Dockerfile.backend --platform linux/amd64 \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
		--build-arg PACKAGE=${PACKAGE} \
		. --output type=docker

# Internal frontend build
_build-fe:
	docker build --platform linux/amd64 \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
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
	docker build -t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(RELEASE_TAG) .
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
