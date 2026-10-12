"""Limited diode direction test, driven through independently identified symbol pins."""

import math
import re
import subprocess
from pathlib import Path

from kicad_parts_manager.validation.runner import find_ngspice

SUITE = "diode-direction-1.0"
CONDITIONS = {
    "temperature": 25,
    "voltage": 1,
    "resistance": 1000,
    "minimum_forward_current": 1e-6,
    "minimum_rectification_ratio": 10,
}


def validate_roles(model, symbol_info, roles):
    if model["type"] != "D" or model["pins"] != ["A", "K"]:
        raise ValueError(
            "Grundtest unterstützt nur ein einzelnes .MODEL-Diodenmodell, keine Subcircuits oder Diodenarrays."
        )
    numbers = {p["number"] for p in symbol_info or []}
    if (
        len(numbers) != 2
        or not isinstance(roles, dict)
        or set(roles) != {"A", "K"}
        or any(not isinstance(n, str) or n not in numbers for n in roles.values())
        or len(set(roles.values())) != 2
    ):
        raise ValueError(
            "Anode und Kathode des zweipoligen Symbols getrennt anhand des Symbols oder Datenblatts auswählen."
        )
    named = {"A": "A", "ANODE": "A", "K": "K", "CATHODE": "K", "KATHODE": "K"}
    from kicad_parts_manager.model_library import symbol_pin_role
    for pin in symbol_info:
        role = symbol_pin_role(pin,named)
        if role and roles[role] != pin["number"]:
            raise ValueError(
                "Die bestätigte Symbolbelegung widerspricht den Anschlussnamen der Bibliothek."
            )
    return dict(roles)


def make_deck(model, text, pins, roles):
    # Reference roles come from the symbol review, never from the model mapping.
    nodes = lambda number: "symbol_" + str(number)
    return "\n".join(
        [
            "kicad-parts-manager diode direction check",
            text,
            "Vstim drive 0 0",
            "Rlimit drive " + nodes(roles["A"]) + " 1k",
            "Vreturn " + nodes(roles["K"]) + " 0 0",
            "Ddut " + " ".join(nodes(n) for n in pins) + " " + model["name"],
            ".temp 25",
            ".control",
            "dc Vstim -1 1 1",
            "let diode_current = -i(Vstim)",
            "print v(drive) diode_current",
            "quit",
            ".endc",
            ".end",
            "",
        ]
    )


def evaluate(returncode, log):
    failed = re.search(
        r"error|fatal|failed|singular matrix|timestep too small|unrecognized parameter|unknown parameter|ignored",
        log,
        re.IGNORECASE,
    )
    calculated = returncode == 0 and not failed and "No. of Data Rows" in log
    number = r"([+-]?\d+(?:\.\d*)?(?:e[+-]?\d+)?)"
    rows = re.findall(
        r"^\s*\d+\s+" + number + r"\s+" + number + r"(?:\s+" + number + r")?\s*$",
        log,
        re.IGNORECASE | re.MULTILINE,
    )
    currents = {}
    for sweep, second, third in rows:
        voltage, current = (second, third) if third else (sweep, second)
        v, i = float(voltage), float(current)
        if math.isfinite(v) and math.isfinite(i):
            currents[round(v, 6)] = i
    calculated = bool(calculated and 1.0 in currents and -1.0 in currents)
    forward = currents.get(1.0)
    reverse = currents.get(-1.0)
    conducting = bool(calculated and forward >= CONDITIONS["minimum_forward_current"])
    blocking = bool(
        calculated
        and abs(reverse) <= forward / CONDITIONS["minimum_rectification_ratio"]
    )
    return {
        "ok": conducting and blocking,
        "calculated": calculated,
        "forward_current": forward,
        "reverse_current": reverse,
        "forward_pass": conducting,
        "reverse_pass": blocking,
        "conditions": CONDITIONS.copy(),
        "suite": SUITE,
        "note": "±1 V über 1 kΩ, 25 °C; Bezug: bestätigte Symbol-Anode/Kathode. Nur Richtungs-Grundfunktion, keine Prüfung von VF, VRRM, trr oder Datenblattgenauigkeit.",
    }


def run_check(model, text, pins, roles, directory):
    binary = find_ngspice()
    if not binary:
        raise ValueError("ngspice wurde nicht gefunden.")
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "diode-direction.cir"
    path.write_text(make_deck(model, text, pins, roles), encoding="utf8")
    try:
        result = subprocess.run(
            [binary, "-b", str(path.resolve())],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
            cwd=directory,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        log = result.stdout + "\n" + result.stderr
        report = evaluate(result.returncode, log)
    except subprocess.TimeoutExpired:
        log = "Zeitlimit 20 Sekunden überschritten."
        report = evaluate(-1, log)
    return report | {"log": log[-12000:]}
