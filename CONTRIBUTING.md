# Contributing

Python 3.13 and Node 24 are the Windows beta test baseline. Create a venv, install requirements-runtime.txt, install the project editable with --no-deps --no-build-isolation and install pytest. Run python -m pytest -q, npm ci and npm test. Tests use synthetic/temp data. Never include user databases or third-party downloads in pull requests. External ngspice/KiCad integration needs separate target acceptance. CI runs on Windows with read-only permissions and does not publish artifacts.
