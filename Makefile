# Base Variables
DOCKER := $(shell which docker 2>/dev/null || echo docker)
REGISTRY := ghcr.io/songphantech
DEV_TAG := latest
RELEASE_TAG := release
COMPOSE_CMD := docker compose up
IMG_PREFIX := mta-

# TK Promox (192.168.100.100:8006) root/Abc@12345

# ─────────────────────────────────────────────────────────────────────────────
# Server Profiles
# Usage: make <target> SERVER_PROFILE=<profile>
# Example: make deploy-cdn SERVER_PROFILE=app2
#
# Each profile defines:
#   SERVER_HOST      – SSH alias or user@host
#   SERVER_PASSWORD  – (optional) password for sshpass; leave empty to use SSH keys
#   BE_DEPLOY_DIR    – directory on server where docker-images are extracted
#   BE_APP_DIR       – directory on server where BE docker-compose lives
#   FE_APP_DIR       – directory on server where FE CDN dirs + compose file live
#   FE_COMPOSE_FILE  – docker-compose filename used for FE services on the server
#   FE_APP_URL       – base URL injected as NEXT_PUBLIC_APP_URL at build time
#                      (overrides .env; each profile sets its own domain)
#   ONLY_OFFICE_ENDPOINT – OnlyOffice server URL injected as
#                          NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT at build time
# ─────────────────────────────────────────────────────────────────────────────
SERVER_PROFILE ?= app

# ── Profile: swan1 ────────────────────────────────────────────────────────────
ifeq ($(SERVER_PROFILE),swan1)
  SERVER_HOST      := swan1
  SERVER_PASSWORD  :=
  BE_DEPLOY_DIR    := ~/mta-be
  BE_APP_DIR       := ~/mta-be
  FE_APP_DIR       := ~/mta-app
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := https://mta.swantech.vn
  ONLY_OFFICE_ENDPOINT := https://doc.mta.swantech.vn

# ── Profile: swantech_x52 ─────────────────────────────────────────────────────────────
else ifeq ($(SERVER_PROFILE),swantech_x52)
  SERVER_HOST      := swantech_x52
  SERVER_PASSWORD  :=
  BE_DEPLOY_DIR    := ~/app_mta_sso/mta-be
  BE_APP_DIR       := ~/app_mta_sso/mta-be
  FE_APP_DIR       := ~/app_mta_sso
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := https://demodaotao.swantech.vn
  ONLY_OFFICE_ENDPOINT := https://doc.x52.swantech.vn

# ── Profile: local_mta ─────────────────────────────────────────────────────────────
else ifeq ($(SERVER_PROFILE),local_mta)
  SERVER_HOST      := local_mta
  SERVER_PASSWORD  :=
  BE_DEPLOY_DIR    := ~/mta-prod/be
  BE_APP_DIR       := ~/mta-prod/be
  FE_APP_DIR       := ~/app
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := http://192.168.0.102
  ONLY_OFFICE_ENDPOINT := http://192.168.0.102:3100

# ── Profile: app2 ─────────────────────────────────────────────────────────────
else ifeq ($(SERVER_PROFILE),app)
  SERVER_HOST      := app
  SERVER_PASSWORD  := 
  BE_DEPLOY_DIR    := ~/app/be
  BE_APP_DIR       := ~/app/be
  FE_APP_DIR       := ~/app/fe
  FE_COMPOSE_FILE  := docker-compose.yml
  FE_APP_URL       := http://192.168.100.134
  ONLY_OFFICE_ENDPOINT := http://192.168.100.133:3100
else ifeq ($(SERVER_PROFILE),mta_online)
  SERVER_HOST      := mta_online
  SERVER_PASSWORD  := 5Qaz@106186
  BE_DEPLOY_DIR    := ~/mta-app/be
  BE_APP_DIR       := ~/mta-app/be
  FE_APP_DIR       := ~/mta-app/fe
  FE_COMPOSE_FILE  := docker-compose.yml
  FE_APP_URL       := http://27.71.20.109
  ONLY_OFFICE_ENDPOINT := http://27.71.20.109:3100

# ── Fallback: unknown profile ─────────────────────────────────────────────────
else
  $(error Unknown SERVER_PROFILE "$(SERVER_PROFILE)". \
    Add a new profile block in the Makefile or choose from: swan1, swantech_x52, local_mta, app2)
endif

# SSH / SCP helpers (automatically use sshpass when a password is set)
ifneq ($(SERVER_PASSWORD),)
  SSH  := sshpass -p "$(SERVER_PASSWORD)" ssh
  SCP  := sshpass -p "$(SERVER_PASSWORD)" scp
else
  SSH  := ssh
  SCP  := scp
endif

# Convenience alias kept for backward-compat with older targets that used SERVER
SERVER := $(SERVER_HOST)

