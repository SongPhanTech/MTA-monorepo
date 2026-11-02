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
SERVER_PROFILE ?= swantech_x52
# Prefix nginx mount for BE APIs (empty = /api/... ; mta_online = /cong-sinh-vien/api/...)
FE_API_PREFIX ?=

# ── Profile: swan1 ────────────────────────────────────────────────────────────
ifeq ($(SERVER_PROFILE),swan1)
  SERVER_HOST      := swan1
  SERVER_PASSWORD  :=
  BE_DEPLOY_DIR    := ~/mta-be
  BE_APP_DIR       := ~/mta-be
  FE_APP_DIR       := ~/mta-app
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := https://daotao.swantech.vn
  ONLY_OFFICE_ENDPOINT := https://doc.mta.swantech.vn

# ── Profile: swantech_x52 ─────────────────────────────────────────────────────────────
else ifeq ($(SERVER_PROFILE),swantech_x52)
  SERVER_HOST      := swantech_x52
  SERVER_PASSWORD  :=
  BE_DEPLOY_DIR    := ~/mta-be
  BE_APP_DIR       := ~/mta-be
  FE_APP_DIR       := ~/mta-app
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := https://daotao.swantech.vn
  ONLY_OFFICE_ENDPOINT := https://doc.mta.swantech.vn

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
  FE_APP_DIR       := ~/mta-app-sso
  FE_COMPOSE_FILE  := app-docker-compose.yml
  FE_APP_URL       := https://mta.edu.vn
  # Nginx chỉ proxy BE dưới /cong-sinh-vien/api/* (không có /api/portal trực tiếp)
  FE_API_PREFIX    := /cong-sinh-vien
  ONLY_OFFICE_ENDPOINT := 

# Fallback: unknown profile ─────────────────────────────────────────────────
else
  $(error Unknown SERVER_PROFILE "$(SERVER_PROFILE)". \
    Add a new profile block in the Makefile or choose from: swan1, swantech_x52, local_mta, app2)
endif

# Router API compose service name prefix
# swantech_x52 → mta-router-lms-api ; other profiles → router-lms-api
ifeq ($(SERVER_PROFILE),swantech_x52)
  ROUTER_SVC_PREFIX := mta-
else
  ROUTER_SVC_PREFIX :=
endif

# SSH / SCP helpers (automatically use sshpass when a password is set)
# -O: legacy SCP protocol (OpenSSH 9+ SFTP default hay fail trên một số server)
# PreferredAuthentications=password: tránh thử pubkey rồi bị deny trước khi dùng sshpass
ifneq ($(SERVER_PASSWORD),)
  SSH  := sshpass -p "$(SERVER_PASSWORD)" ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no
  SCP  := sshpass -p "$(SERVER_PASSWORD)" scp -O -o PreferredAuthentications=password -o PubkeyAuthentication=no
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
PKG_BE_BACKUP := backup
BACKUP_IMAGE := $(REGISTRY)/$(IMG_PREFIX)$(PKG_BE_BACKUP):$(DEV_TAG)
BACKUP_SERVICE := $(IMG_PREFIX)$(PKG_BE_BACKUP)

PKG_KHAO_THI := khao-thi
PKG_DAO_TAO := ql-dao-tao
PKG_HO_SO := ql-ho-so
PKG_AI := tro-ly-ao
PKG_CONG_HOC_VIEN := cong-hoc-vien
PKG_CONG_GIANG_VIEN := cong-giang-vien
PKG_CONG_SINH_VIEN := cong-sinh-vien

# Maps for build types (backend/frontend)
BE_PKGS := $(PKG_BE_MODEL) $(PKG_BE_DAO_TAO) $(PKG_BE_KHAO_THI) $(PKG_BE_PORTAL) $(PKG_BE_DAO_TAO_SHARED) $(PKG_BE_EXCHANGE)
BE_SERVICES := $(foreach pkg,$(BE_PKGS),$(IMG_PREFIX)$(pkg))
# FE_PKGS := $(PKG_DAO_TAO) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_DANG_KY_HOC)
FE_PKGS := $(PKG_DAO_TAO) $(PKG_AI) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_CONG_HOC_VIEN) $(PKG_CONG_GIANG_VIEN) $(PKG_CONG_SINH_VIEN)
# App có build/package nhưng chưa có service trên docker-compose server (vd. cong-hoc-vien).
# swantech_x52: không stop/up chatbot (cổng 5189 đã dùng bởi service chatbot riêng).
ifeq ($(SERVER_PROFILE),swantech_x52)
  FE_DEPLOY_SKIP := $(PKG_CONG_HOC_VIEN) $(PKG_AI)
