import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Load as an ES module without making the Python package depend on a Node project.
let source = await readFile(new URL('../src/kicad_parts_manager/web/catalog-utils.js', import.meta.url), 'utf8');
const profileSource = await readFile(new URL('../src/kicad_parts_manager/web/parameter-profiles.js', import.meta.url), 'utf8');
source=source.replace('./parameter-profiles.js','data:text/javascript;base64,'+Buffer.from(profileSource).toString('base64'));
const {categoryPath,matchesView,assetState,matchesAssets,matchesEvidence,matchesSimulation,simulationCandidates,purposePass,diodeFunctionState,simulation,selectionPayload,csvCell,compareValues,descriptionRatings,functionTags,extraRatings,profile,availableProfile,matchesParameter,parameterEvidence,localDataKey,exportParameter,catalogCsv} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const component = {id:'SYM-1',name:'Test',kind:'library',symbol:'Test:Part',symbol_found:true,footprint:'Package:SOT',
  footprint_info:{found:true,models:[{found:true},{found:false}]},models:[],registered:false,kicad_reference:'Test:Part'};

test('switch and relay subgroups retain ratings while SSRs and encoders exclude inappropriate coil or magnetic fields',()=>{
 const keys=path=>availableProfile(path).map(f=>f[0]);
 assert.ok(keys('switches/dip_switch').includes('contact_configuration'));
 assert.ok(keys('relays/electromechanical_relays/monostable_relay').includes('coil_voltage'));
 assert.ok(keys('relays/reed_relay').includes('coil_voltage'));
 assert.ok(keys('relays/solid_state_relay').includes('contact_current'));
 assert.equal(keys('relays/solid_state_relay').includes('coil_voltage'),false);
 assert.equal(keys('sensors/rotary_encoder').includes('measurement_min'),false);
 assert.ok(keys('protection/fuse/resettable_fuse').includes('rated_current'));
});

test('imported parts sharing a symbol retain separate edit and simulation identities',()=>{
 assert.equal(localDataKey({...component,import_key:'IMP-A'}),'import:IMP-A');
 assert.notEqual(localDataKey({...component,import_key:'IMP-A'}),localDataKey({...component,import_key:'IMP-B'}));
 assert.equal(localDataKey(component),'symbol:Test:Part');
});

test('persisted description extraction retains description provenance',()=>{
 const row={values:{vr_max:100},manual_data:{values:{vr_max:{value:100,status:'UNVERIFIED',kind:'unspecified',source:'KiCad description: Diode:1N914',source_details:{document:'KiCad symbol description'}}}}};
 const evidence=parameterEvidence(row,'vr_max');
 assert.equal(evidence.sourceType,'description');
 assert.equal(evidence.status,'UNVERIFIED');
 assert.equal(evidence.kind,'unspecified');
});

test('compact category defaults retain optional legacy fields without reinterpreting voltage limits',()=>{
 assert.deepEqual(profile('integrated/power_ic/linear_regulator').map(f=>f[0]),['input_voltage_min','input_voltage_max','output_mode','output_voltage','output_current','dropout_voltage','quiescent_current']);
 assert.ok(availableProfile('integrated/power_ic/linear_regulator').some(f=>f[0]==='supply_min_description'&&f[4].optional));
 assert.deepEqual(profile('opto/led').map(f=>f[0]),['led_color','forward_current','vf_typ','luminous_intensity']);
 assert.ok(availableProfile('opto/led').some(f=>f[0]==='wavelength'));
 const bridge=availableProfile('semiconductor/diode/bridge');assert.ok(profile('semiconductor/diode/bridge').some(f=>f[0]==='vrrm'));
 assert.ok(profile('semiconductor/diode/bridge').some(f=>f[0]==='vr_rms'));
 const rms={...component,category:'semiconductor/diode/bridge',values:{vr_rms:125,if_avg:.8}};
 assert.equal(exportParameter(rms,'vr_rms').value,125);assert.equal(exportParameter(rms,'vrrm').value,null);
 assert.ok(bridge.find(f=>f[0]==='vr_max')[4].optional);
 const old={...component,category:'semiconductor/diode/bridge',values:{vr_max:100}};
 assert.equal(exportParameter(old,'vrrm').value,null);assert.equal(exportParameter(old,'vr_max').value,100);
 assert.ok(profile('semiconductor/diode/zener').some(f=>f[0]==='initial_tolerance'));
});

