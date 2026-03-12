# Base Variables
DOCKER := $(shell which docker 2>/dev/null || echo docker)
REGISTRY := ghcr.io/songphantech
DEV_TAG := latest
RELEASE_TAG := release
SERVER := swan1
COMPOSE_CMD := docker compose up
IMG_PREFIX := mta-

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
PKG_DANG_KY_HOC := dang-ky-hoc

# Maps for build types (backend/frontend)
BE_PKGS := $(PKG_BE_MODEL) $(PKG_BE_DAO_TAO) $(PKG_BE_KHAO_THI) $(PKG_BE_PORTAL) $(PKG_BE_DAO_TAO_SHARED) $(PKG_BE_EXCHANGE)
# FE_PKGS := $(PKG_DAO_TAO) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_DANG_KY_HOC)
FE_PKGS := $(PKG_DAO_TAO) $(PKG_AI) $(PKG_KHAO_THI) $(PKG_HO_SO) $(PKG_DANG_KY_HOC)

# Client App Mappings
CDN_NAME_ql-dao-tao = lms-cdn
ROUTER_NAME_ql-dao-tao = lms
CDN_NAME_dang-ky-hoc = dang-ky-hoc-cdn
ROUTER_NAME_dang-ky-hoc = dang-ky-hoc
CDN_NAME_tro-ly-ao = chatbot-cdn
ROUTER_NAME_tro-ly-ao = chatbot
CDN_NAME_ql-ho-so = hrm-cdn
ROUTER_NAME_ql-ho-so = hrm
CDN_NAME_khao-thi = ems-cdn
ROUTER_NAME_khao-thi = ems

# Targets
.PHONY: all clean push deploy release all-be build-all-be build-all-fe \
	build-% all-% save-docker-images package-cdn _package-fe-cdn-copy

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

all-clients:
	@for pkg in $(FE_PKGS); do \
		$(MAKE) all-$$pkg; \
	done

save-docker-images:
	@mkdir -p docker-images
	@for pkg in $(BE_PKGS); do \
		echo "Saving $$pkg..."; \
		$(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$$pkg:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$$pkg.tar.gz; \
	done

package-cdn:
	@rm -rf cdn cdn.zip
	@mkdir -p cdn
	@for pkg in $(FE_PKGS); do \
		$(MAKE) _package-fe-cdn-copy PACKAGE=$$pkg; \
	done
	@zip -r -q cdn.zip cdn

deploy-cdn:
	scp -O cdn.zip app2:~/app/fe/
	ssh app2 "cd app/fe/ && \
 	docker compose down; \
	rm -rf dang-ky-hoc-cdn/ lms-cdn/ ems-cdn/ hrm-cdn/ chatbot-cdn/; \
	unzip -q cdn.zip && \
	mv cdn/* . && \
	docker compose up -d"

deploy-all-be:
	@rm -rf docker-images.zip
	@zip -r docker-images.zip docker-images
	scp -O docker-images.zip app2:~/mta-deploy
	ssh app2 "cd mta-deploy && \
	unzip -o docker-images.zip && \
	cd docker-images && ls *.tar.gz | xargs -I {} docker load -i {} && \
	cd ~/app/be && \
	docker rm -f mta-be-exchange mta-be-khao-thi mta-be-model mta-be-portal mta-be-ql-dao-tao mta-be-ql-dao-tao-shared && \
	docker compose up -d"

# deploy-be-%: build-%
# 	@mkdir -p docker-images
# 	$(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$*.tar.gz
# 	sshpass -p "Bancntt@2025" scp -O docker-images/$(IMG_PREFIX)$*.tar.gz app2:~/Documents/docker-compose/
# 	sshpass -p "Bancntt@2025" ssh app2 "cd Documents/docker-compose/ && \
# 	docker load -i $(IMG_PREFIX)$*.tar.gz && \
# 	docker rm -f $(IMG_PREFIX)$* && \
# 	docker compose up $(IMG_PREFIX)$* -d"

deploy-%:
	$(DOCKER) save $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG) | gzip > docker-images/$(IMG_PREFIX)$*.tar.gz
	sshpass -p "Bancntt@2025" scp -O docker-images/$(IMG_PREFIX)$*.tar.gz app2:~/Documents/docker-compose/
	sshpass -p "Bancntt@2025" ssh app2 "cd Documents/docker-compose/ && \
	docker load -i $(IMG_PREFIX)$*.tar.gz && \
	docker rm -f $(IMG_PREFIX)$* && \
	docker compose up $(IMG_PREFIX)$* -d"


# Pattern rule: all-<name> = build + push + deploy
all-%: build-%
	@if echo "$(BE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(DOCKER) push $(REGISTRY)/$(IMG_PREFIX)$*:$(DEV_TAG); \
		ssh $(SERVER) "cd mta-be && $(COMPOSE_CMD) $(IMG_PREFIX)$* -d"; \
	elif echo "$(FE_PKGS)" | tr ' ' '\n' | grep -Fxq "$*"; then \
		$(MAKE) _deploy-fe PACKAGE=$*; \
	fi

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
	@echo "Building FE package $(PACKAGE) -> $(CDN_NAME)"
	cd apps/client/$(PACKAGE) && \
	pnpm i && \
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
	scp $(CDN_NAME).zip $(SERVER):app && \
	ssh $(SERVER) "cd app && \
		docker compose -f app-docker-compose.yml down mta-$(CDN_NAME) router-$(ROUTER_NAME)-api && \
		rm -rf $(CDN_NAME) && \
		unzip -o $(CDN_NAME).zip && \
		docker compose -f app-docker-compose.yml up mta-$(CDN_NAME) router-$(ROUTER_NAME)-api -d"

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
