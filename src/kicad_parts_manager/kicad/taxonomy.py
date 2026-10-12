"""Functional taxonomy shared by inventory scans and index migrations."""
import re

# Exact existing Würth series, checked against the manufacturer's product catalog.
WURTH_CAPACITORS = {
    **dict.fromkeys(('AI3H AIE8 AIG5 AIG8 AS5H ASLI ASLL ASLU ASNP AT1H ATET ATG5 ATG8 ATLI ATLL ATUL').split(), 'aluminium_electrolytic'),
    **dict.fromkeys('CSGP CSMH CSRF CSSA CSST'.split(), 'ceramic'),
    **dict.fromkeys('FTBE FTBP FTDB FTX2 FTXH FTXX FTY2'.split(), 'film'),
    **dict.fromkeys('PHGP PHLE PHSE PSHP PSLC PSLP PT5H PTG5 PTHR PTHT'.split(), 'aluminium_polymer'),
    **dict.fromkeys('HSAH HSG5 HTAH HTG5'.split(), 'aluminium_polymer/hybrid'),
    **dict.fromkeys('SISC STSC'.split(), 'supercapacitor'),
}
WURTH_SHUNTS = {'KSKE','KWKB','KWKH','PSMB','PSMC'}
WURTH_MAGNETICS = {
    **dict.fromkeys('WE-MAPI WE-PD WE-PD2 WE-TPC WE-LQS WE-LQSH WE-LQFS WE-SPC WE-HCM WE-HCC WE-HCI WE-LHMI WE-XHMI WE-PMCI WE-PMFI WE-MXGI WE-HEPC WE-PMI'.split(), 'inductor/power_inductor'),
    **dict.fromkeys('WE-KI WE-KIHC WE-MK WE-CAIR'.split(), 'inductor/rf_inductor'),
    **dict.fromkeys('WE-DD WE-TDC WE-MCRI'.split(), 'inductor/coupled_inductor'),
    **dict.fromkeys('WE-CMBNiZn WE-CMBNC WE-SL5HC WE-SCC WE-CNSW WE-CNSW-HF'.split(), 'suppression/common_mode_choke'),
    **dict.fromkeys('WE-CBF WE-CBF-HF'.split(), 'suppression/ferrite'),
    'WE-CST':'transformer/current_transformer',
    'WE-LAN':'transformer/signal_transformer',
    'WE-FLEX':'transformer/switching_transformer',
    'WE-PoE':'transformer/switching_transformer',
}

def magnetic_category(library, name, description, current=''):
    """Keep magnetic functions distinct; unknown technology does not imply a power rating."""
    if current.startswith('simulation/') or current.startswith('passive/magnetics/'):
        return current if current.startswith('passive/magnetics/') else None
    if library=='Regulator_Switching':return 'integrated/power_ic/switch_regulator'
    if not (current.startswith(('passive/inductor','passive/transformer','passive/ferrite','passive/common_mode_choke')) or library.lower().startswith(('inductor','transformer','ferrite','dk_fixed-inductors','dk_ferrite-beads')) or re.search(r'^(?:(?:fixed|power|rf|coupled|variable)\s+)?inductors?\b|^(?:transformer|ferrite.bead|clamp.ferrite|snap.on.ferrite|cable.ferrite|klappferrit|common.mode.choke|common.mode.inductor|differential.mode.choke|gleichtaktdrossel|gegentaktdrossel)\b',description,re.I)):
        return None
    words=(library+' '+name+' '+description).lower()
    base='passive/magnetics/'
    # A regulator mentioning its ferrite filter is still a regulator.
    series=re.fullmatch(r'(?:Inductor|Ferrite|Transformer)_Wurth_(.+)',library)
    if series and series[1] in WURTH_MAGNETICS:return base+WURTH_MAGNETICS[series[1]]
    if current.startswith('passive/common_mode_choke') or re.search(r'common.mode.choke|common.mode.inductor|stromkompensiert|gleichtaktdrossel',words):
        return base+'suppression/common_mode_choke'
    if re.search(r'differential.mode.choke|gegentaktdrossel',words):return base+'suppression/differential_choke'
    if current.startswith('passive/ferrite') or library.lower().startswith('ferrite') or re.search(r'^(?:ferrite.bead|klappferrit|cable.ferrite|clamp.ferrite|snap.on.ferrite)',description,re.I):
        leaf='cable_ferrite' if re.search(r'cable|clamp|snap.on|klapp|kabel',words) else 'ferrite' if re.search(r'bead|perle',words) else 'ferrite_other'
        return base+'suppression/'+leaf
    if current.startswith('passive/transformer') or library.lower().startswith('transformer') or re.search(r'^transformer\b',description,re.I):
        leaf='other'
        for kind,pattern in [('current_transformer',r'current.transformer|stromwandler'),('switching_transformer',r'flyback|switch.mode|switching.power|schaltnetz'),('mains_transformer',r'mains|line.frequency|netztransformator'),('signal_transformer',r'signal|pulse|impuls|audio|ethernet|lan.transformer')]:
            if re.search(pattern,words):leaf=kind;break
        return base+'transformer/'+leaf
    if current.startswith('passive/inductor') or library.lower().startswith('inductor') or re.search(r'^(?:coupled\s+|variable\s+|fixed\s+|power\s+|rf\s+)?inductors?\b',description,re.I) or library.lower()=='dk_fixed-inductors':
        leaf='other'
        for kind,pattern in [('coupled_inductor',r'coupled.inductor|gekoppelt'),('power_inductor',r'power.inductor|storage.choke|speicherdrossel'),('rf_inductor',r'\brf\b|high.frequency|hochfrequenz'),('general_inductor',r'general.purpose|fixed.inductor')]:
            if re.search(pattern,words):leaf=kind;break
        return base+'inductor/'+leaf
    return None