test('field comparisons support losses, nominal output and complete input-range coverage',()=>{
 const definition=(category,key)=>availableProfile(category).find(f=>f[0]===key);
 for(const [category,key] of [['integrated/power_ic/linear_regulator','dropout_voltage'],['semiconductor/transistor/igbt','vce_sat'],['semiconductor/diode/bridge','bridge_forward_voltage'],['integrated/analog/voltage_reference','temperature_drift']]){
   assert.equal(definition(category,key)[4].comparison,'max');assert.equal(matchesParameter(2,{direction:definition(category,key)[4].comparison,value:1}),false);
 }
 assert.equal(definition('integrated/power_ic/linear_regulator','output_voltage')[4].comparison,'equal');
 for(const [category,lower,upper] of [['integrated/power_ic/linear_regulator','input_voltage_min','input_voltage_max'],['modules/acdc','ac_input_voltage_min','ac_input_voltage_max'],['modules/dcdc','dc_input_voltage_min','dc_input_voltage_max']]){
   const covers=(min,max)=>matchesParameter(min,{direction:definition(category,lower)[4].comparison,value:9})&&matchesParameter(max,{direction:definition(category,upper)[4].comparison,value:24});
   assert.equal(covers(5,30),true);assert.equal(covers(12,30),false);assert.equal(covers(5,18),false);assert.equal(covers(null,30),false);
 }
});

test('remaining families use appropriate comparison directions and safe generic defaults',()=>{
 const field=(path,key)=>availableProfile(path).find(f=>f[0]===key)[4];
 for(const [path,key,direction] of [
   ['integrated/amplifier/opamp','offset_voltage','max'],['integrated/logic/gates','propagation_delay','max'],
   ['integrated/memory/ram','access_time','max'],['integrated/rf_ic/rf_amp','noise_figure','max'],
   ['timing_parts/crystals','frequency','equal'],['timing_parts/crystals','frequency_tolerance','max'],
   ['timing_parts/crystals','esr','max'],['connectors/rf_coax','characteristic_impedance','equal'],
   ['protection/fuse','rated_current','equal'],['relays','coil_voltage','equal'],
   ['sensors/temperature','measurement_min','max'],['sensors/temperature','measurement_max','min'],
   ['sensors/temperature','accuracy','max'],['passive/filter/rf_filter','insertion_loss','max'],
   ['passive/filter/emc_filter','insertion_loss','min'],['semiconductor/diode/zener','zener_voltage','equal']])assert.equal(field(path,key).comparison,direction,path+'/'+key);
 assert.equal(matchesParameter(-.020,{direction:'max',value:.010,absolute:field('integrated/amplifier/opamp','offset_voltage').absolute}),false);
 assert.equal(matchesParameter(-.005,{direction:'max',value:.010,absolute:true}),true);
 for(const path of ['simulation/generic/diode','simulation/generic/fet','simulation/generic/bjt','simulation/generic/opamp','schematic/graphics','unassigned/Unknown'])assert.equal(profile(path).length,0,path);
 assert.deepEqual(profile('simulation/generic/resistor').map(f=>f[0]),['resistance']);
 assert.ok(availableProfile('simulation/generic/opamp').some(f=>f[0]==='offset_voltage'));
});

