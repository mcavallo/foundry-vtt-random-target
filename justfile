# List available recipes
default:
    @just --list --list-submodules

# Remove dist/ contents (preserves dist/ for symlinks).
cleanup:
    bunx foundry-build clean

# Full release build: minified, hashed filenames.
build: cleanup
    bunx foundry-build build

# One-shot dev build: unminified, stable filenames, sourcemaps.
build-dev:
    bunx foundry-build dev

# Dev build + watch mode (incremental rebuilds on change).
dev:
    bunx foundry-build dev --watch

# Run unit tests.
test *args:
    bunx vitest run {{args}}

# Type-check only (no emit).
typecheck *args:
    bunx tsgo --noEmit {{args}}

# Lint sources.
lint *args:
    bunx oxlint {{args}}

# Apply formatter in place.
format *args:
    bunx oxfmt {{args}}

# Verify formatting without writing.
format-check *args:
    bunx oxfmt --check {{args}}

# Symlink dist/ into the local Foundry modules dir.
foundry-link:
    bunx foundry-symlink link --source dist

# Remove the Foundry modules symlink.
foundry-unlink:
    bunx foundry-symlink unlink

# Checks the translations for missing keys and tokens
check-translations:
    bunx foundry-i18n-check
