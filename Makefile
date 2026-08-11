# SAP AI Factory — ops entrypoint (ai-sdlc-inspired shell, Activate content stays canonical)

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PYTHON ?= python3
PROJECT ?= $(ROOT)
TOOL ?= claude-code

.PHONY: help build validate setup-mcp setup install-skills config-example clean-mcp-dry

help:
	@echo "SAP AI Factory"
	@echo ""
	@echo "  make build              Regenerate index.html + factory-data.js from factory-data.json"
	@echo "  make validate           Path/drift checks (factory-data.json ↔ repo files)"
	@echo "  make setup-mcp          Write .mcp.json for jira + abap-mcp (PROJECT=$(PROJECT))"
	@echo "  make setup-mcp-dry      Print .mcp.json without writing"
	@echo "  make config-example     Show .factory/config.example.yaml path"
	@echo "  make install-skills     Copy own skills into a project via npx skills CLI"
	@echo "                          TOOL=$(TOOL) PROJECT=$(PROJECT)"
	@echo "  make setup              validate + setup-mcp (skills install is explicit — see install-skills)"
	@echo ""
	@echo "Engagement entry skill: activate (see skills/activate/SKILL.md)"
	@echo "Write policy: MCP mutations dry-run unless --apply"

build:
	cd $(ROOT) && $(PYTHON) build.py

validate:
	cd $(ROOT) && $(PYTHON) validators/validate.py

setup-mcp:
	$(PYTHON) $(ROOT)/scripts/setup_mcp.py --project $(PROJECT)

setup-mcp-dry:
	$(PYTHON) $(ROOT)/scripts/setup_mcp.py --project $(PROJECT) --dry-run

config-example:
	@echo $(ROOT)/.factory/config.example.yaml
	@echo "Copy to $(PROJECT)/.factory/config.yaml and edit destinations / jira_project."

# Deliberate: never run skills add against this factory checkout as PROJECT — --copy can
# delete matching skills/ sources. Default PROJECT must be a client repo.
install-skills:
	@if [ "$(abspath $(PROJECT))" = "$(ROOT)" ]; then \
		echo "Refusing: PROJECT is the factory repo. Set PROJECT=/path/to/client-repo"; \
		exit 1; \
	fi
	npx skills add $(ROOT) -a $(TOOL) -s '*' --copy -y --cwd $(PROJECT)

setup: validate setup-mcp
	@echo ""
	@echo "Next: copy .factory/config.example.yaml → .factory/config.yaml"
	@echo "      ensure ~/.config/mcp-atlassian/sessions/<dest>.env and mcp-abap-adt sessions exist"
	@echo "      start an engagement with the activate skill"