else
  FE_DEPLOY_SKIP := $(PKG_CONG_HOC_VIEN)
endif
FE_DEPLOY_PKGS := $(filter-out $(FE_DEPLOY_SKIP),$(FE_PKGS))

# Client App Mappings
CDN_NAME_ql-dao-tao = lms-cdn
ROUTER_NAME_ql-dao-tao = lms
CDN_NAME_cong-sinh-vien = cong-sinh-vien-cdn
ROUTER_NAME_cong-sinh-vien = cong-sinh-vien
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

# Danh sách thư mục CDN + service compose (dùng cho deploy-cdn, tránh docker compose down xóa fe_default)
# swantech_x52: không xóa / ghi đè chatbot-cdn (service chatbot không được up/down).
ifeq ($(SERVER_PROFILE),swantech_x52)
  FE_CDN_DIR_PKGS := $(filter-out $(PKG_AI),$(FE_PKGS))
  FE_CDN_UNZIP_SKIP := $(CDN_NAME_$(PKG_AI))
else
  FE_CDN_DIR_PKGS := $(FE_PKGS)
  FE_CDN_UNZIP_SKIP :=
endif
FE_CDN_DIRS := $(foreach pkg,$(FE_CDN_DIR_PKGS),$(CDN_NAME_$(pkg)))
FE_CDN_SERVICES := $(foreach pkg,$(FE_DEPLOY_PKGS),mta-$(CDN_NAME_$(pkg)) $(ROUTER_SVC_PREFIX)router-$(ROUTER_NAME_$(pkg))-api)

# Per-app URL suffix appended to FE_APP_URL → NEXT_PUBLIC_APP_URL
# Format: <domain from profile><suffix below>  e.g. https://daotao.swantech.vn/lms/home
APP_URL_SUFFIX_ql-dao-tao   = /lms/home
APP_URL_SUFFIX_khao-thi     = /ems/home
APP_URL_SUFFIX_cong-sinh-vien  = /cong-sinh-vien/home
APP_URL_SUFFIX_ql-ho-so     = /hrm/home
APP_URL_SUFFIX_tro-ly-ao    = /chatbot/?mode=tro-ly-ao
APP_URL_SUFFIX_cong-giang-vien = /conggiangvien/home
APP_URL_SUFFIX_cong-hoc-vien = /conghocvien/home

# Public-api client credentials (x-clientid / x-clientsecret) per SERVER_PROFILE + portal app.
# Injected at FE build time so .env can stay as local/x52 defaults.
ifeq ($(SERVER_PROFILE),mta_online)
  # mta_online public-api → mta_coredb
  FE_CLIENT_ID_cong-sinh-vien     := CongHocVien
  FE_CLIENT_SECRET_cong-sinh-vien := FpYxCRyJHViZ3gKDv1UrDhEe5OmU7vGH
  FE_CLIENT_ID_cong-hoc-vien      := CongHocVien
  FE_CLIENT_SECRET_cong-hoc-vien  := FpYxCRyJHViZ3gKDv1UrDhEe5OmU7vGH
else
  # swantech_x52 / swan1 / local → mta_core_db
  FE_CLIENT_ID_cong-sinh-vien     := CongSinhVien
  FE_CLIENT_SECRET_cong-sinh-vien := I3WvcIx3PkvME9bW5Ctqs4W5vwh2VEkI
  FE_CLIENT_ID_cong-hoc-vien      := dangkyhoc
  FE_CLIENT_SECRET_cong-hoc-vien  := FpYxCRyJHViZ3gKDv1UrDhEe5OmU7vGH
endif

# Targets
.PHONY: all clean push deploy release all-be build-all-be build-all-fe ship-fe \
	build-% all-% save-docker-images package-cdn _package-fe-cdn-copy \
	build-backup deploy-backup all-backup all-mta-online \
	recreate-portal-data-sync-worker