test('every profile has explicit numeric comparisons and compact defaults with valid unique field IDs',()=>{
 const definitions=JSON.parse(profileSource.replace('export default ','').trim().replace(/;$/,''));
 for(const [category,fields] of Object.entries(definitions)){
   assert.equal(new Set(fields.map(f=>f[0])).size,fields.length,category);
   assert.ok(fields.filter(f=>!f[4]?.optional).length<=7,category);
   for(const field of fields)if(field[4].type!=='text')assert.ok(['min','max','equal','range'].includes(field[4].comparison),category+'/'+field[0]);
 }
});

test('native KiCad sources and default semiconductor models need no external assignment',()=>{
 for(const fields of [
  {'Sim.Device':'V','Sim.Type':'EXP','Sim.Params':'y1=0 y2=1 td1=2n tau1=30n td2=60n tau2=40n'},
  {'Sim.Device':'I','Sim.Type':'PULSE','Sim.Params':'y1=0 y2=1 tw=50n per=100n'},
  {'Sim.Device':'V','Sim.Type':'SIN','Sim.Params':'dc=0 ampl=1 f=1k'},
  {'Sim.Device':'V','Sim.Type':'DC'}, {'Sim.Device':'D'},
  {'Sim.Device':'NPN','Sim.Type':'GUMMELPOON'},
  {'Sim.Device':'SPICE','Sim.Params':'type="B" model="v=1"'}
 ]){const part={...component,simulation_fields:fields};assert.equal(matchesSimulation(part,'present'),true);assert.equal(matchesSimulation(part,'present','','generic'),true);assert.equal(matchesSimulation(part,'present','calculable'),false);assert.equal(simulation(part,''),'Internes KiCad-Modell · ungeprüft');assert.deepEqual(selectionPayload(part,'').simulation_fields,fields);}
 for(const fields of [{'Sim.Device':'IBIS'},{'Sim.Device':'SUBCKT'},{'Sim.Device':'V','Sim.Type':'EXP'},{'Sim.Device':'D','Sim.Library':'missing.lib'},{'Sim.Device':'SPICE','Sim.Params':'type="V" model="1" lib="missing.lib"'}])assert.equal(matchesSimulation({...component,simulation_fields:fields},'present'),false);
});

test('simulation exclusion fields alone do not make graphic symbols simulation components',()=>{
 const graphic={...component,category:'schematic_aids/graphics',simulation_fields:{'Sim.Enable':'0'}};
 assert.equal(matchesView(graphic,'simulation'),false);assert.equal(simulationCandidates(graphic).length,0);
 const incomplete={...component,category:'simulation/generic/passive',simulation_fields:{}};
 assert.equal(matchesView(incomplete,'simulation'),true);assert.equal(matchesSimulation(incomplete,'present'),false);
});

test('diode direction results keep their limited scope and invalidate stale evidence',()=>{
  const model={status:'UNVERIFIED',file_status:'found',passed:[],check:{diode_function:{suite:'diode-direction-1.0',ok:true}}};
  assert.equal(diodeFunctionState(model),'bestanden');assert.equal(purposePass(model,'dc'),false);assert.equal(purposePass(model,'switching'),false);
  assert.equal(diodeFunctionState({...model,check:{...model.check,stale:true}}),'erneut prüfen');
  assert.equal(diodeFunctionState({...model,file_status:'changed'}),'erneut prüfen');
  assert.equal(diodeFunctionState({...model,status:'REJECTED'}),'erneut prüfen');
  assert.equal(diodeFunctionState({...model,check:{diode_function:{suite:'old',ok:true}}}),'erneut prüfen');
  assert.equal(diodeFunctionState({...model,check:{diode_function:{suite:'diode-direction-1.0',ok:false}}}),'nicht bestanden');
  assert.equal(diodeFunctionState({}),null);
});

