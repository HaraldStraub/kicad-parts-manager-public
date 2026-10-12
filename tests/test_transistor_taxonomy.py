import json
import pytest
from kicad_parts_manager.kicad.transistor_taxonomy import transistor_category
from kicad_parts_manager.kicad.inventory import category
from kicad_parts_manager.browser import InventoryCache
from kicad_parts_manager.manual_data import fields_for

@pytest.mark.parametrize('library,description,path',[
 ('Transistor_BJT','Dual NPN/NPN Transistors','transistor/bjt/arrays/npn'),
 ('Transistor_BJT','Dual PNP/PNP Transistors','transistor/bjt/arrays/pnp'),
 ('Transistor_BJT','Dual NPN/PNP Transistors','transistor/bjt/arrays/complementary'),
 ('Transistor_BJT','NPN transistor array','transistor/bjt/arrays/npn'),
 ('Transistor_FET','Dual N-Channel MOSFET','transistor/fet/mosfet/arrays/n_channel'),
 ('Transistor_FET','Dual N and P Channel MOSFET','transistor/fet/mosfet/arrays/complementary'),
 ('Transistor_Power_Module','3-phase, Freewheeling Diode, Brake Chopper, Diode Rectifier','power_modules/other'),
 ('Transistor_FET','Dual P-Channel MOSFET','transistor/fet/mosfet/arrays/p_channel'),
 ('Transistor_FET','Complementary pair P-Channel and N-Channel MOSFET','transistor/fet/mosfet/arrays/complementary'),
 ('Module','IGBT power module','power_modules/igbt'),
 ('Module','SiC MOSFET module','power_modules/mosfet/sic'),
 ('Module','Silicon MOSFET module','power_modules/mosfet/silicon'),
 ('Module','MOSFET module','power_modules/mosfet'),
 ('Module','GaN FET module','power_modules/gan'),
 ('CERN/Diodes','1600V 300A Rectifier Thyristor Module','power_modules/thyristor_module'),
 ('CERN/Diodes','Antiparallel Thyristor Module','power_modules/thyristor_module'),
 ('Diode','Bridge rectifier module','power_modules/diode_module'),
 ('Module','Mixed power semiconductor module','power_modules/mixed_module'),
 ('Module','Intelligent power module','power_modules/other'),
])
def test_explicit_classification(library,description,path):
 expected='semiconductor/'+path
 assert transistor_category(library,'Part',description)==expected
 assert category(library,'Part',description)==expected

@pytest.mark.parametrize('library,description',[
 ('Transistor_FET','N-Channel Dual Gate MOSFET'),
 ('Transistor_FET','N-Channel MOSFET'),
 ('Driver_FET','Dual MOSFET driver'),
 ('Driver_Motor','IGBT module gate driver'),
 ('Amplifier_Operational','Dual bipolar input amplifier'),
 ('Relay_SolidState','Dual Photo MOSFET relay'),
 ('Module','Buck DC/DC module'),
 ('Converter_ACDC','Compact AC/DC board mount power module'),
 ('Converter_DCDC','MOSFET DC/DC power module'),
 ('CERN/Diodes','Concept designed for replacing 3 x 20mm SCR / diode half bridge modules'),
 ('Module','Bluetooth module'),
 ('Isolator','Dual optocoupler NPN output'),
])
def test_incidental_mentions_stay_unchanged(library,description):
 assert transistor_category(library,'Part',description) is None

def test_simulation_models_are_not_reclassified():
 assert transistor_category('Transistor_BJT','Part','Dual NPN transistor','simulation/generic/bjt') is None

def test_existing_index_is_classified_without_writing(tmp_path):
 path=tmp_path/'library-catalog.json'
 data={'components':[{'id':'one','name':'Dual','library':'Transistor_BJT','description':'Dual NPN/PNP transistors','category':'semiconductor/transistor/bjt/other','kind':'library'}]}
 path.write_text(json.dumps(data),encoding='utf-8');before=path.read_bytes()
 row=InventoryCache(path)()['components'][0]
 assert row['category']=='semiconductor/transistor/bjt/arrays/complementary'
 assert path.read_bytes()==before

def test_arrays_keep_existing_ratings_and_module_profiles_are_available():
 for old,new in [('semiconductor/transistor/bjt/npn','semiconductor/transistor/bjt/arrays/npn'),('semiconductor/transistor/fet/mosfet/n_channel','semiconductor/transistor/fet/mosfet/arrays/n_channel')]:
  assert fields_for({'category':old})==fields_for({'category':new})
 assert 'vces_max' in {f['key'] for f in fields_for({'category':'semiconductor/power_modules/igbt'})}
 assert 'vds_max' in {f['key'] for f in fields_for({'category':'semiconductor/power_modules/mosfet/sic'})}
 assert 'vr_max' in {f['key'] for f in fields_for({'category':'semiconductor/power_modules/thyristor_module'})}


def test_manual_category_wins_over_new_automatic_category(tmp_path):
 import sqlite3
 from kicad_parts_manager.manual_data import ManualData
 path=tmp_path/'manual.sqlite';manual=ManualData(path)
 with sqlite3.connect(path) as db:
  db.execute("INSERT INTO category_overrides VALUES (?,?,?,?)",('symbol:Transistor_BJT:Dual',1,'semiconductor/transistor/bjt/npn','2026-10-09'))
 row={'id':'one','symbol':'Transistor_BJT:Dual','kind':'library','category':'semiconductor/transistor/bjt/arrays/npn','values':{},'parameters':[],'models':[]}
 result=manual.apply_catalog([row])[0]
 assert result['category']=='semiconductor/transistor/bjt/npn'
 assert result['automatic_category']=='semiconductor/transistor/bjt/arrays/npn'