help:
	@echo "Available targets:"
	@echo "  all-$(PKG_BE_MODEL)"
	@echo "  all-$(PKG_BE_DAO_TAO)"
	@echo "  all-$(PKG_BE_KHAO_THI)"
	@echo "  all-$(PKG_BE_PORTAL)"
	@echo "  all-$(PKG_DAO_TAO)"
	@echo "  all-$(PKG_HO_SO)"
	@echo "  all-$(PKG_KHAO_THI)"
	@echo "  all-$(PKG_PORTAL)"
	@echo "  all-$(PKG_BE_DAO_TAO_SHARED)"
	@echo "  all-be"
	@echo "  all-mta-online   (model, ql-dao-tao, portal, shared, cong-sinh-vien → mta_online)"
	@echo "  build-all-be"
	@echo "  build-all-fe"
	@echo "  all-clients"
	@echo "  save-docker-images"
	@echo "  package-cdn"
	@echo "  build-backup / deploy-backup / all-backup  (Go PG Back Web → ~/app/be khi SERVER_PROFILE=app)"

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

# Build + deploy bộ đang chạy trên mta_online.
# BE: model, khao-thi, ql-dao-tao, portal, shared. FE: cong-sinh-vien-cdn + router-cong-sinh-vien-api.
# Worker import dùng chung image portal; recreate sau khi image mới đã được load.
all-mta-online:
	$(MAKE) all-be-model SERVER_PROFILE=mta_online
	$(MAKE) all-be-khao-thi SERVER_PROFILE=mta_online
	$(MAKE) all-be-ql-dao-tao SERVER_PROFILE=mta_online
	$(MAKE) all-be-portal SERVER_PROFILE=mta_online
	$(MAKE) recreate-portal-data-sync-worker SERVER_PROFILE=mta_online
	$(MAKE) all-be-ql-dao-tao-shared SERVER_PROFILE=mta_online
	$(MAKE) all-cong-sinh-vien SERVER_PROFILE=mta_online

recreate-portal-data-sync-worker:
	$(SSH) $(SERVER_HOST) "cd $(BE_APP_DIR) && docker compose up -d --force-recreate mta-be-portal-data-sync-worker"