test('diode evidence filter requires one present current model and never implies a purpose test',()=>{
  const model={name:'Test',status:'UNVERIFIED',file_status:'found',passed:[],check:{ok:true,diode_function:{suite:'diode-direction-1.0',ok:true}}};
  const row={...component,models:[model]};
  assert.equal(matchesSimulation(row,'present','diode','specific'),true);
  assert.equal(matchesSimulation(row,'present','dc'),false);assert.equal(matchesSimulation(row,'present','switching'),false);
  assert.match(simulation(row,'switching'),/Dioden-Grundfunktion/);
  assert.equal(matchesSimulation({...row,models:[{...model,file_status:'missing'}]},'','diode'),false);
  assert.equal(matchesSimulation({...row,models:[{...model,check:{...model.check,stale:true}}]},'','diode'),false);
  assert.equal(matchesSimulation({...row,models:[{...model,model_scope:'generic',name:'other'},{...model,check:{ok:true}}]},'present','diode','specific'),false);
});

test('local override identity separates manufacturer entries from the same KiCad symbol',()=>{
  assert.equal(localDataKey(component),localDataKey({...component,id:'new-scan-id'}));
  assert.notEqual(localDataKey(component),localDataKey({...component,id:'CMP-000001',kind:'manufacturer'}));
  assert.notEqual(localDataKey({...component,id:'CMP-000001'}),localDataKey({...component,id:'CMP-000002'}));
  assert.equal(localDataKey({...component,kind:'footprint'}),'footprint:Package:SOT');
});

test('CSV and selection JSON preserve SI values, provenance, kinds and measured conditions',()=>{
  const row={...component,category:'semiconductor/transistor/fet/mosfet/n_channel',values:{qg:223e-12},manual_data:{values:{qg:{value:223e-12,unit:'C',kind:'typical',source:'Manufacturer PDF',status:'UNVERIFIED',conditions:'VGS = 4.5 V',conditions_data:{gate_voltage:4.5},source_details:{candidate_id:'diodes-2n7002',page:'2'}}}}};
  const value=exportParameter(row,'qg');assert.equal(value.value,223e-12);assert.equal(value.stored_unit,'C');assert.equal(value.display_unit,'nC');assert.equal(value.display_factor,1e9);assert.equal(value.kind,'typical');
  assert.equal(value.status,'UNVERIFIED');assert.equal(value.source_type,'manufacturer');assert.deepEqual(value.conditions_data,{gate_voltage:4.5});
  const payload=selectionPayload(row,'dc');assert.deepEqual(payload.electrical_parameters.qg,value);assert.equal(payload.automatic_placement,false);
  const csv=catalogCsv([row],availableProfile(row.category).filter(f=>f[0]==='qg'));
  assert.match(csv,/qg.source_details/);assert.match(csv,/qg.conditions_data/);assert.match(csv,/typical/);assert.match(csv,/diodes-2n7002/);assert.match(csv,/223e-12|2\.23e-10/);
  const absent=exportParameter({...row,values:{},manual_data:{}},'qg');assert.equal(absent.value,null);assert.equal(absent.source_type,'unknown');
  const described=exportParameter({...row,values:{qg:1e-9},description_values:{qg:1e-9},manual_data:{},description:'Qg 1nC'},'qg');assert.equal(described.kind,'unspecified');assert.equal(described.conditions,'Qg 1nC');
});

test('temperature conditions distinguish TA, TC and TJ at the same numeric temperature',()=>{
  const limit={value:4,direction:'max',conditions:{test_temperature:25,temperature_basis:'TC'}};
  assert.equal(matchesParameter(3.5,limit,{conditions_data:{test_temperature:25,temperature_basis:'TA'}}),false);
  assert.equal(matchesParameter(3.5,limit,{conditions_data:{test_temperature:25,temperature_basis:'TC'}}),true);
  assert.equal(matchesParameter(3.5,limit,{conditions_data:{test_temperature:25}}),false);
});

