#!/bin/sh
# Linux source start / experimental public-package start; target acceptance pending.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ -f publication-manifest.json ]; then
    exec python3 tools/public_setup.py "$@"
fi
if [ ! -x .venv/bin/python ]; then
    echo 'Python environment missing. Follow docs/INSTALLATION.md first.' >&2
    exit 1
fi
exec .venv/bin/python -m kicad_parts_manager.browser "$@"
