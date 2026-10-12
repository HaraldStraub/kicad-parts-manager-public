"""Conservative functional groups for switches, relays and fuses."""
import re

# Exact manufacturer series, verified against we-online.com/en/components/
# products/em/switches/{tact_switches,dip_switches,rotary_switches,rocker_switches}.
# This determines function only; it does not infer electrical ratings.
WURTH_SWITCH_SERIES = {
    **dict.fromkeys(('TASV', 'TASU', 'TATV', 'TATU'), 'pushbutton'),
    **dict.fromkeys(('DITV', 'DISV', 'DITU'), 'dip_switch'),
    'ROTV': 'rotary_switch', 'RSTV': 'toggle_rocker',
}


def selection_category(library, name, description, previous=''):
    lib = library.lower()
    text = (name + ' ' + description).lower()
    has = lambda pattern: re.search(pattern, text, re.I) is not None
    # Encoder output is a sensor function, including versions with a push switch.
    if has(r'rotary.?encoder') and (lib.startswith(('device', 'switch', 'encoder')) or previous == 'switches'):
        return 'sensors/rotary_encoder'
    if lib.startswith(('jumper', 'dk_shunts-jumpers')) or (previous == 'switches' and has(r'\bjumper\b')):
        return 'connectors/jumpers'
    fuse = previous.startswith('protection/fuse') or lib.startswith(('fuse','dk_fuses','dk_ptc-resettable-fuses','dk_thermal-cutoffs')) or (lib == 'device' and has(r'\b(?:polyfuse|fuse)\b'))
    if fuse:
        base = 'protection/fuse/'
        if has(r'thermal.?cut.?off|thermal.?fuse|temperature.?fuse|temperatursicherung') or 'thermal-cutoff' in lib:
            return base + 'thermal_fuse'
        if has(r'polyfuse|resettable|polymeric|\bpptc\b|\bptc\b') or 'ptc-resettable' in lib:
            return base + 'resettable_fuse'
        if has(r'cartridge|glass.?fuse|ceramic.?fuse|blade.?fuse|fast.?acting|slow.?blow|schmelzsicherung'):
            return base + 'melting_fuse'
        return base + 'other'
    relay = previous.startswith('relays') or lib.startswith(('relay', 'dk_relays', 'dk_signal-relays', 'dk_power-relays', 'dk_automotive-relays', 'dk_solid-state-relays'))
    if relay:
        if has(r'solid.?state|\bssr\b') or 'solid-state' in lib:
            return 'relays/solid_state_relay'
        if has(r'\breed\b') or 'reed' in lib:
            return 'relays/reed_relay'
        if has(r'\bmonostable\b|non.?latching|\bmonostabil\b'):
            return 'relays/electromechanical_relays/monostable_relay'
        if has(r'\bbistable\b|\blatching\b|\bbistabil\b'):
            return 'relays/electromechanical_relays/bistable_relay'
        if has(r'\bcoil\b|electromechanical|polarised|polarized|spule'):
            return 'relays/electromechanical_relays/other'
        return 'relays/other'
    switch = previous.startswith('switches') or lib.startswith(('switch', 'dk_switch', 'dk_pushbutton', 'dk_tactile', 'dk_slide', 'dk_toggle', 'dk_rocker', 'dk_rotary', 'dk_dip'))
    if switch:
        series = re.fullmatch(r'switch_wurth_ws-([a-z]+)', lib)
        if series and series[1].upper() in WURTH_SWITCH_SERIES:
            return 'switches/' + WURTH_SWITCH_SERIES[series[1].upper()]
        source = text + ' ' + lib
        for leaf, pattern in [
            ('dip_switch', r'\bdip\b|sw_dip'),
            ('reed_switch', r'\breed\b|magnetic.?switch'),
            ('limit_switch', r'limit.?switch|micro.?switch|snap.?action|end.?schalter'),
            ('pushbutton', r'push.?button|sw_push|tactile|tact.?switch|\btaster\b'),
            ('toggle_rocker', r'toggle|rocker|kippschalter|wippschalter'),
            ('slide_switch', r'slide.?switch|sw_slide|schiebeschalter'),
            ('rotary_switch', r'rotary.?switch|sw_rotary|drehschalter'),
        ]:
            if re.search(pattern, source):
                return 'switches/' + leaf
        return 'switches/other'
    return None