test('family profiles work for nested library categories',()=>{
  assert.equal(profile('passive/capacitor/Capacitor_Wurth')[0][0],'capacitance');
  assert.equal(profile('semiconductor/diode/tvs')[0][0],'stand_off_description');
  assert.equal(profile('libraries/Unknown').length,0);
});
test('family descriptions extract explicit SI values and reject ambiguity',()=>{
  const c=(category,description)=>extraRatings({category,description});
  const capacitor=c('passive/capacitor','100nF 50V 10% capacitor');assert.ok(Math.abs(capacitor.capacitance-1e-7)<1e-18);assert.equal(capacitor.voltage_description,50);assert.equal(capacitor.tolerance_description,10);
  assert.deepEqual(c('passive/resistor','10kOhm 0.25W 1% resistor'),{resistance:10000,power_description:.25,tolerance_description:1});
  assert.deepEqual(c('connectors/Connector','Connector 2x5, 2.54mm pitch'),{pins_description:10,pitch_description:2.54});
  assert.deepEqual(c('passive/capacitor','100nF 10uF capacitor'),{});
  assert.deepEqual(c('integrated/amplifier','supply 2.7 to 5.5V'),{supply_min_description:2.7,supply_max_description:5.5});
});

test('sorting compares numeric ratings and naturally numbered names',()=>{
  assert.deepEqual([100,2,20].sort((a,b)=>compareValues(a,b)),[2,20,100]);
  assert.deepEqual(['SOT-23','SOT-5','SOT-223'].sort((a,b)=>compareValues(a,b)),['SOT-5','SOT-23','SOT-223']);
});
test('description ratings require explicit labels and reject ambiguous entries',()=>{
  const c={category:'semiconductor/transistor/mosfet/n_channel',description:'0.115A Id, 60V Vds, N-Channel MOSFET, SOT-23'};
  assert.deepEqual(descriptionRatings(c),{vds_max:60,id_cont:.115});
  assert.deepEqual(descriptionRatings({...c,description:'60V, 2A MOSFET'}),{});
  assert.deepEqual(descriptionRatings({...c,description:'60V Vds, 80V Vds, 100mA Id'}),{id_cont:.1});
});
test('diode and BJT descriptions preserve provisional meaning',()=>{
  assert.deepEqual(descriptionRatings({category:'semiconductor/diode/switching',description:'100V 0.3A Small Signal Fast Switching Diode, DO-35'}),{voltage_description:100,current_description:.3});
  assert.deepEqual(descriptionRatings({category:'semiconductor/transistor/bjt/npn',description:'NPN, 40V Vce, 200mA Ic'}),{vce_description:40,ic_description:.2});
  assert.deepEqual(descriptionRatings({category:'semiconductor/diode/tvs',description:'TVS 600W 30V clamping'}),{});
});
test('IC functions retain qualitative information without inventing ratings',()=>{
  const c={category:'integrated/amplifier/Amplifier_Buffer',description:'Wide-Band, High Current, Unity Gain Buffer Amplifier, TO-5-8'};
  assert.deepEqual(functionTags(c),['Buffer','Verstärkung 1','Breitbandig','Hoher Strom (qualitativ)']);
  assert.deepEqual(descriptionRatings(c),{});
});
test('unknown ratings remain last in both sort directions',()=>{
  for(const direction of [true,false]) {
    const result=[null,20,undefined,2,'',NaN,'—'].sort((a,b)=>compareValues(a,b,direction));
    assert.deepEqual(result.slice(0,2),direction?[2,20]:[20,2]);
    assert.equal(compareValues(null,20,direction),1);
  }
});
test('asset filters distinguish references, files and registration',()=>{
  assert.equal(assetState(component,'model3d'),'Teilweise gefunden');
  assert.equal(matchesAssets(component,'model3d'),true);
  assert.equal(matchesAssets(component,'registered'),false);
  assert.equal(assetState({...component,symbol_found:false},'symbol'),'Nicht gefunden');
  assert.equal(assetState({...component,footprint_info:{found:false,models:[]}},'model3d'),'Unbekannt');
});
test('declared simulation fields never imply a passed switching test',()=>{
  const c={...component,simulation_fields:{'Sim.Library':'some.lib'}};
  assert.equal(matchesEvidence(c,'present','switching'),false);
  assert.equal(matchesEvidence(c,'tested','switching'),false);
  const model={simulator:'ngspice',status:'TESTED',file_status:'found',passed:['dc_current']};
  assert.equal(purposePass(model,'switching'),false);
  assert.equal(simulation({...component,models:[model]},'dc'),'DC-Test bestanden');
  assert.equal(purposePass({...model,status:'REJECTED'},'dc'),false);
  assert.equal(matchesEvidence({...component,models:[model]},'dc','switching'),true);
  assert.equal(matchesEvidence({...component,models:[model]},'switching','dc'),false);
});
test('selection export preserves native reference without claiming automatic placement',()=>{
  const result=selectionPayload(component,'dc');
  assert.equal(result.kicad_reference,'Test:Part');
  assert.equal(result.registered,false);
  assert.equal(result.automatic_placement,false);
});
test('CSV keeps quotes and neutralizes spreadsheet formulas',()=>{
  assert.equal(csvCell('a"b'),'"a""b"');
  assert.equal(csvCell('=1+1'),'"\'=1+1"');
  assert.equal(csvCell(-2),'"-2"');
});


