set shell := ["bash", "-euo", "pipefail", "-c"]
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# List the recipes (default).
help:
    @just --list --unsorted

# Run the data and chart tests (node --test).
test:
    node --test

# Build the site into dist/.
build:
    node scripts/build.mjs

# Preview the site on http://localhost:8080.
serve:
    {{ if os_family() == "windows" { "python" } else { "python3" } }} -m http.server 8080 --directory site
