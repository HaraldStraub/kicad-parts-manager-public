"""Atomic, revision-checked local category choices; source libraries stay intact."""
from datetime import datetime,timezone
from .manual_data import component_key
from .api_errors import ApiError


def editable(row):
    return row.get('kind')!='footprint' and bool(row.get('symbol') or row.get('import_key') or row.get('id','').startswith('CMP-'))


def targets(rows):
    paths=set()
    for row in rows:
        if editable(row):
            for value in (row.get('category',''),row.get('automatic_category','')):
                parts=value.split('/')
                paths.update('/'.join(parts[:n]) for n in range(1,len(parts)+1) if parts[0] not in ('footprints','libraries') and not (parts[0]=='unassigned' and n>1))
    paths.update('protection/fuse/'+s for s in ('melting_fuse','resettable_fuse','thermal_fuse','other'))
    paths.update('switches/'+s for s in ('pushbutton','toggle_rocker','slide_switch','rotary_switch','dip_switch','reed_switch','limit_switch','other'))
    return sorted(paths-{''})


def change_categories(manual,items,rows,allowed):
    if not isinstance(items,list) or not 1<=len(items)<=1000:raise ValueError('Invalid category selection.')
    ids=[i.get('component_id') for i in items if isinstance(i,dict)]
    if len(ids)!=len(items) or not all(isinstance(i,str) for i in ids) or len(set(ids))!=len(ids):raise ValueError('Duplicate or invalid component selection.')
    selected=[]
    for item in items:
        row=rows.get(item['component_id'])
        if not row or not editable(row):raise ValueError('Component cannot be recategorized.')
        target=item.get('category')
        if target is not None and not isinstance(target,str):raise ValueError('Invalid target category.')
        if target is not None and target not in allowed:raise ValueError('Unknown target category.')
        if type(item.get('revision')) is not int:raise ValueError('Category revision required.')
        selected.append((row,item))
    if len({component_key(row) for row,_ in selected})!=len(selected):
        raise ValueError('Duplicate component identity.')
    result=[];now=datetime.now(timezone.utc).isoformat()
    with manual.connect() as db:
        db.execute('BEGIN IMMEDIATE')
        # Check the whole batch before changing any item.
        stored={}
        for row,item in selected:
            key=component_key(row)
            old=db.execute('SELECT revision,category FROM category_overrides WHERE component=?',(key,)).fetchone()
            revision,previous=old if old else (0,None)
            if revision!=item['revision']:raise ApiError('stale_data','Category changed since selection. Reload and retry.')
            stored[key]=(revision,previous)
        for row,item in selected:
            key=component_key(row);revision,previous=stored[key];target=item.get('category')
            if target!=previous:
                revision+=1
                db.execute('INSERT OR REPLACE INTO category_overrides VALUES (?,?,?,?)',(key,revision,target,now))
                db.execute('INSERT INTO category_history VALUES (?,?,?,?,?)',(key,revision,previous,target,now))
            automatic=row.get('automatic_category',row['category'])
            result.append(dict(component_id=row['id'],category=target if target is not None else automatic,automatic_category=automatic,category_override=target,category_revision=revision,previous_category=previous))
    return dict(changes=result)