test('workspaces separate footprints and include generic simulation elements',()=>{
  assert.equal(matchesView({kind:'footprint'},''),false);
  assert.equal(matchesView({kind:'footprint'},'footprints'),true);
  assert.equal(matchesView({...component,category:'semiconductor/fet'},'simulation'),false);
  assert.equal(matchesView({...component,category:'semiconductor/fet',models:[{}]},'simulation'),true);
  const generic={kind:'generic',intrinsic:true,category:'passive/resistor'};
  assert.equal(categoryPath(generic),'simulation/generic/resistor');
  assert.equal(matchesView(generic,'simulation'),true);
});


test('manual electrical fields have matching display and filter units',()=>{
  assert.deepEqual(profile('semiconductor/diode/switching').find(f=>f[0]==='trr').slice(0,4),['trr','trr','ns',1e9]);
  assert.equal(profile('semiconductor/diode/switching').find(f=>f[0]==='vr_max')[2],'V');
  assert.equal(profile('integrated/analog/opamp').find(f=>f[0]==='output_current')[2],'mA');
});


test('simulation file availability distinguishes fields, missing, changed and empty',()=>{
  const fields={...component,simulation_fields:{'Sim.Library':'diode.lib'}};
  assert.equal(matchesSimulation(fields,'fields'),true);
  assert.equal(matchesSimulation({...fields,simulation_file_status:'missing'},'missing'),true);
  assert.equal(matchesSimulation({...fields,simulation_file_status:'missing'},'present'),false);
  assert.equal(matchesSimulation({...fields,simulation_file_status:'found'},'present'),true);
  assert.equal(matchesSimulation(component,'none'),true);
  const changed={...component,models:[{name:'Test',status:'TESTED',file_status:'changed',passed:['switching']}]};
  assert.equal(matchesSimulation(changed,'changed'),true);
  assert.equal(matchesSimulation(changed,'','switching'),false);
  assert.equal(simulation(changed,''),'Modelldatei geändert');
});

test('calculability never implies electrical purpose tests',()=>{
  const c={...component,models:[{name:'Test',status:'UNVERIFIED',file_status:'found',passed:[],check:{ok:true}}]};
  assert.equal(matchesSimulation(c,'present','calculable'),true);
  assert.equal(matchesSimulation(c,'present','dc'),false);
  assert.equal(matchesSimulation(c,'present','switching'),false);
  assert.equal(matchesSimulation(c,'present','untested'),false);
  assert.equal(simulation(c,''),'Berechenbar · Verhalten ungeprüft');
});

test('combined filters must match one and the same model',()=>{
  const generic={...component,name:'REAL',models:[{name:'REAL',model_scope:'specific',status:'UNVERIFIED',file_status:'found',passed:[]},{name:'Other',status:'TESTED',file_status:'found',passed:['dc_current']}]};
  assert.equal(matchesSimulation(generic,'present','dc','specific'),false);
  assert.equal(matchesSimulation(generic,'present','','specific'),true);
  assert.equal(matchesSimulation(generic,'present','dc','unknown'),true);
});