def passive_category(library, name, description, current=''):
    """Classify explicit function/technology, never infer it from package or rating alone."""
    if current.startswith('simulation/'):
        return None
    words=(library+' '+name+' '+description).lower()
    match=re.fullmatch(r'Capacitor_Wurth_WCAP-([A-Z0-9]+)',library)
    if match:
        return 'passive/capacitor/'+WURTH_CAPACITORS.get(match[1],'other')
    match=re.fullmatch(r'Resistor_Wurth_WRIS-([A-Z0-9]+)',library)
    if match:
        return 'passive/resistor/'+('shunt' if match[1] in WURTH_SHUNTS else 'standard_resistor' if match[1]=='RSKS' else 'other')
    resistor=library.lower().removeprefix('cern/').startswith('potentiometers ') or current.startswith('passive/resistor') or library.lower().startswith('resistor') or re.search(r'^(?:(?:variable|precision|power|thick film|thin film|current sensing|shunt)\s+)*(?:resistors?\b|potentiometer\b|rheostat\b)',description,re.I) or library.lower() in ('dk_resistor-networks-arrays','dk_rotary-potentiometers-rheostats','dk_trimmer-potentiometers')
    capacitor=current.startswith('passive/capacitor') or library.lower().startswith('capacitor') or re.search(r'^(?:(?:polarized|variable|ceramic|film|aluminium|aluminum|electrolytic|polymer|tantalum)\s+)*capacitors?\b',description,re.I)
    if resistor:
        base='passive/resistor/'
        for leaf,pattern in [('adjustable/trimmer',r'trimmer|trim.pot'),('adjustable/potentiometer',r'potentiometer|rheostat'),('resistor_network',r'resistor.network|resistor.array|\bnetwork\b'),('shunt',r'current.sens|current.measure|\bshunt\b'),('precision',r'precision|präzision'),('power_resistor',r'power.resistor|leistungswiderstand')]:
            if re.search(pattern,words):return base+leaf
        if re.search(r'variable.resistor',words):return base+'adjustable'
        return base+'standard_resistor'
    if capacitor:
        base='passive/capacitor/'
        for leaf,pattern in [('adjustable_capacitor/trimmer',r'trimmer'),('adjustable_capacitor/rotary',r'rotary|drehkondensator'),('adjustable_capacitor',r'variable|adjustable'),('supercapacitor',r'supercap|\bedlc\b|double.layer'),('aluminium_polymer/hybrid',r'hybrid.*polymer|polymer.*hybrid'),('tantalum',r'tantal'),('aluminium_polymer',r'(?:alumin\w*.*polymer|polymer.*alumin\w*)'),('aluminium_electrolytic',r'alumin\w*.*electrolyt|electrolyt.*alumin\w*'),('ceramic',r'ceramic|keramik|\bmlcc\b'),('film',r'\bfilm\b|folie|polypropylene|polyester')]:
            if re.search(pattern,words):return base+leaf
        return base+'other'
    return None