# Package Names
PKG_BE_MODEL := be-model
PKG_BE_DAO_TAO := be-ql-dao-tao
PKG_BE_KHAO_THI := be-khao-thi
PKG_BE_PORTAL := be-portal
PKG_BE_DAO_TAO_SHARED := be-ql-dao-tao-shared
PKG_BE_EXCHANGE := be-exchange

PKG_KHAO_THI := khao-thi
PKG_DAO_TAO := ql-dao-tao
PKG_HO_SO := ql-ho-so
PKG_AI := tro-ly-ao
PKG_CONG_HOC_VIEN := cong-hoc-vien
PKG_CONG_GIANG_VIEN := cong-giang-vien

# Maps for build types (backend/frontend)
BE_PKGS := $(PKG_BE_MODEL) $(PKG_BE_DAO_TAO) $(PKG_BE_KHAO_THI) $(PKG_BE_PORTAL) $(PKG_BE_DAO_TAO_SHARED) $(PKG_BE_EXCHANGE)
# FE_PKGS := $(PKG_DAO_TAO) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_DANG_KY_HOC)
FE_PKGS := $(PKG_DAO_TAO) $(PKG_AI) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_CONG_HOC_VIEN) $(PKG_CONG_GIANG_VIEN)

# Client App Mappings
CDN_NAME_ql-dao-tao = lms-cdn
ROUTER_NAME_ql-dao-tao = lms
CDN_NAME_cong-hoc-vien = cong-hoc-vien-cdn
ROUTER_NAME_cong-hoc-vien = cong-hoc-vien
CDN_NAME_tro-ly-ao = chatbot-cdn
ROUTER_NAME_tro-ly-ao = chatbot
CDN_NAME_ql-ho-so = hrm-cdn
ROUTER_NAME_ql-ho-so = hrm
CDN_NAME_khao-thi = ems-cdn
ROUTER_NAME_khao-thi = ems
CDN_NAME_cong-giang-vien = cong-giang-vien-cdn
ROUTER_NAME_cong-giang-vien = cong-giang-vien

# Per-app URL suffix appended to FE_APP_URL → NEXT_PUBLIC_APP_URL
# Format: <domain from profile><suffix below>  e.g. https://mta.swantech.vn/lms/home
APP_URL_SUFFIX_ql-dao-tao   = /lms/home
APP_URL_SUFFIX_khao-thi     = /ems/home
APP_URL_SUFFIX_cong-hoc-vien  = /cong-hoc-vien/home
APP_URL_SUFFIX_ql-ho-so     = /hrm/home
APP_URL_SUFFIX_tro-ly-ao    = /chatbot/?mode=tro-ly-ao
APP_URL_SUFFIX_cong-giang-vien = /conggiangvien/home

# Targets
.PHONY: all clean push deploy release all-be build-all-be build-all-fe ship-fe \
	build-% all-% save-docker-images package-cdn _package-fe-cdn-copy \
	_load-be-images-on-server _recreate-be-containers

# Docker image refs (ghcr.io/songphantech/mta-be-model:latest, ...)
BE_IMAGE_TAGS = $(foreach pkg,$(BE_PKGS),$(REGISTRY)/$(IMG_PREFIX)$(pkg):$(DEV_TAG))
BE_CONTAINER_NAMES = $(foreach pkg,$(BE_PKGS),$(IMG_PREFIX)$(pkg))

# Optional: make build-all-be NO_CACHE=1
DOCKER_BUILD_FLAGS ?=
ifeq ($(NO_CACHE),1)
  DOCKER_BUILD_FLAGS := --no-cache
endif

help:
	@echo "Available targets:"
	@echo "  all-$(PKG_BE_MODEL)"
	@echo "  all-$(PKG_BE_DAO_TAO)"
	@echo "  all-$(PKG_BE_KHAO_THI)"
	@echo "  all-$(PKG_BE_PORTAL)"
	@echo "  all-$(PKG_DAO_TAO)"
	@echo "  all-$(PKG_HO_SO)"
	@echo "  all-$(PKG_KHAO_THI)"
	@echo "  all-$(PKG_AI)"
	@echo "  all-$(PKG_PORTAL)"
	@echo "  all-$(PKG_BE_DAO_TAO_SHARED)"
	@echo "  all-be"
	@echo "  build-all-be"
	@echo "  build-all-fe"
	@echo "  all-clients"
	@echo "  save-docker-images"
	@echo "  package-cdn"

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

all-be:
	@for pkg in $(BE_PKGS); do \
		$(MAKE) all-$$pkg; \
	done

build-all-be:
	@for pkg in $(BE_PKGS); do \
		$(MAKE) build-$$pkg; \
	done

build-all-fe:
	@for pkg in $(FE_PKGS); do \
		$(MAKE) build-$$pkg; \
	done

