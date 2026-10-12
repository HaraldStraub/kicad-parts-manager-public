"""Pinned manufacturer pilot. Downloads remain local; no vendor file redistribution."""
from hashlib import sha256
from pathlib import Path
from urllib.request import urlopen
from sqlalchemy import select
from kicad_parts_manager.database.models import *
from kicad_parts_manager.database.session import allocate_id

DESCRIPTIONS={'2N7002':'N-Kanal-MOSFET, SOT-23', 'BC847B':'NPN-Kleinsignaltransistor, Verstärkungsgruppe B, SOT-23', '1N4148W':'Schnelle Signal- und Schaltdiode, SOD-123'}

PARTS = [
 dict(mpn='2N7002', slug='1941', hash='ca0fa03b0ff97da1ba91235cf8882ff82a1fe936dfa91d384ae168ec2a35f241', model='N7002', type='X', family='mosfet', category='semiconductor/transistor/fet/mosfet/n_channel', symbol='Transistor_FET:2N7002', footprint='Package_TO_SOT_SMD:SOT-23', pins=[('1','G',2),('2','S',3),('3','D',1)]),
 dict(mpn='BC847B', slug='2846', hash='4c76c834b75d643ddb6f2aedc3c335dc601aebfd4ec04dbefcc2251f22ad3398', model='DI_BC847B', type='Q', family='bjt', category='semiconductor/transistor/bjt/npn', symbol='Transistor_BJT:BC847', footprint='Package_TO_SOT_SMD:SOT-23', pins=[('1','B',2),('2','E',3),('3','C',1)]),
 dict(mpn='1N4148W', slug='1589', hash='eac112ab3b235eb9f54916f7f9d793ba15091a1fb6988e4eef5652aad393437a', model='1N4148W', type='D', family='diode', category='semiconductor/diode/switching', symbol='Diode:1N4148W', footprint='Diode_SMD:D_SOD-123', pins=[('1','K',2),('2','A',1)]),
]


def model_url(part):
    return f"https://www.diodes.com/spice/download/{part['slug']}/{part['mpn']}.spice.txt"


def import_pilot(session, root, download=False):
    maker=session.scalar(select(Manufacturer).where(Manufacturer.name=='Diodes Incorporated'))
    if not maker:
        maker=Manufacturer(name='Diodes Incorporated');session.add(maker);session.flush()
    ids=[]
    for p in PARTS:
        path=root/'models/vendor'/f"{p['mpn']}.lib"
        if download and not path.exists():
            path.parent.mkdir(parents=True,exist_ok=True)
            with urlopen(model_url(p),timeout=30) as response: data=response.read(100000)
            if sha256(data).hexdigest()!=p['hash']:raise ValueError('Unexpected download hash: '+p['mpn'])
            path.write_bytes(data)
        if sha256(path.read_bytes()).hexdigest()!=p['hash']:raise ValueError('Model hash changed: '+p['mpn'])
        component=session.scalar(select(Component).where(Component.manufacturer_id==maker.id,Component.mpn==p['mpn']))
        if component:
            model=session.scalar(select(SimulationModel).where(SimulationModel.component_id==component.id,SimulationModel.sha256==p['hash']))
            if not model:raise ValueError('Existing component requires explicit model update')
            ids.append(model.id);continue
        parent=None
        for i in range(1,len(p['category'].split('/'))+1):
            sub='/'.join(p['category'].split('/')[:i]);cat=session.scalar(select(Category).where(Category.path==sub))
            if not cat:
                cat=Category(path=sub,parent_id=parent);session.add(cat);session.flush()
            parent=cat.id
        component=Component(id=allocate_id(session,'CMP'),manufacturer_id=maker.id,mpn=p['mpn'],category_id=parent,description=DESCRIPTIONS[p['mpn']],quality_status=Status.UNVERIFIED)
        session.add(component);session.flush()
        session.add(EdaMapping(component_id=component.id,kicad_symbol=p['symbol'],kicad_footprint=p['footprint']))
        source=Source(manufacturer_id=maker.id,kind='manufacturer SPICE model',url=model_url(p),version=p['hash'][:12],download_date=now(),sha256=p['hash'],license_info='Manufacturer AS-IS disclaimer retained in original file; redistribution permission not established. Local download only.')
        session.add(source);session.flush()
        ds=Source(manufacturer_id=maker.id,kind='manufacturer datasheet',url=f"https://www.diodes.com/datasheet/download/{p['mpn']}.pdf",license_info='Manufacturer copyright; linked only.')
        session.add(ds);session.flush();session.add(Document(component_id=component.id,source_id=ds.id,kind='datasheet'))
        model=SimulationModel(id=allocate_id(session,'SIM'),component_id=component.id,model_type=p['type'],model_name=p['model'],manufacturer_model=True,source_id=source.id,source_url=model_url(p),model_file=str(path.resolve()),sha256=p['hash'],model_class=ModelClass.TRANSIENT,compatibility=Compatibility.UNKNOWN,status=Status.UNVERIFIED)
        session.add(model);session.flush()
        for num,role,position in p['pins']:
            session.add(PinMap(simulation_model_id=model.id,symbol_pin=num,symbol_pin_name=role,model_pin=position,model_pin_name=role,verified=False))
        for purpose in ('dc','switching'):
            session.add(PreferredModel(component_id=component.id,purpose=purpose,simulation_model_id=model.id))
        ids.append(model.id)
    session.commit();return ids