def simulation_category(library, name, description):
    """Only explicit generic symbols and the dedicated SPICE library move here."""
    generic = library in ('Device','Transistor_FET','Transistor_BJT','Transistor_IGBT') and (name.startswith('Q_') or name in ('R','R_Small','R_US','R_Small_US','C','C_Small','C_Polarized','C_Polarized_Small','L','L_Small','D','D_Small','D_Schottky','D_Zener','D_TVS'))
    generic = generic or name.startswith('Opamp_') and library.startswith('Amplifier_')
    if library != 'Simulation_SPICE' and not generic:
        return None
    upper=name.upper()
    if library=='Simulation_SPICE' and (upper.endswith('SOURCE') or upper.startswith(('V','I')) and not upper.startswith(('VOLTMETER','IBIS','ISWITCH'))):
        return 'simulation/sources'
    if upper.startswith(('VOLTMETER','AMMETER','PROBE')):
        return 'simulation/measurement'
    if upper.startswith(('R','C','L')) and library=='Device':
        return 'simulation/generic/'+{'R':'resistor','C':'capacitor','L':'inductor'}[upper[0]]
    if upper.startswith('D'):
        return 'simulation/generic/diode'
    if 'MOS' in upper or 'FET' in upper:
        return 'simulation/generic/fet'
    if 'NPN' in upper or 'PNP' in upper:
        return 'simulation/generic/bjt'
    if 'OPAMP' in upper:
        return 'simulation/generic/opamp'
    return 'simulation/generic/function_blocks'