# Build all FE apps, package them, and deploy to the active SERVER_PROFILE in one shot.
# Usage: make ship-fe SERVER_PROFILE=swantech_x52
ship-fe: build-all-fe package-cdn deploy-cdn
ship-be: build-all-be save-docker-images deploy-all-be

all-clients:
	@for pkg in $(FE_PKGS); do \
		$(MAKE) all-$$pkg; \
	done

save-docker-images:
	@mkdir -p docker-images
	@for pkg in $(BE_PKGS); do \
		img="$(REGISTRY)/$(IMG_PREFIX)$$pkg:$(DEV_TAG)"; \
		if ! $(DOCKER) image inspect "$$img" >/dev/null 2>&1; then \
			echo "ERROR: Image not found: $$img (run make build-$$pkg first)"; \
			exit 1; \
		fi; \
		echo "Saving $$pkg ($$($(DOCKER) image inspect "$$img" --format '{{.Id}}'))..."; \
		($(DOCKER) save "$$img" | gzip > docker-images/$(IMG_PREFIX)$$pkg.tar.gz) & \
	done; \
	wait; \
	echo "All images saved."

# Server-side: remove old :latest tags so docker load always assigns tag to new image.
_load-be-images-on-server:
	$(SSH) $(SERVER_HOST) 'set -eu; \
	cd "$(BE_DEPLOY_DIR)/docker-images"; \
	for f in *.tar.gz; do \
		[ -f "$$f" ] || continue; \
		echo "Loading $$f..."; \
		docker load -i "$$f"; \
	done; \
	echo "Loaded images:"; \
	for img in $(BE_IMAGE_TAGS); do \
		docker image inspect "$$img" --format "  {{.Id}} {{.RepoTags}}" 2>/dev/null || echo "  MISSING $$img"; \
	done'

_recreate-be-containers:
	$(SSH) $(SERVER_HOST) 'set -eu; \
	cd "$(BE_APP_DIR)"; \
	echo "Recreating BE containers..."; \
	COMPOSE_PULL_POLICY=never docker compose up -d --force-recreate --no-build $(BE_CONTAINER_NAMES)'

deploy-cdn:
	$(SCP) -O cdn.zip $(SERVER_HOST):$(FE_APP_DIR)/
	$(SSH) $(SERVER_HOST) "set -eu; cd $(FE_APP_DIR) && \
	rm -rf cong-hoc-vien-cdn/ dang-ky-hoc-cdn/ lms-cdn/ ems-cdn/ hrm-cdn/ chatbot-cdn/ cong-giang-vien-cdn/ && \
	unzip -oq cdn.zip && \
	mv cdn/* . && \
	rmdir cdn 2>/dev/null || true && \
	COMPOSE_PULL_POLICY=never docker compose -f $(FE_COMPOSE_FILE) up -d --force-recreate --no-build"

deploy-all-be:
	@rm -f docker-images.zip
	@zip -r docker-images.zip docker-images
	$(SCP) -O docker-images.zip $(SERVER_HOST):$(BE_DEPLOY_DIR)/
	$(SSH) $(SERVER_HOST) 'set -eu; \
	cd "$(BE_DEPLOY_DIR)" && unzip -oq docker-images.zip; \
	cd "$(BE_APP_DIR)" && \
	echo "Stopping BE containers..." && \
	docker compose stop $(BE_CONTAINER_NAMES) 2>/dev/null || true; \
	docker rm -f $(BE_CONTAINER_NAMES) 2>/dev/null || true; \
	echo "Removing old image tags..." && \
	for img in $(BE_IMAGE_TAGS); do docker rmi "$$img" 2>/dev/null || true; done; \
	docker image prune -f >/dev/null'
	@$(MAKE) _load-be-images-on-server
	@$(MAKE) _recreate-be-containers

package-cdn:
	@rm -rf cdn cdn.zip
	@mkdir -p cdn
	@for pkg in $(FE_PKGS); do \
		$(MAKE) _package-fe-cdn-copy PACKAGE=$$pkg; \
	done
	@zip -r -q cdn.zip cdn

