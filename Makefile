.PHONY: list
list:
	@LC_ALL=C $(MAKE) -pRrq -f $(firstword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/(^|\n)# Files(\n|$$)/,/(^|\n)# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | grep -E -v -e '^[^[:alnum:]]' -e '^$@$$'

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

check_translations:
	bun --bun run scripts/checkTranslations

release:
	bun --bun run scripts/foundryRelease

run_tests:
	bun test

run_ts_lint:
	bunx tsc --noEmit --incremental

foundry_link:
	bun --bun run scripts/foundry/link.ts

foundry_unlink:
	bun --bun run scripts/foundry/unlink.ts