def functional_category(library, name, description):
    lib = library.lower()
    # CERN source headings retain their namespace in IDs, but classify by function.
    cern = lib.removeprefix('cern/') if lib.startswith('cern/') else None
    if cern in ('fasteners & fixings','heat-sinks','metal screening box'):return 'mechanical'
    if cern == 'batteries' and re.search(r'battery\s+holders?',description,re.I):return 'mechanical'
    if cern == 'dc-dc converters':return 'modules/dcdc'
    if cern == 'pcb modules':return 'modules/module_other'
    if cern == 'cores' and re.search(r'screw|coil.former|clip|clamp',description,re.I):return 'mechanical'
    if cern == 'regulators' and re.search(r'\bmodule\b',description,re.I):return 'modules/module_other'
    if cern:
        library = library.partition('/')[2]
        lib = library.lower()
    words = (library + ' ' + description).lower()
    def has(pattern):
        return re.search(pattern, words) is not None
    # Explicit distributor headings support broad families without guessing subtypes.
    headings={
        'dk_oscillators':'timing_parts/oscillators',
        'dk_interface-drivers-receivers-transceivers':'integrated/interfaces',
        'dk_interface-i-o-expanders':'integrated/interfaces',
        'dk_interface-controllers':'integrated/interfaces',
        'dk_interface-modules':'modules/module_other',
        'dk_memory':'integrated/memory',
        'dk_pmic-current-regulation-management':'integrated/power_ic',
        'dk_pmic-power-management-specialized':'integrated/power_ic',
        'dk_pmic-voltage-regulators-special-purpose':'integrated/power_ic',
        'dk_pmic-ac-dc-converters-offline-switchers':'integrated/power_ic',
        'dk_pmic-full-half-bridge-drivers':'integrated/drivers',
        'dk_pmic-power-distribution-switches-load-drivers':'integrated/power_ic/protection_ic',
        'dk_surge-suppression-ics':'integrated/power_ic/protection_ic',
        'dk_clock-timing-clock-generators-plls-frequency-synthesizers':'integrated/timing',
        'dk_rf-receivers':'integrated/rf_ic',
        'dk_rf-transmitters':'integrated/rf_ic',
        'dk_rf-detectors':'integrated/rf_ic',
        'dk_rf-demodulators':'integrated/rf_ic',
        'dk_rfid-rf-access-monitoring-ics':'integrated/rf_ic',
        'dk_shunts-jumpers':'switches',
        'dk_specialized-ics':'integrated',
        'dk_thyristors-scrs':'semiconductor/thyristor',
        'dk_thyristors-triacs':'semiconductor/thyristor',
        'dk_transistors-jfets':'semiconductor/transistor/fet/jfet',
        'gpu':'integrated/processors',
    }
    if lib in headings:return headings[lib]
    if lib.startswith('laser_'):return 'semiconductor/diode/laser'
    if lib.startswith('icled_'):return 'opto/led'
    if lib.startswith('radio_wurth_'):return 'modules/radio'
    if has(r'common.mode.choke|common.mode.inductor'): return 'passive/common_mode_choke'
    if lib.startswith(('sensor','opticalsensor')) or has(r'pressure.sensor|gas.sensor|magnetic.sensor|temperature.sensor'):
        for leaf,pattern in [('temperature',r'temperature'),('pressure',r'pressure'),('current',r'current'),('voltage',r'voltage'),('distance',r'distance|proximity'),('magnetic',r'magnetic|hall'),('humidity',r'humidity')]:
            if has(pattern):return 'sensors/'+leaf
        return 'sensors'
    for path,pattern in [('protection/fuse',r'\bfuses?\b|thermal.cutoff'),('timing_parts/crystals',r'\bcrystals?\b'),('timing_parts/oscillators',r'\boscillators?\b'),('passive/inductor',r'fixed.inductors'),('passive/resistor',r'resistor.network|rotary.potentiometers|trimmer.potentiometers|rheostats'),('audio_parts',r'microphones|buzzers|sirens'),('opto/display',r'display.modules'),('integrated/analog/digital_pot',r'digital.potentiometers')]:
        if has(pattern):return path
    if lib.startswith('isolator') or has(r'digital.isolat|capacitive.isolat|magnetic.isolat'):return 'integrated/interfaces/isolation'
    if lib == 'optocoupler_wurth_wl-ocpt':
        return 'opto/optocoupler/transistor'
    if lib == 'dk_optoisolators-transistor-photovoltaic-output' and re.search(r'phototransistor|transistor|\btrans\b', description, re.IGNORECASE):
        return 'opto/optocoupler/transistor'
    if lib.startswith('optocoupler') or has(r'optocoupler|optoisolator'):
        leaf='gate_driver' if has(r'gate.driver') else 'triac' if has(r'triac') else 'logic' if has(r'logic.output|digital.output|logic.gate|high.speed.*(?:logic|digital)') else 'transistor' if has(r'phototransistor|transistor.output|darlington') else None
        return 'opto/optocoupler'+('/'+leaf if leaf else '')
    if has(r'microphone'):return 'audio_parts/microphone'
    if has(r'loudspeaker|speaker'):return 'audio_parts/speaker'
    if has(r'buzzer|sirens'):return 'audio_parts/buzzer'
    if has(r'antenna'):return 'radio_parts/antenna'
    if has(r'balun'):return 'radio_parts/balun'
    if lib.startswith('shielding'): return 'mechanical'
    if has(r'led.indication|infrared_|ultraviolet_'): return 'opto/led'
    if has(r'motion.sensors'): return 'sensors'
    if has(r'emi.filter|emc.filter|electromagnetic.interference|feed.through.filter'): return 'passive/filter/emc_filter'
    if has(r'saw.filter|ceramic.filter|rf.filter|band.pass.filter|low.pass.filter|high.pass.filter'): return 'passive/filter/rf_filter'
    if has(r'ferrite.bead'): return 'passive/ferrite'
    if has(r'antenna|balun'): return 'radio_parts'
    if has(r'test.points'): return 'schematic/test_points'
    if has(r'connector|terminal.block|socket|redcube'):
        rules = [
            ('ffc_fpc', r'ffc|fpc'), ('usb', r'usb'),
            ('network', r'rj45|rj11|ethernet|modular.connector'),
            ('dsub', r'd.sub'), ('rf_coax', r'coax|sma\b|bnc\b|rf.connector'),
            ('audio_video', r'hdmi|dvi|audio|jack|rca'),
            ('card', r'card|sd.socket'), ('ic_socket', r'socket.*(?:ic|transistor)|plcc'),
            ('terminal', r'terminal.block|screw.terminal'),
            ('power_connector', r'power|battery|redcube'),
            ('round', r'circular|m8\b|m12\b|din.connector'),
            ('board_board', r'board.to.board|mezzanine'),
            ('wire_board', r'wire.to.board|jst|molex'),
            ('headers', r'header|pinheader|pinsocket|conn_0|generic'),
        ]
        for leaf, pattern in rules:
            if has(pattern): return 'connectors/' + leaf
        return 'connectors/unassigned'
    # Modules are classified before ICs, even when they contain a regulator or radio.
    if has(r'converter_|rf.module|transceiver.modules|shield|magic_|power.module|mcu.module|development.board'):
        leaf = 'acdc' if has('acdc') else 'dcdc' if has(r'dcdc|magic_') else 'radio' if has(r'rf|transceiver') else 'module_other'
        return 'modules/' + leaf
    # Distributor headings mix instrumentation, op amps and buffers. Prefer the
    # explicit component description over this umbrella library name.
    if lib.startswith('dk_linear-amplifiers-instrumentation-op-amps-buffer-amps'):
        for leaf, pattern in [('instrumentation', r'\binstrumentation\b'), ('opamp', r'\bopamp\b|operational.amplifier'), ('buffer', r'\bbuffer\b')]:
            if re.search(pattern, description.lower()):
                return 'integrated/amplifier/' + leaf
        return 'integrated/amplifier'
    rules = [
        ('integrated/amplifier/instrumentation', r'instrumentation'),
        ('integrated/amplifier/buffer', r'amplifier.buffer|buffer.amplifier|unity.gain'),
        ('integrated/amplifier/audio_amp', r'amplifier.audio|linear.amplifiers.audio|audio.*amplifier'),
        ('integrated/amplifier/opamp', r'amplifier.operational|op.amps|operational.amplifier'),
        ('integrated/amplifier/differential', r'amplifier.difference|differential.amplifier'),
        ('integrated/analog/comparator', r'comparator'),
        ('integrated/analog/voltage_reference', r'reference.voltage|voltage.reference'),
        ('integrated/analog/current_reference', r'reference.current|current.reference'),
        ('integrated/analog/analog_switch', r'analog.switch|analog_switch'),
        ('integrated/power_ic/charger', r'battery.management|battery.charger'),
        ('integrated/power_ic/supervisor', r'power.supervisor|supervisor|voltage.detector'),
        ('integrated/power_ic/protection_ic', r'power.protection|hot.swap'),
        ('integrated/power_ic/linear_regulator', r'regulator.linear|regulators.linear|\bldo\b'),
        ('integrated/power_ic/switch_regulator', r'regulator.switch|switching.regulator|regulator.controller|dc.dc.switching.controllers'),
        ('integrated/drivers/gate_driver', r'driver.fet|gate.driver|driver.igbt'),
        ('integrated/drivers/motor_driver', r'trinamic|motor.driver|driver.motor'),
        ('integrated/drivers/led_driver', r'driver.led|led.driver'),
        ('integrated/drivers/display_driver', r'driver.display|display.driver'),
        ('integrated/drivers/relay_driver', r'driver.relay|relay.driver'),
        ('integrated/converters/adc', r'analog.adc|analog.to.digital|\badc\b'),
        ('integrated/converters/dac', r'analog.dac|digital.to.analog|\bdac\b'),
        ('integrated/interfaces/can_lin', r'interface.can|interface.lin\b|\bcan.transceiver|\blin.transceiver'),
        ('integrated/interfaces/serial', r'rs.?232|rs.?485|rs.?422|uart'),
        ('integrated/interfaces/usb_ic', r'interface.usb|usb.controller|usb.transceiver'),
        ('integrated/interfaces/ethernet_ic', r'interface.ethernet|ethernet.controller|ethernet.transceiver'),
        ('integrated/interfaces/isolation', r'isolator|digital.isolat'),
        ('integrated/logic/flipflop', r'flip.flop|latch'),
        ('integrated/logic/counter', r'counter|shift.register'),
        ('integrated/logic/multiplexer', r'multiplexer|demultiplexer'),
        ('integrated/logic/logic_buffer', r'logic.buffers|logic.buffer|line.driver|line.receiver'),
        ('integrated/logic/gates', r'logic.gates|logic.gate|inverter|nand.gate|nor.gate|and.gate|or.gate'),
        ('integrated/logic/level_translator', r'logic.leveltranslator|level.translat'),
        ('integrated/processors/mcu', r'\bmcu|microcontroller'),
        ('integrated/processors/dsp', r'\bdsp'),
        ('integrated/processors/cpu', r'\bcpu|microprocessor'),
        ('integrated/memory/eeprom', r'eeprom'),
        ('integrated/memory/flash', r'flash'),
        ('integrated/memory/ram', r'\bram\b|sram|dram'),
        ('integrated/memory/rom', r'\brom\b|eprom'),
        ('integrated/programmable/fpga', r'fpga'),
        ('integrated/programmable/cpld', r'cpld|logic.programmable'),
        ('integrated/timing/rtc', r'timer.rtc|real.time.clock'),
        ('integrated/timing/pll', r'timer.pll|\bpll\b'),
        ('integrated/timing/timer', r'\btimer'),
        ('integrated/rf_ic/transceiver', r'transceiver.ics'),
        ('integrated/rf_ic/rf_amp', r'rf.amplifier'),
        ('integrated/analog/digital_pot', r'potentiometer.digital'),
    ]
    for path, pattern in rules:
        if has(pattern): return path
    # Broad source families only after explicit functional descriptions.
    if cern == 'regulators':return 'integrated/power_ic'
    if cern in ('logic','standard logic'):return 'integrated'
    for prefix, path in [
        ('amplifier', 'integrated/amplifier/unassigned'),
        ('memory', 'integrated/memory/unassigned'),
        ('interface', 'integrated/interfaces/unassigned'),
        ('driver', 'integrated/drivers/unassigned'),
        ('analog', 'integrated/analog/unassigned'),
        ('power_management', 'integrated/power_ic/unassigned'),
        ('4xxx', 'integrated/logic/logic_family'), ('74', 'integrated/logic/logic_family'),
        ('dk_logic', 'integrated/logic/logic_family'),
        ('sensor', 'sensors'), ('switch', 'switches'), ('relay', 'relays'),
        ('crystal', 'timing_parts/crystals'), ('oscillator', 'timing_parts/oscillators'),
        ('transformer', 'passive/transformer'), ('ferrite', 'passive/ferrite'),
        ('varistor', 'protection/varistor'), ('fuse', 'protection/fuse'),
        ('optocoupler', 'opto/optocoupler'), ('led', 'opto/led'),
        ('display', 'opto/display'), ('assembly', 'mechanical'),
        ('mounting', 'mechanical'), ('mechanical', 'mechanical'),
        ('rf', 'radio_parts'), ('filter', 'passive/filter'),
        ('audio', 'audio_parts'), ('video', 'integrated/video_ic'),
        ('security', 'integrated/security_ic'), ('jumper', 'switches'),
        ('motor', 'electromechanical'), ('valve', 'semiconductor/valve'), ('graphic', 'schematic/graphics'), ('triac', 'semiconductor/thyristor'),
        ('power', 'schematic/power_ports'), ('simulation', 'simulation/generic/function_blocks'),
    ]:
        if lib.startswith(prefix): return path
    if has(r'bipolar.bjt|\bnpn\b|\bpnp\b'):
        return 'semiconductor/transistor/bjt/' + ('npn' if has(r'\bnpn\b') and not has(r'\bpnp\b') else 'pnp' if has(r'\bpnp\b') and not has(r'\bnpn\b') else 'other')
    if has(r'optocoupler|optoisolator'): return 'opto/optocoupler'
    if has(r'light.emitting.diode'): return 'opto/led'
    if has(r'\bsensor\b'): return 'sensors'
    if has(r'\brelay\b'): return 'relays'
    if has(r'\bswitch\b'): return 'switches'
    if lib=='device':
        # Match the described object, not any passive mentioned later in a sentence.
        for leaf,pattern in [('resistor',r'^(?:variable\s+)?(?:resistor|potentiometer|rheostat)\b'),
                             ('capacitor',r'^(?:polarized\s+|variable\s+)?capacitor\b'),
                             ('inductor',r'^(?:coupled\s+|variable\s+)?inductor\b'),
                             ('transformer',r'^transformer\b')]:
            if re.search(pattern,description.lower()):return 'passive/'+leaf
    return None
