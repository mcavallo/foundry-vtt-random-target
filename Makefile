.PHONY: list
list:
	@LC_ALL=C $(MAKE) -pRrq -f $(firstword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/(^|\n)# Files(\n|$$)/,/(^|\n)# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | grep -E -v -e '^[^[:alnum:]]' -e '^$@$$'

lint_ts:
	bunx tsc --noEmit --incremental

cleanup:
	bunx rimraf dist

build: cleanup
	bun --bun run scripts/build.ts

rebuild:
	bun --bun run scripts/build.ts

dev:
	export DEV=1 && \
	make build && \
	bunx nodemon --on-change-only

foundry_link:
	bun --bun run scripts/foundry/link.ts

foundry_unlink:
	bun --bun run scripts/foundry/unlink.ts

foundry_release:
	bun --bun run scripts/foundry/release.ts
