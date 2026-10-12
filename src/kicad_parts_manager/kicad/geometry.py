"""Simplified symbol drawing from the same parsed snapshot as its pin list."""

import math

PREVIEW_VERSION = 3


def arc_points(start, mid, end):
    """Sample the circle through three KiCad points, along the midpoint side."""
    ax, ay = start; bx, by = mid; cx, cy = end
    d = 2 * (ax * (by-cy) + bx * (cy-ay) + cx * (ay-by))
    if abs(d) < 1e-12:
        return [start, mid, end]
    aa, bb, cc = ax*ax+ay*ay, bx*bx+by*by, cx*cx+cy*cy
    x = (aa*(by-cy)+bb*(cy-ay)+cc*(ay-by))/d
    y = (aa*(cx-bx)+bb*(ax-cx)+cc*(bx-ax))/d
    a, m, e = [math.atan2(p[1]-y,p[0]-x) for p in (start,mid,end)]
    sweep = (e-a) % math.tau
    if (m-a) % math.tau > sweep:
        sweep -= math.tau
    steps = max(8, math.ceil(abs(sweep)/math.radians(5)))
    radius = math.hypot(ax-x,ay-y)
    points = [[x+radius*math.cos(a+sweep*i/steps),y+radius*math.sin(a+sweep*i/steps)] for i in range(steps+1)]
    points[0], points[-1] = start, end
    return points

from kicad_parts_manager.kicad.inventory import children, field


def pair(node, key):
    return [float(x) for x in children(node, key)[0][1:3]]


def symbol_geometry(root, name, symbols=None):
    if symbols is None:symbols = {node[1]: node for node in children(root, "symbol")}

    def drawing(part, seen):
        if part not in symbols or part in seen:
            return []
        symbol = symbols[part]
        parent = field(symbol, "extends")
        nodes = drawing(parent, seen | {part}) if parent else []
        nodes += [
            node
            for unit in children(symbol, "symbol")
            if unit[1].endswith(("_0_0", "_1_0", "_0_1", "_1_1"))
            for node in unit
            if isinstance(node, list)
        ]
        return nodes

    settings={}
    def inherit_settings(part,seen):
        if part not in symbols or part in seen:return
        symbol=symbols[part];parent=field(symbol,'extends')
        if parent:inherit_settings(parent,seen|{part})
        for key in ('pin_names','pin_numbers'):
            value=children(symbol,key)
            if value:settings[key]=value[0]
    inherit_settings(name,set())
    names_hidden='hide' in settings.get('pin_names',[])
    numbers_hidden='hide' in settings.get('pin_numbers',[])
    offset=float(field(settings.get('pin_names',[]),'offset') or .508)
    shapes = []
    unsupported = set()
    for node in drawing(name, set()):
        kind = node[0] if node else ""
        try:
            if kind == "polyline":
                points = [
                    [float(v) for v in point[1:3]]
                    for point in children(children(node, "pts")[0], "xy")
                ]
                shapes.append({"type": "polyline", "points": points})
            elif kind == "arc":
                shapes.append({'type':'polyline','points':arc_points(pair(node,'start'),pair(node,'mid'),pair(node,'end'))})
            elif kind == "rectangle":
                shapes.append(
                    {"type": "rect", "a": pair(node, "start"), "b": pair(node, "end")}
                )
            elif kind == "circle":
                shapes.append(
                    {
                        "type": "circle",
                        "center": pair(node, "center"),
                        "radius": float(field(node, "radius")),
                    }
                )
            elif kind == "pin":
                x, y = pair(node, "at")
                angle = float(children(node, "at")[0][3])
                length = float(field(node, "length"))
                if 'hide' in node or any(n[0]=='hide' and (len(n)==1 or n[1]=='yes') for n in node if isinstance(n,list)):
                    continue
                direction = [round(math.cos(math.radians(angle)), 8), round(math.sin(math.radians(angle)), 8)]
                end = [x+length*direction[0], y+length*direction[1]]
                shapes.append(dict(type='line',a=[x,y],b=end))
                def pin_text(key):
                    values=children(node,key)
                    if not values:return '',1.27
                    entry=values[0];size=1.27
                    effects=children(entry,'effects')
                    if effects:
                        font=children(effects[0],'font')
                        if font and children(font[0],'size'):size=float(children(font[0],'size')[0][1])
                    return entry[1],size
                label,size=pin_text('name')
                horizontal=abs(direction[0])>.5
                if label and label!='~' and not names_hidden:
                    shapes.append(dict(type='text',at=[end[0]+offset*direction[0],end[1]+offset*direction[1]],label=label,size=size,anchor=('start' if direction[0]>0 else 'end') if horizontal else ('start' if direction[1]>0 else 'end'),angle=0 if horizontal else 90,baseline='middle'))
                number,size=pin_text('number')
                if number and not numbers_hidden:
                    shapes.append(dict(type='text',at=[(x+end[0])/2+(.55 if not horizontal else 0),(y+end[1])/2+(.55 if horizontal else 0)],label=number,size=size,anchor='middle',angle=0 if horizontal else 90,baseline='auto'))
            elif kind in ('bezier', 'text', 'text_box', 'image'):
                unsupported.add(kind)
        except (ValueError, IndexError):
            unsupported.add(kind)
            continue
    return {"shapes": shapes, "flip_y": True, "simplified": True,
            "preview_version": PREVIEW_VERSION, "unsupported": sorted(unsupported)}