deploy-%:
	@mkdir -p docker-images
	@img="$(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG)"; \
	if ! $(DOCKER) image inspect "$$img" >/dev/null 2>&1; then \
		echo "ERROR: Image not found: $$img (run make build-$* first)"; \
		exit 1; \
	fi; \
	echo "Saving $* ($$($(DOCKER) image inspect "$$img" --format '{{.Id}}'))..."; \
	$(DOCKER) save "$$img" | gzip > docker-images/$(IMG_PREFIX)$*.tar.gz
	$(SSH) $(SERVER_HOST) "mkdir -p $(BE_DEPLOY_DIR)/docker-images"
	$(SCP) -O docker-images/$(IMG_PREFIX)$*.tar.gz $(SERVER_HOST):$(BE_DEPLOY_DIR)/docker-images/
	$(SSH) $(SERVER_HOST) 'set -eu; \
	svc="$(IMG_PREFIX)$*"; img="$(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG)"; \
	cd "$(BE_APP_DIR)" && \
	echo "Stopping $$svc..." && \
	docker compose stop "$$svc" 2>/dev/null || true; \
	docker rm -f "$$svc" 2>/dev/null || true; \
	echo "Removing old tag $$img..." && \
	docker rmi "$$img" 2>/dev/null || true; \
	echo "Loading new image..." && \
	docker load -i "$(BE_DEPLOY_DIR)/docker-images/$(IMG_PREFIX)$*.tar.gz"; \
	docker image inspect "$$img" --format "Loaded {{.Id}}"; \
	cd "$(BE_APP_DIR)" && \
	COMPOSE_PULL_POLICY=never docker compose up -d --force-recreate --no-build "$$svc"'


# Pattern rule: all-<name> = build + deploy
all-%: build-%
	@if echo "$(BE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(MAKE) deploy-$*; \
	elif echo "$(FE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(MAKE) _deploy-fe PACKAGE=$*; \
	fi

# Internal backend build
_build-be:
	pnpm turbo prune @backend/${PACKAGE} --docker
	$(DOCKER) build -f Dockerfile.backend --platform linux/amd64 \
		$(DOCKER_BUILD_FLAGS) \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
		--build-arg PACKAGE=${PACKAGE} \
		--build-arg CACHEBUST=$$(date +%s) \
		. --output type=docker
	@echo "Built $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) -> $$($(DOCKER) image inspect $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) --format '{{.Id}}')"
	rm -rf out

# Internal frontend build
_build-fe:
	$(eval CDN_NAME := $(CDN_NAME_$(PACKAGE)))
	$(eval APP_URL  := $(FE_APP_URL)$(APP_URL_SUFFIX_$(PACKAGE)))
	@echo "Building FE package $(PACKAGE) -> $(CDN_NAME) [APP_URL=$(APP_URL)] [ONLY_OFFICE=$(ONLY_OFFICE_ENDPOINT)]"
	cd apps/client/$(PACKAGE) && \
	pnpm i && \
	NEXT_PUBLIC_APP_URL=$(APP_URL) \
	NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT=$(ONLY_OFFICE_ENDPOINT) \
	pnpm build && \
	rm -rf $(CDN_NAME) && \
	mv out $(CDN_NAME) && \
	zip -r -q $(CDN_NAME).zip $(CDN_NAME)

# Internal frontend deploy
_deploy-fe:
	$(eval CDN_NAME := $(CDN_NAME_$(PACKAGE)))
	$(eval ROUTER_NAME := $(ROUTER_NAME_$(PACKAGE)))
	@echo "Deploying FE package $(PACKAGE) -> cdn:$(CDN_NAME), router:$(ROUTER_NAME)"
	cd apps/client/$(PACKAGE) && \
	$(SCP) $(CDN_NAME).zip $(SERVER_HOST):$(FE_APP_DIR)/ && \
	$(SSH) $(SERVER_HOST) "set -eu; cd $(FE_APP_DIR) && \
		docker compose -f $(FE_COMPOSE_FILE) stop mta-$(CDN_NAME) router-$(ROUTER_NAME)-api 2>/dev/null || true; \
		docker compose -f $(FE_COMPOSE_FILE) rm -sf mta-$(CDN_NAME) router-$(ROUTER_NAME)-api 2>/dev/null || true; \
		rm -rf $(CDN_NAME) && \
		unzip -oq $(CDN_NAME).zip && \
		COMPOSE_PULL_POLICY=never docker compose -f $(FE_COMPOSE_FILE) up -d --force-recreate --no-build mta-$(CDN_NAME) router-$(ROUTER_NAME)-api"

_package-fe-cdn-copy:
	$(eval CDN_NAME := $(CDN_NAME_$(PACKAGE)))
	@echo "Packaging $(PACKAGE) -> $(CDN_NAME)"
	@cp -r apps/client/$(PACKAGE)/$(CDN_NAME) cdn/

# Push specific image manually
push:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make push PACKAGE=<package-name>')
endif
	$(DOCKER) push $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG)

# Release
release:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make release PACKAGE=<package-name>')
endif
	$(DOCKER) build -t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(RELEASE_TAG) .
	$(DOCKER) push $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(RELEASE_TAG)
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) $(IMG_PREFIX)${PACKAGE} -d"

# Deploy only
deploy:
	ssh $(SERVER) "cd docker-compose && $(COMPOSE_CMD) $(IMG_PREFIX)${PACKAGE} -d"

# Clean image
clean:
ifndef PACKAGE
	$(error PACKAGE is not set. Use 'make clean PACKAGE=<package-name>')
endif
	$(DOCKER) rmi $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) || true
