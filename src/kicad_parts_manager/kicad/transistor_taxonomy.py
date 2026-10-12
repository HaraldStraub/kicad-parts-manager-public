"""Conservative transistor-array and power-module categories from explicit text."""
import re


def transistor_category(library, name, description, current=''):
    if current.startswith('simulation/'):
        return None
    lib = library.lower()
    text = (library + ' ' + description).lower()
    # Incidental transistor mentions do not classify another device as a transistor.
    if lib.startswith(('converter_', 'power_supply')) or re.search(r'\b(?:ac[ /-]?dc|dc[ /-]?dc)\b|for replacing', text):
        return None
    if re.search(r'\b(driver|controller|amplifier|optocoupler|optoisolator|relay|sensor)\b', text) or lib.startswith(('driver_', 'regulator_', 'amplifier_', 'isolator', 'relay_')):
        return None
    if re.search(r'\bmodules?\b|power[_ -]modules?', text):
        if re.search(r'\bigbt\b', text):
            return 'semiconductor/power_modules/igbt'
        if re.search(r'\bmosfets?\b|\bfets?\b', text):
            technology = 'sic' if re.search(r'\bsic\b|silicon carbide', text) else 'gan' if re.search(r'\bgan\b|gallium nitride', text) else None
            if technology == 'gan':
                return 'semiconductor/power_modules/gan'
            return 'semiconductor/power_modules/mosfet' + ('/sic' if technology == 'sic' else '/silicon' if re.search(r'\bsilicon\b', text) else '')
        if re.search(r'\bgan\b|gallium nitride', text):
            return 'semiconductor/power_modules/gan'
        if lib == 'transistor_power_module':
            # Freewheel/rectifier diodes alone do not identify the main switching technology.
            return 'semiconductor/power_modules/other'
        if re.search(r'\bthyristors?\b|\btriacs?\b|\bscr\b', text):
            return 'semiconductor/power_modules/thyristor_module'
        if re.search(r'\brectifiers?\b|\bdiodes?\b', text):
            return 'semiconductor/power_modules/diode_module'
        if re.search(r'\b(?:mixed|hybrid)\s+(?:power|semiconductor)', text):
            return 'semiconductor/power_modules/mixed_module'
        if re.search(r'power[_ -]module|intelligent power module', text):
            return 'semiconductor/power_modules/other'
        return None
    bjt = '/bjt' in current or lib.startswith('transistor_bjt') or bool(re.search(r'\b(?:npn|pnp)\b.*\btransistors?\b|\bbjt\b', description.lower()))
    mosfet = '/mosfet' in current or lib.startswith('transistor_fet') and 'mosfet' in text or bool(re.search(r'\bmosfets?\b', description.lower()))
    if not bjt and not mosfet:
        return None
    array_text = re.sub(r'\bdual[ -]gate\b', '', text)
    array = bool(re.search(r'\b(?:dual|double|pair|array|quad|quadruple|triple|two|three|four)\b', array_text))
    if bjt:
        npn, pnp = bool(re.search(r'\bnpn\b', text)), bool(re.search(r'\bpnp\b', text))
        if not array and not (npn and pnp):
            return None
        leaf = 'complementary' if npn and pnp else 'npn' if npn else 'pnp' if pnp else 'other'
        return 'semiconductor/transistor/bjt/arrays/' + leaf
    coordinated = bool(re.search(r'\bn\s*(?:and|/|&)\s*p\s*[ -]?channel\b|\bp\s*(?:and|/|&)\s*n\s*[ -]?channel\b', text))
    n, p = coordinated or bool(re.search(r'\bn[ -]channel\b', text)), coordinated or bool(re.search(r'\bp[ -]channel\b', text))
    if not array and not (n and p):
        return None
    leaf = 'complementary' if n and p else 'n_channel' if n else 'p_channel' if p else 'other'
    return 'semiconductor/transistor/fet/mosfet/arrays/' + leaf
