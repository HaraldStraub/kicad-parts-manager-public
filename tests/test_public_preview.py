import importlib.util
import json
from pathlib import Path
import shutil
import sqlite3
from contextlib import closing

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('public_preview', ROOT / 'tools/build_public_preview.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


@pytest.fixture(scope='module')
def pristine(tmp_path_factory):
    # Actual project inputs; no operation may alter the existing working databases.
    names = ['db/componentdb.sqlite','db/kicad-parts-manager.sqlite','db/manual-data.sqlite','models/vendor/index.sqlite','db/library-catalog.json','db/imported-libraries.json']
    before = {n: preview.sha(ROOT/n) for n in names if (ROOT/n).exists()}
    folder = preview.prepare(tmp_path_factory.mktemp('public-preparation') / 'preview')
    assert {n: preview.sha(ROOT/n) for n in before} == before
    return folder


@pytest.fixture
def stage(pristine, tmp_path):
    folder = tmp_path / 'preview'
    shutil.copytree(pristine, folder)
    return folder


def refresh_hash(stage, name):
    path = stage / 'package-manifest.json'
    manifest = json.loads(path.read_text())
    next(r for r in manifest['files'] if r['path'] == name)['sha256'] = preview.sha(stage/name)
    path.write_text(json.dumps(manifest))


def test_fresh_examples_and_licenses_only(stage):
    assert preview.verify(stage)['examples'] == 8
    assert (stage/'LICENSE').read_bytes() == (ROOT/'LICENSE').read_bytes()
    assert (stage/'DISCLAIMER.md').is_file()
    assert (stage/'licenses/CC0-1.0.txt').is_file()
    policy = json.loads((stage/'publication-manifest.json').read_text())
    assert policy['ready_to_publish'] is False
    assert not (stage/'transfer.json').exists()
    assert not (stage/'data/library-sources').exists()
    assert not (stage/'db/library-catalog.json').exists()
    assert not (stage/'docs/data').exists()
    assert '[project.urls]' not in (stage/'pyproject.toml').read_text()
    assert 'mailto:' not in (stage/'THIRD_PARTY_NOTICES.md').read_text()


def test_unknown_file_or_source_is_rejected(stage):
    (stage/'private.sqlite').write_bytes(b'private')
    with pytest.raises(ValueError, match='Unknown file'):
        preview.verify(stage)
    (stage/'private.sqlite').unlink()
    path=stage/'package-manifest.json';manifest=json.loads(path.read_text());manifest['files'][0]['source_id']='unreviewed';path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match='Unapproved'):
        preview.verify(stage)


def test_manufacturer_data_even_with_updated_hash_is_rejected(stage):
    name='src/kicad_parts_manager/data/manufacturer-parameters.json'
    path=stage/name;data=json.loads(path.read_text());data['components']=[{'mpn':'private-part'}];path.write_text(json.dumps(data));refresh_hash(stage,name)
    with pytest.raises(ValueError, match='Manufacturer data'):
        preview.verify(stage)


def test_private_model_path_or_manual_rows_are_rejected(stage):
    name='db/kicad-parts-manager.sqlite'
    with closing(sqlite3.connect(stage/name)) as db:
        db.execute("UPDATE simulation_models SET model_file='C:/private/vendor.lib'");db.commit()
    refresh_hash(stage,name)
    with pytest.raises(ValueError, match='Private or unknown model path'):
        preview.verify(stage)


def test_existing_or_private_workspace_target_is_rejected(pristine):
    with pytest.raises(ValueError,match='new directory'):
        preview.prepare(pristine)
    with pytest.raises(ValueError,match='dist/public'):
        preview.prepare(ROOT/'db/forbidden-public-preview')
    assert not (ROOT/'db/forbidden-public-preview').exists()