save-docker-images:
	@mkdir -p docker-images
	@for pkg in $(BE_PKGS); do \
		echo "Saving $$pkg..."; \
		($(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$$pkg:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$$pkg.tar.gz) & \
	done; \
	wait; \
	echo "All images saved."

package-cdn:
	@rm -rf cdn cdn.zip
	@mkdir -p cdn
	@for pkg in $(FE_PKGS); do \
		$(MAKE) _package-fe-cdn-copy PACKAGE=$$pkg; \
	done
	@zip -r -q cdn.zip cdn

deploy-cdn:
	$(SCP) -O cdn.zip $(SERVER_HOST):$(FE_APP_DIR)/
	$(SSH) $(SERVER_HOST) "cd $(FE_APP_DIR) && \
	docker compose -f $(FE_COMPOSE_FILE) stop $(FE_CDN_SERVICES) 2>/dev/null || true && \
	docker compose -f $(FE_COMPOSE_FILE) rm -f $(FE_CDN_SERVICES) 2>/dev/null || true && \
	rm -rf $(FE_CDN_DIRS) && \
	unzip -q -o cdn.zip && \
	$(if $(FE_CDN_UNZIP_SKIP),rm -rf $(addprefix cdn/,$(FE_CDN_UNZIP_SKIP)) &&) \
	mv -f cdn/* . && \
	rm -rf cdn && \
	docker compose -f $(FE_COMPOSE_FILE) up -d $(FE_CDN_SERVICES)"

deploy-all-be:
	@rm -rf docker-images.zip
	@zip -r docker-images.zip docker-images
	$(SCP) -O docker-images.zip $(SERVER_HOST):$(BE_DEPLOY_DIR)
	$(SSH) $(SERVER_HOST) "cd $(BE_DEPLOY_DIR) && \
	rm -rf docker-images && \
	unzip -o docker-images.zip && \
	cd docker-images && ls *.tar.gz | xargs -I {} docker load -i {} && \
	cd $(BE_APP_DIR) && \
	docker compose up -d --force-recreate $(BE_SERVICES)"
# deploy-be-%: build-%
# 	@mkdir -p docker-images
# 	$(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$*.tar.gz
# 	sshpass -p "Bancntt@2025" scp -O docker-images/$(IMG_PREFIX)$*.tar.gz app2:~/Documents/docker-compose/
# 	sshpass -p "Bancntt@2025" ssh app2 "cd Documents/docker-compose/ && \
# 	docker load -i $(IMG_PREFIX)$*.tar.gz && \
# 	docker rm -f $(IMG_PREFIX)$* && \
# 	docker compose up $(IMG_PREFIX)$* -d"

deploy-%:
	@mkdir -p docker-images
	$(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$*.tar.gz
	$(SSH) $(SERVER_HOST) "mkdir -p $(BE_DEPLOY_DIR)/docker-images"
	$(SCP) docker-images/$(IMG_PREFIX)$*.tar.gz $(SERVER_HOST):$(BE_DEPLOY_DIR)/docker-images/
	$(SSH) $(SERVER_HOST) "cd $(BE_DEPLOY_DIR) && \
	docker load -i docker-images/$(IMG_PREFIX)$*.tar.gz && \
	docker rm -f  $(IMG_PREFIX)$* && \
	docker compose up -d --force-recreate $(IMG_PREFIX)$*"


# Pattern rule: all-<name> = build + push + deploy (SCP image, không cần GHCR login trên server)
all-%: build-%
	@if echo "$(BE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(DOCKER) push $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG) || true; \
		$(MAKE) deploy-$*; \
	elif echo "$(FE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(MAKE) _deploy-fe PACKAGE=$*; \
	fi

# ── backup (Go / apps/backup, không đi turbo prune) ──────────────────────────
# Usage:
#   make all-backup SERVER_PROFILE=app
# Image: ghcr.io/songphantech/mta-backup:latest
# Server: $(BE_APP_DIR)  (profile app → ~/app/be)
build-backup:
	@echo "Building $(BACKUP_IMAGE) from apps/backup"
	@echo "Pre-pull base images (Docker Hub CloudFront hay 502 — retry + mirror golang)"
	@pull_img() { \
		img="$$1"; \
		for i in 1 2 3 4 5; do \
			$(DOCKER) pull --platform linux/amd64 "$$img" && return 0; \
			echo "  pull $$img failed ($$i/5), retry in 12s"; \
			sleep 12; \
		done; 
		return 1; \
	}; \
	if ! pull_img golang:1.23.5-bookworm; then \
		echo "  fallback mirror.gcr.io for golang"; \
		pull_img mirror.gcr.io/library/golang:1.23.5-bookworm && \
			$(DOCKER) tag mirror.gcr.io/library/golang:1.23.5-bookworm golang:1.23.5-bookworm; \
	fi; \
	pull_img denoland/deno:debian-2.1.9 || true; \
	pull_img debian:12.7 || true; \
	ok=0; \
	for i in 1 2 3 4 5; do \
		$(DOCKER) build -f apps/backup/docker/Dockerfile --platform linux/amd64 \
			-t $(BACKUP_IMAGE) \
			apps/backup --output type=docker && ok=1 && break; \
		echo "  docker build failed ($$i/5), retry in 15s"; \
		sleep 15; \
	done; \
	[ "$$ok" = 1 ]

deploy-backup:
	@mkdir -p docker-images
	@echo "Saving $(BACKUP_IMAGE)"
	$(DOCKER) save $(BACKUP_IMAGE) | gzip > docker-images/$(BACKUP_SERVICE).tar.gz
	$(SSH) $(SERVER_HOST) "mkdir -p $(BE_DEPLOY_DIR)/docker-images $(BE_APP_DIR)/backups"
	$(SCP) -O docker-images/$(BACKUP_SERVICE).tar.gz $(SERVER_HOST):$(BE_DEPLOY_DIR)/docker-images/
	$(SCP) -O apps/backup/docker-compose.yml $(SERVER_HOST):$(BE_APP_DIR)/docker-compose.backup.yml
	$(SSH) $(SERVER_HOST) "set -e; \
		docker load -i $(BE_DEPLOY_DIR)/docker-images/$(BACKUP_SERVICE).tar.gz; \
		cd $(BE_APP_DIR); \
		if [ ! -f .env ]; then echo 'WARNING: $(BE_APP_DIR)/.env chưa có PBW_* — tạo trước khi lên web :8085'; fi; \
		if [ -f docker-compose.yml ]; then \
			docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d --force-recreate $(BACKUP_SERVICE); \
		else \
			docker compose -f docker-compose.backup.yml up -d --force-recreate; \
		fi"

all-backup: build-backup deploy-backup

# Internal backend build
_build-be:
	pnpm turbo prune @backend/${PACKAGE} --docker
	$(DOCKER) build -f Dockerfile.backend --platform linux/amd64 \
		-t $(REGISTRY)/$(IMG_PREFIX)${PACKAGE}:$(DEV_TAG) \
		--build-arg PACKAGE=${PACKAGE} \
		. --output type=docker
	rm -rf out

# Internal frontend build
_build-fe:
	$(eval CDN_NAME := $(CDN_NAME_$(PACKAGE)))
	$(eval APP_URL  := $(FE_APP_URL)$(APP_URL_SUFFIX_$(PACKAGE)))
	$(eval FE_CLIENT_ID := $(FE_CLIENT_ID_$(PACKAGE)))
	$(eval FE_CLIENT_SECRET := $(FE_CLIENT_SECRET_$(PACKAGE)))
	@echo "Building FE package $(PACKAGE) -> $(CDN_NAME) [APP_URL=$(APP_URL)] [API=$(FE_APP_URL)$(FE_API_PREFIX)/api/...] [ONLY_OFFICE=$(ONLY_OFFICE_ENDPOINT)]$(if $(FE_CLIENT_ID), [CLIENT=$(FE_CLIENT_ID)])"
	cd apps/client/$(PACKAGE) && \
	pnpm i && \
	NEXT_PUBLIC_APP_URL=$(APP_URL) \
	NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT=$(ONLY_OFFICE_ENDPOINT) \
	NEXT_PUBLIC_API_PORTAL_BASE_URL="$(FE_APP_URL)$(FE_API_PREFIX)/api/portal" \
	NEXT_PUBLIC_API_MODEL_BASE_URL="$(FE_APP_URL)$(FE_API_PREFIX)/api/model" \
	NEXT_PUBLIC_API_EMS_BASE_URL="$(FE_APP_URL)$(FE_API_PREFIX)/api/ems" \
	NEXT_PUBLIC_API_LMS_BASE_URL="$(FE_APP_URL)$(FE_API_PREFIX)/api/lms" \
	NEXT_PUBLIC_API_SYSTEM_BASE_URL="$(FE_APP_URL)$(FE_API_PREFIX)/api/system" \
	$(if $(FE_CLIENT_ID),NEXT_PUBLIC_CLIENT_ID="$(FE_CLIENT_ID)") \
	$(if $(FE_CLIENT_SECRET),NEXT_PUBLIC_CLIENT_SECRET="$(FE_CLIENT_SECRET)") \
	pnpm build && \
	rm -rf $(CDN_NAME) && \
	mv out $(CDN_NAME) && \
	zip -r -q $(CDN_NAME).zip $(CDN_NAME)

# Internal frontend deploy
_deploy-fe:
	$(eval CDN_NAME := $(CDN_NAME_$(PACKAGE)))
	$(eval ROUTER_NAME := $(ROUTER_NAME_$(PACKAGE)))
	$(eval ROUTER_SVC := $(ROUTER_SVC_PREFIX)router-$(ROUTER_NAME)-api)
	@echo "Deploying FE package $(PACKAGE) -> cdn:$(CDN_NAME), router:$(ROUTER_SVC)"
	cd apps/client/$(PACKAGE) && \
	$(SCP) $(CDN_NAME).zip $(SERVER_HOST):$(FE_APP_DIR)/ && \
	$(SSH) $(SERVER_HOST) "cd $(FE_APP_DIR) && \
		docker compose -f $(FE_COMPOSE_FILE) stop mta-$(CDN_NAME) $(ROUTER_SVC) && \
		docker compose -f $(FE_COMPOSE_FILE) rm -f mta-$(CDN_NAME) $(ROUTER_SVC) && \
		rm -rf $(CDN_NAME) && \
		unzip -o $(CDN_NAME).zip && \
		docker compose -f $(FE_COMPOSE_FILE) up mta-$(CDN_NAME) $(ROUTER_SVC) -d"

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