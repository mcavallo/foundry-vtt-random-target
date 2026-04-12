cleanup:
    bunx rimraf dist

build: cleanup
    bun --bun run scripts/build.ts

rebuild:
    DEV=1 bun --bun run scripts/build.ts

[no-exit-message]
dev:
    DEV=1 just build
    bunx nodemon --on-change-only

check-translations:
    bun --bun run scripts/checkTranslations

test:
    bunx vitest run

typecheck:
    bunx tsgo --noEmit

lint:
    bunx oxlint

format:
    bunx oxfmt

format-check:
    bunx oxfmt --check

foundry-link:
    bun --bun run scripts/foundrySymlink link

foundry-unlink:
    bun --bun run scripts/foundrySymlink unlink