test('internal passive models require an explicit value',()=>{
  const incomplete={...component,kind:'generic',intrinsic:true,values:{}};
  assert.equal(matchesSimulation(incomplete,'present'),false);
  const complete={...incomplete,values:{resistance:1000}};
  assert.equal(matchesSimulation(complete,'present','','generic'),true);
  assert.equal(matchesSimulation(complete,'present','dc','generic'),false);
  const native={...component,intrinsic:true,simulation_fields:{'Sim.Device':'R','Sim.Params':'r=1k'}};
  assert.equal(matchesSimulation(native,'present','','generic'),true);
  assert.equal(matchesSimulation({...native,simulation_fields:{'Sim.Device':'R','Sim.Params':'r=unknown'}},'present'),false);
});

test('unresolved or excluded models never become present',()=>{
  for(const state of ['missing','changed','unknown']){
    const c={...component,models:[{name:'Test',status:'TESTED',file_status:state,passed:['switching'],check:{ok:true}}]};
    assert.equal(matchesSimulation(c,'present'),false);
    assert.equal(matchesSimulation(c,'','calculable'),false);
    assert.equal(matchesSimulation(c,'','switching'),false);
  }
  const c={...component,models:[{status:'INCOMPATIBLE',file_status:'found',passed:['switching']}]};
  assert.equal(matchesSimulation(c,'present'),false);
  assert.equal(matchesSimulation(c,'unknown'),true);
});

test('Ferrite and filter profiles have dedicated fields',()=>{assert.deepEqual(profile('passive/ferrite').map(x=>x[0]),['impedance','impedance_frequency','rated_current','dc_resistance']);assert.ok(profile('passive/filter/emc_filter').some(x=>x[0]==='insertion_loss'));assert.deepEqual(profile('passive/filter'),[]);});

test('specific profiles override family and mixed parents',()=>{
  assert.ok(profile('integrated/power_ic/linear_regulator').some(f=>f[0]==='dropout_voltage'));
  assert.ok(profile('integrated/converters/adc').some(f=>f[0]==='resolution_bits'));
  assert.equal(profile('sensors/temperature').find(f=>f[0]==='measurement_min')[2],'°C');
  assert.equal(profile('sensors/pressure').find(f=>f[0]==='measurement_min')[2],'Pa');
  assert.ok(profile('mechanical').some(f=>f[0]==='length'));assert.ok(!profile('mechanical').some(f=>f[0]==='rated_voltage'));
  assert.deepEqual(profile('schematic/test_points'),[]);
  assert.deepEqual(profile('unassigned/Unknown'),[]);
  assert.ok(!profile('integrated').some(f=>f[0]==='bandwidth_description'));
});

