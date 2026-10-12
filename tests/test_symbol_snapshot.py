from hashlib import sha256

from kicad_parts_manager.model_library import symbol_snapshot
from kicad_parts_manager.kicad.geometry import arc_points
import pytest


def test_pin_labels_follow_orientation_and_hidden_pin_stays_available(tmp_path):
    path=tmp_path/'labels.kicad_sym'
    path.write_text('''(kicad_symbol_lib (symbol "P" (pin_names (offset 1))
      (symbol "P_0_0"
        (pin input line (at -10 0 0) (length 3) (name "VIN+") (number "3"))
        (pin output line (at 10 0 180) (length 3) (name "OUT") (number "6"))
        (pin passive line (at -10 0 0) (length 3) hide (name "RG") (number "8"))
        (pin power_in line (at 0 10 270) (length 3) (name "V+") (number "7")))))''',encoding='utf8')
    snapshot=symbol_snapshot(dict(source_file=str(path),symbol='Test:P'))
    labels={s['label']:s for s in snapshot['preview']['shapes'] if s['type']=='text'}
    assert labels['VIN+']['at']==[-6,0] and labels['VIN+']['anchor']=='start'
    assert labels['OUT']['at']==[6,0] and labels['OUT']['anchor']=='end'
    assert labels['V+']['angle']==90
    assert '8' not in labels and 'RG' not in labels
    assert any(p['number']=='8' for p in snapshot['pins'])


@pytest.mark.parametrize('mid', [[0,1],[0,-1]])
def test_arc_preserves_endpoints_and_midpoint_side(mid):
    points=arc_points([-1,0],mid,[1,0])
    assert points[0]==[-1,0] and points[-1]==[1,0]
    assert points[len(points)//2]==pytest.approx(mid)
    assert all(x*x+y*y==pytest.approx(1) for x,y in points)


def test_cached_preview_upgrade_can_draw_thermal_fuse_arcs(tmp_path):
    path=tmp_path/'fuse.kicad_sym'
    path.write_text('(kicad_symbol_lib (symbol "F" (symbol "F_0_1" (arc (start -1 0) (mid 0 1) (end 1 0)) (bezier (pts (xy 0 0))))))',encoding='utf8')
    preview=symbol_snapshot(dict(source_file=str(path),symbol='Test:F'))['preview']
    assert preview['preview_version']==3
    assert len(preview['shapes'][0]['points'])>3
    assert preview['unsupported']==['bezier']


def test_preview_includes_common_body_style_zero(tmp_path):
    path=tmp_path/'common.kicad_sym'
    path.write_text('(kicad_symbol_lib (symbol "R" (symbol "R_1_0" (rectangle (start -1 -1) (end 1 1)))))',encoding='utf8')
    result=symbol_snapshot(dict(source_file=str(path),symbol='Test:R'))
    assert result['preview']['shapes'][0]['type']=='rect'


def test_snapshot_resolves_inherited_symbol_from_one_current_utf8_bom_file(tmp_path):
    path = tmp_path / "symbols.kicad_sym"
    path.write_text(
        '(kicad_symbol_lib (symbol "Base" (symbol "Base_1_1" (rectangle (start -1 -1) (end 1 1)) (pin passive line (at -2 0 0) (length 1) (name "A") (number "2")))) (symbol "Part" (extends "Base")))',
        encoding="utf-8-sig",
    )
    row = {"source_file": str(path), "symbol": "Test:Part"}
    first = symbol_snapshot(row)
    assert first["source"]["sha256"] == sha256(path.read_bytes()).hexdigest()
    assert first["pins"] == [{"number": "2", "name": "A", "electrical": "passive"}]
    assert first["preview"]["shapes"][0]["a"] == [-1, -1]
    assert first["preview"]["shapes"][-1]["label"] == "2"
    path.write_text(
        path.read_text(encoding="utf-8-sig").replace("(start -1 -1)", "(start -3 -3)"),
        encoding="utf-8-sig",
    )
    second = symbol_snapshot(row)
    assert (
        second["pins"] == first["pins"]
        and second["source"]["sha256"] != first["source"]["sha256"]
    )
    assert second["preview"]["shapes"][0]["a"] == [-3, -3]
    assert symbol_snapshot({}) == {"pins": [], "source": None, "preview": None}
