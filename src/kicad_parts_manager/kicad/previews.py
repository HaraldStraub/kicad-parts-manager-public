"""Prepare symbol and footprint previews before publishing a rescanned inventory."""
from pathlib import Path
from collections import defaultdict
from kicad_parts_manager.kicad.inventory import parse,children,field
from kicad_parts_manager.kicad.geometry import symbol_geometry

def pair(node, key):
    return [float(x) for x in children(node, key)[0][1:3]]

def geometry(nodes, footprint=False):
    shapes = []
    for n in nodes:
        kind = n[0] if n else ''
        try:
            if kind in ('polyline', 'fp_poly'):
                points = [[float(v) for v in p[1:3]] for p in children(children(n,'pts')[0],'xy')]
                shapes.append(dict(type='polyline', points=points))
            elif kind in ('rectangle','fp_rect','fp_line'):
                shapes.append(dict(type='line' if kind=='fp_line' else 'rect', a=pair(n,'start'), b=pair(n,'end')))
            elif kind in ('circle','fp_circle'):
                center=pair(n,'center')
                radius=float(field(n,'radius')) if kind=='circle' else sum((a-b)**2 for a,b in zip(center,pair(n,'end')))**.5
                shapes.append(dict(type='circle', center=center, radius=radius))
            elif kind=='pin':
                x,y=pair(n,'at'); angle=float(children(n,'at')[0][3]); length=float(field(n,'length'))
                import math
                shapes.append(dict(type='line',a=[x,y],b=[x+length*math.cos(math.radians(angle)),y+length*math.sin(math.radians(angle))]))
                shapes.append(dict(type='text',at=[x,y],label=field(n,'number')))
            elif kind=='pad':
                x,y=pair(n,'at'); w,h=pair(n,'size')
                shapes.append(dict(type='pad',a=[x-w/2,y-h/2],b=[x+w/2,y+h/2],label=n[1]))
        except (ValueError,IndexError):
            continue
    return dict(shapes=shapes, flip_y=not footprint, simplified=True)

def prepare_previews(data,progress):
    groups=defaultdict(list)
    for row in data['components']:
        if row.get('kind')=='library':groups[row['source_file']].append(row)
    progress(dict(phase='symbolPreviews',completed=0,total=len(groups)))
    for number,(source,rows) in enumerate(groups.items(),1):
        try:
            root=parse(Path(source).read_text(encoding='utf-8-sig'))
            symbols={node[1]:node for node in children(root,'symbol')}
            for row in rows:row['symbol_preview']=symbol_geometry(root,row['name'],symbols=symbols)
        except (OSError,ValueError):
            for row in rows:row['symbol_preview_reason']='Symboldatei fehlt oder kann nicht gelesen werden.'
        progress(dict(phase='symbolPreviews',completed=number,total=len(groups)))
    footprints={}
    rows=data['components']
    progress(dict(phase='footprintPreviews',completed=0,total=len(rows)))
    for number,row in enumerate(rows,1):
        info=row.get('footprint_info') or {};path=info.get('path')
        if path and info.get('found'):
            if path not in footprints:
                try:footprints[path]=geometry([node for node in parse(Path(path).read_text(encoding='utf-8-sig')) if isinstance(node,list)],True)
                except (OSError,ValueError):footprints[path]=None
            row['footprint_preview_key']=path
        if number%250==0 or number==len(rows):progress(dict(phase='footprintPreviews',completed=number,total=len(rows)))
    data['previews']={'footprints':footprints}


def footprint_geometry(row, shared=None):
    """Use the same cached/file-backed footprint drawing in every view."""
    value = row.get('footprint_preview') or (shared or {}).get(row.get('footprint_preview_key'))
    if value and value.get('shapes'):
        return value
    info = row.get('footprint_info') or {}
    if info.get('found') and info.get('path'):
        try:
            tree = parse(Path(info['path']).read_text(encoding='utf-8-sig'))
            value = geometry([n for n in tree if isinstance(n, list)], True)
            if value['shapes']:
                return value
        except (OSError, ValueError, IndexError):
            pass
    return None