test('revision two distinguishes optional requirements and exact units',()=>{
 assert.ok(availableProfile('opto/led').some(f=>f[0]==='operating_temp_min'));
 assert.ok(profile('opto/led').some(f=>f[0]==='led_color'));
 assert.ok(!profile('opto/led').some(f=>f[0]==='qualifications'));
 assert.ok(profile('modules/acdc').some(f=>f[0]==='ac_input_voltage_min'));
 assert.ok(profile('modules/dcdc').some(f=>f[0]==='dc_input_voltage_max'));
 assert.ok(profile('opto/optocoupler/transistor').some(f=>f[0]==='vce_max'));
 assert.ok(!profile('opto/optocoupler/triac').some(f=>f[0]==='ctr_min'));
});
test('parameter filters cover ranges, missing values and all text requirements',()=>{
 assert.equal(matchesParameter(12,{direction:'range',value:{min:10,max:15}}),true);
 assert.equal(matchesParameter(18,{direction:'range',value:{min:10,max:15}}),false);
 assert.equal(matchesParameter(null,{direction:'min',value:1}),false);
 assert.equal(matchesParameter(null,{direction:'min',value:1,includeUnknown:true}),true);
 assert.equal(matchesParameter('AEC-Q101; RoHS',{direction:'text',value:['AEC-Q101','RoHS']}),true);
 assert.equal(matchesParameter('AEC-Q100',{direction:'text',value:['AEC-Q101']}),false);
 assert.equal(matchesParameter(-40,{direction:'max',value:-20}),true);
 assert.equal(matchesParameter(85,{direction:'min',value:125}),false);
});
test('filters do not conflate measurements with different test conditions',()=>{
 const limit={direction:'max',value:.05,conditions:{gate_voltage:10}};
 assert.equal(matchesParameter(.04,limit,{conditions_data:{gate_voltage:10}}),true);
 assert.equal(matchesParameter(.04,limit,{conditions_data:{gate_voltage:4.5}}),false);
 assert.equal(matchesParameter(.04,limit),false);
 assert.equal(matchesParameter(.04,{...limit,includeUnknown:true}),true);
});

test('value kind and evidence source filters never treat unknown or typical values as guaranteed limits',()=>{
 const wanted={direction:'max',value:1,kind:'maximum',sourceType:'manufacturer',includeUnknown:true};
 assert.equal(matchesParameter(.8,wanted,{kind:'maximum',sourceType:'manufacturer'}),true);
 assert.equal(matchesParameter(.8,wanted,{kind:'typical',sourceType:'manufacturer'}),false);
 assert.equal(matchesParameter(.8,wanted,{kind:'absolute_maximum',sourceType:'manufacturer'}),false);
 assert.equal(matchesParameter(.8,wanted,{kind:'maximum',sourceType:'description'}),false);
 assert.equal(matchesParameter(null,wanted),false);
 const row={values:{vrrm:100},description_values:{vrrm:100}};
 assert.equal(parameterEvidence(row,'vrrm').sourceType,'description');
 assert.equal(parameterEvidence({...row,manual_data:{values:{vrrm:{source:'PDF',source_details:{candidate_id:'maker-1n914'},kind:'absolute_maximum'}}}},'vrrm').sourceType,'manufacturer');
 assert.equal(parameterEvidence({...row,description_values:{}},'vrrm').sourceType,'catalog');
 assert.equal(parameterEvidence(row,'missing').sourceType,'unknown');
});

test('all resistor subcategories retain resistance tolerance and power columns',()=>{
 for(const leaf of ['standard_resistor','precision','shunt','power_resistor','resistor_network','adjustable/potentiometer','adjustable/trimmer','other'])
  assert.deepEqual(profile('passive/resistor/'+leaf).slice(0,3).map(f=>f[0]),['resistance','tolerance_description','power_description']);
});

test('engineering units display and parse without changing numeric sorting',async()=>{
 const {engineeringInput:parse,engineeringDisplay:show}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const [text,key,value,factor=1] of [['390kR','resistance',390000],['4R7','resistance',4.7],['4m7','resistance',.0047],['1MR','resistance',1e6],['4,7uF','capacitance',4.7e-6],['4µ7','capacitance',4.7e-6],['100n','capacitance',1e-7],['10','capacitance',1e-5,1e6],['10uH','inductance',1e-5],['63mW','power_description',.063]])assert.ok(Math.abs(parse(text,key,factor)-value)<=Math.abs(value)*1e-12,text);
 assert.equal(show(390000,'resistance','en'),'390 kΩ');assert.equal(show(1e-7,'capacitance','en'),'100 nF');assert.equal(show(.063,'power_description','en'),'63 mW');
 assert.ok(Number.isNaN(parse('10V','resistance')));assert.ok(Number.isNaN(parse('oops','capacitance')));
 assert.deepEqual([390000,4.7,.0047,5100,1e6].sort(compareValues),[.0047,4.7,5100,390000,1e6]);
});
