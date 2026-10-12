"""Load/DC and functional pulse tests for the pinned three-part manufacturer pilot."""
import hashlib, math, platform, re, subprocess
from pathlib import Path
from sqlalchemy import select
from kicad_parts_manager.database.models import *
from kicad_parts_manager.importers.pilot import PARTS
from kicad_parts_manager.validation.runner import find_ngspice

SUITE='manufacturer-pilot-1.0'


def profile(model, pins):
    part=next((p for p in PARTS if p['hash']==model.sha256 and p['model']==model.model_name and p['type']==model.model_type),None)
    if not part:raise ValueError('No reviewed pilot topology for this model')
    actual=sorted((p.symbol_pin,p.symbol_pin_name,p.model_pin,p.model_pin_name) for p in pins)
    expected=sorted((num,role,pos,role) for num,role,pos in part['pins'])
    if actual!=expected:raise ValueError('Pilot pin map mismatch')
    return part


def deck(model, part, pulse=False):
    path=str(Path(model.model_file).resolve()).replace('\\','/')
    if any(c in path for c in ('"','\n','\r')):raise ValueError('Unsafe path')
    if not re.fullmatch(r'[A-Za-z0-9_]+',model.model_name):raise ValueError('Unsafe model name')
    if part['family']=='mosfet':
        circuit=f'Vs supply 0 5\nRl supply out 470\nVdrive drive 0 '+('PULSE(0 5 1u 10n 10n 4u 10u)' if pulse else '5')+f'\nX1 out drive 0 {model.model_name}'
    elif part['family']=='bjt':
        circuit=f'Vs supply 0 5\nRl supply out 470\nRb drive base 10k\nVdrive drive 0 '+('PULSE(0 5 1u 10n 10n 4u 10u)' if pulse else '5')+f'\nQ1 out base 0 {model.model_name}'
    else:
        circuit='Vs supply 0 '+('PULSE(-1 1 1u 10n 10n 4u 10u)' if pulse else '1')+f'\nRl supply out 1k\nD1 out 0 {model.model_name}'
    control='tran 2n 10u\nmeas tran on_value FIND v(out) AT=3u\nmeas tran off_value FIND v(out) AT=8u' if pulse else 'op\nlet dc_current = -i(Vs)\nprint dc_current\nprint v(out)'
    return f'Pilot {part["mpn"]}: 25C; functional pulse, not datasheet switching-time qualification\n.temp 25\n.include "{path}"\n{circuit}\n.control\n{control}\nquit\n.endc\n.end\n'


def measurements(text):
    return {name.lower():float(value) for name,value in re.findall(r'(?im)^\s*(dc_current|on_value|off_value)\s*=\s*([-+\d.eE]+)',text)}


def validate_pilot(session, model_id, output, executable="ngspice"):
    model=session.get(SimulationModel,model_id)
    if not model or model.status in {Status.REJECTED,Status.INCOMPATIBLE,Status.DEPRECATED}:raise ValueError('Inactive or unknown model')
    if hashlib.sha256(Path(model.model_file).read_bytes()).hexdigest()!=model.sha256:raise ValueError('Model hash changed')
    part=profile(model,list(session.scalars(select(PinMap).where(PinMap.simulation_model_id==model.id))))
    component=session.get(Component,model.component_id)
    maker=session.get(Manufacturer,component.manufacturer_id) if component else None
    if not component or component.mpn!=part['mpn'] or not maker or maker.name!='Diodes Incorporated':
        raise ValueError('Manufacturer/MPN does not match the pilot model')
    binary=find_ngspice(executable)
    if not binary:raise RuntimeError('ngspice unavailable')
    version=subprocess.run([binary,'--version'],capture_output=True,text=True,timeout=10).stdout.strip()
    run=ValidationRun(simulation_model_id=model.id,ngspice_version=version,platform=platform.platform(),test_suite_version=SUITE,result='FAIL',log_file='',model_sha256=model.sha256)
    session.add(run);session.flush();folder=output/str(run.id);folder.mkdir(parents=True,exist_ok=True);run.log_file=str(folder.resolve())
    all_ok=True
    for pulse in (False,True):
        name='switching' if pulse else 'operating_point';net=folder/(name+'.cir');net.write_text(deck(model,part,pulse),encoding='utf-8')
        try:
            proc=subprocess.run([binary,'-b',str(net.resolve())],capture_output=True,text=True,timeout=30)
            message=proc.stdout+'\n'+proc.stderr;okay=proc.returncode==0 and not re.search(r'(?im)^\s*(error|fatal)|unknown subckt|could not find|timestep too small',message)
        except subprocess.TimeoutExpired:
            message='ngspice timeout';okay=False
        data=measurements(message);limits={'dc_current':(0.00001,0.012)}
        if pulse:
            limits={'on_value':(0.1,0.95),'off_value':(-1.1,-0.8)} if part['family']=='diode' else {'on_value':(-0.05,0.8),'off_value':(4.5,5.1)}
        okay=okay and all(k in data and math.isfinite(data[k]) and low<=data[k]<=high for k,(low,high) in limits.items())
        message+='\nConditions: 25C, '+('5V supply, 470 ohm load; 10ns drive edges; on 3us/off 8us.' if part['family']!='diode' else '+/-1V drive, 1k ohm load; 10ns edges; on 3us/off 8us.')+'\nFunctional pulse test only; no trr, delay, loss or thermal qualification.\nChecks: '+repr(limits)+'\nMeasurements: '+repr(data)
        (folder/(name+'.log')).write_text(message,encoding='utf-8')
        session.add(ValidationResult(validation_run_id=run.id,test_name=name,status='PASS' if okay else 'FAIL',measured_value=data.get('dc_current') if not pulse else data.get('on_value'),expected_min=limits['dc_current'][0] if not pulse else limits['on_value'][0],expected_max=limits['dc_current'][1] if not pulse else limits['on_value'][1],log=message))
        if not pulse:
            session.add(ValidationResult(validation_run_id=run.id,test_name='model_load',status='PASS' if okay else 'FAIL',log=message))
        all_ok=all_ok and okay
    run.result='PASS' if all_ok else 'FAIL';model.status=Status.TESTED if all_ok else Status.UNVERIFIED;model.compatibility=Compatibility.NATIVE_NGSPICE if all_ok else Compatibility.UNKNOWN;model.tested_at=now();session.commit();return run
