export default {
  "resistor": [
    [
      "resistance",
      "Widerstand",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "tolerance_description",
      "Toleranzangabe",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "temperature_coefficient",
      "Temperaturkoeffizient",
      "ppm/K",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "working_voltage",
      "Arbeitsspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "capacitor": [
    [
      "capacitance",
      "Kapazität",
      "µF",
      1000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "tolerance_description",
      "Toleranzangabe",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "dielectric",
      "Technologie / Dielektrikum",
      "",
      1,
      {
        "type": "text",
        "options": [
          "C0G/NP0",
          "X7R",
          "X5R",
          "Y5V",
          "Aluminium-Elko",
          "Tantal",
          "Folie",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "esr",
      "ESR",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "ripple_current",
      "Rippelstrom",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "inductor": [
    [
      "inductance",
      "Induktivität",
      "mH",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dcr_description",
      "DCR-Angabe",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "saturation_current",
      "Sättigungsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "self_resonance",
      "Eigenresonanz",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "quality_factor",
      "Güte",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shielding",
      "Abschirmung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "mosfet": [
    [
      "vds_max",
      "|VDS| – Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "id_cont",
      "|ID| – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gatespannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "rds_on",
      "RDS(on)",
      "mΩ",
      1000,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "rds_on_vgs",
      "bei VGS",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "qg",
      "Qg",
      "nC",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channel_type",
      "Kanal",
      "",
      1,
      {
        "type": "text",
        "options": [
          "N",
          "P"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "coss",
      "Coss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_voltage_abs",
      "|VGS| – absolute Grenze",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_min",
      "|VGS(th)| min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_max",
      "|VGS(th)| max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "ciss",
      "Ciss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistung Ptot",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "fet": [
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "bjt": [
    [
      "vce_description",
      "|VCEO| – Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "ic_description",
      "|IC| – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "polarity",
      "Polarität",
      "",
      1,
      {
        "type": "text",
        "options": [
          "NPN",
          "PNP"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "hfe_min",
      "hFE min.",
      "",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gain_description",
      "hFE (Kennwertart beachten)",
      "",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "vce_sat",
      "|VCE(sat)|",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "base_current",
            "label": "Basisstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "transition_frequency",
      "fT",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "hfe_max",
      "hFE max.",
      "",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistung Ptot",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "diode": [
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "tvs": [
    [
      "stand_off_description",
      "Sperrspannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "breakdown_description",
      "Durchbruchangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clamp_description",
      "Klemmspannungsangabe",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "pulse_current",
            "label": "Pulsstrom",
            "unit": "A"
          },
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "directionality",
      "Richtung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Unidirektional",
          "Bidirektional"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "capacitance",
      "Kapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "zener": [
    [
      "zener_voltage",
      "VZ – Nennspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom IZ",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "equal"
      }
    ],
    [
      "initial_tolerance",
      "Zenerspannungstoleranz",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "zener_test_current",
      "Prüfstrom IZ",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "zener_voltage_min",
      "VZ min. bei IZ",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom IZ",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "zener_voltage_max",
      "VZ max. bei IZ",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom IZ",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "dynamic_resistance",
      "Differentieller Widerstand",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom IZ",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Sperrstrom IR",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Sperrspannung VR",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Diodenkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Sperrspannung VR",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Spitzenstrom IZSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "Durchlassstromgrenze IF",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom IZ",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "zener_description",
      "Zenerspannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "equal"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ]
  ],
  "connectors": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "general": [],
  "ferrite": [
    [
      "impedance",
      "Impedanz Z",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "impedance_frequency",
      "Frequenz bei Z",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "emc_filter": [
    [
      "insertion_loss",
      "Einfügedämpfung",
      "dB",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "source_impedance",
            "label": "Quellimpedanz",
            "unit": "Ω"
          },
          {
            "key": "load_impedance",
            "label": "Lastimpedanz",
            "unit": "Ω"
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "loss_frequency",
      "Frequenz bei Dämpfung",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "filter_mode",
      "Filterart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gleichtakt",
          "Gegentakt",
          "Kombiniert"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "rf_filter": [
    [
      "center_frequency",
      "Mitten-/Grenzfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "filter_bandwidth",
      "Bandbreite",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "insertion_loss",
      "Einfügedämpfung",
      "dB",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "source_impedance",
            "label": "Quellimpedanz",
            "unit": "Ω"
          },
          {
            "key": "load_impedance",
            "label": "Lastimpedanz",
            "unit": "Ω"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "loss_frequency",
      "Frequenz bei Dämpfung",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "filter_type",
      "Filterart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Tiefpass",
          "Hochpass",
          "Bandpass",
          "Bandsperre"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "cutoff_frequency",
      "Grenzfrequenz",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "passband_min",
      "Durchlassbereich min.",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "passband_max",
      "Durchlassbereich max.",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "stopband_attenuation",
      "Sperrdämpfung",
      "dB",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "characteristic_impedance",
      "Bezugsimpedanz",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "filter": [],
  "integrated/amplifier/opamp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Versorgung gesamt",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "test_input_voltage",
            "label": "Eingangssprung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "closed_loop_gain",
            "label": "Geschlossene Verstärkung",
            "unit": ""
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Versorgung gesamt",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "common_mode_voltage",
            "label": "Gleichtaktspannung",
            "unit": "V"
          },
          {
            "key": "output_voltage",
            "label": "Ausgangsspannung",
            "unit": "V"
          }
        ],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gbw",
      "GBW",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Versorgung gesamt",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "rail_to_rail",
      "Rail-to-Rail",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Eingang",
          "Ausgang",
          "Ein-/Ausgang",
          "Nein"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "input_bias_current",
      "Biasstrom",
      "nA",
      1000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Versorgung gesamt",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "common_mode_voltage",
            "label": "Gleichtaktspannung",
            "unit": "V"
          },
          {
            "key": "output_voltage",
            "label": "Ausgangsspannung",
            "unit": "V"
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "integrated/amplifier/buffer": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "bandwidth_description",
      "Bandbreitenangabe",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/amplifier/differential": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "bandwidth_description",
      "Bandbreitenangabe",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "cmrr",
      "CMRR",
      "dB",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gain_min",
      "Verstärkung min.",
      "",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "gain_max",
      "Verstärkung max.",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "integrated/amplifier/instrumentation": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "bandwidth_description",
      "Bandbreitenangabe",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "cmrr",
      "CMRR",
      "dB",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gain_min",
      "Verstärkung min.",
      "",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "gain_max",
      "Verstärkung max.",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "integrated/amplifier/audio_amp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_power",
      "Ausgangsleistung",
      "W",
      1,
      {
        "conditions": [
          {
            "key": "load_impedance",
            "label": "Lastimpedanz",
            "unit": "Ω"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "load_impedance",
      "Lastimpedanz",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "amplifier_class",
      "Verstärkerklasse",
      "",
      1,
      {
        "type": "text",
        "options": [
          "A",
          "AB",
          "D",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "thd_n",
      "THD+N",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "integrated/amplifier": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/analog/comparator": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Open-Collector",
          "Open-Drain",
          "Push-Pull"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "hysteresis",
      "Hysterese",
      "mV",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/analog/voltage_reference": [
    [
      "reference_voltage",
      "Referenzspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Kathodenstrom IKA",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "equal"
      }
    ],
    [
      "initial_tolerance",
      "Anfangstoleranz",
      "%",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Kathodenstrom IKA",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "temperature_drift",
      "Temperaturdrift",
      "ppm/K",
      1,
      {
        "conditions": [
          {
            "key": "temperature_low",
            "label": "Temperaturbereich min.",
            "unit": "°C"
          },
          {
            "key": "temperature_high",
            "label": "Temperaturbereich max.",
            "unit": "°C"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "reference_type",
      "Referenzart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Serie",
          "Shunt"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "noise_voltage",
      "Rauschen",
      "µV",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "reference_voltage_min",
      "Referenzspannung min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Kathodenstrom IKA",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "reference_voltage_max",
      "Referenzspannung max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Kathodenstrom IKA",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "shunt_voltage_max",
      "Shuntspannung max. (Betrieb)",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shunt_current_min",
      "Shuntstrom min. (Betrieb)",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shunt_current_max",
      "Shuntstrom max. (Betrieb)",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "regulation_current_required",
      "Benötigter Regelstrom max.",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Kathodenstrom IKA",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/analog/current_reference": [
    [
      "reference_current",
      "Referenzstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "initial_tolerance",
      "Anfangstoleranz",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "temperature_drift",
      "Temperaturdrift",
      "ppm/K",
      1,
      {
        "conditions": [
          {
            "key": "temperature_low",
            "label": "Temperaturbereich min.",
            "unit": "°C"
          },
          {
            "key": "temperature_high",
            "label": "Temperaturbereich max.",
            "unit": "°C"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "compliance_voltage_min",
      "Lastspannungsbereich min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "compliance_voltage_max",
      "Lastspannungsbereich max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "integrated/analog/analog_switch": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "on_resistance",
      "Durchlasswiderstand",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "switch_bandwidth",
      "Signalbandbreite",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "switch_configuration",
      "Schaltungsart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "signal_voltage_min",
      "Signalspannung min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "signal_voltage_max",
      "Signalspannung max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "charge_injection",
      "Ladungsinjektion",
      "pC",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "nA",
      1000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "integrated/analog/digital_pot": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "resistance",
      "Widerstand",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "steps",
      "Stufen",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "wiper_resistance",
      "Wiper-Widerstand",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "nonvolatile",
      "Nichtflüchtig",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/power_ic/linear_regulator": [
    [
      "input_voltage_min",
      "VIN min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "input_voltage_max",
      "VIN max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_mode",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Fest",
          "Einstellbar"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "equal"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "input_output_difference",
            "label": "VIN − VOUT",
            "unit": "V"
          },
          {
            "key": "power_dissipation_max",
            "label": "Verlustleistungsgrenze",
            "unit": "W"
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "dropout_voltage",
      "Dropout bei Laststrom",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "quiescent_current",
      "Ruhestrom",
      "µA",
      1000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "output_voltage_min",
      "VOUT min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "output_voltage_max",
      "VOUT max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Eingangsspannung",
            "unit": "V"
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "output_tolerance",
      "Ausgangstoleranz",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/power_ic/switch_regulator": [
    [
      "input_voltage_min",
      "VIN min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "input_voltage_max",
      "VIN max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_mode",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Fest",
          "Einstellbar"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "topology",
      "Topologie",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Buck",
          "Boost",
          "Buck-Boost",
          "Inverting",
          "Flyback",
          "Forward",
          "SEPIC",
          "Sonstige"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "switch_frequency",
      "Schaltfrequenz",
      "kHz",
      0.001,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "switch_current_limit",
      "Schalterstromgrenze",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "output_voltage_min",
      "VOUT min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_voltage_max",
      "VOUT max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_tolerance",
      "Ausgangstoleranz",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "efficiency",
      "Wirkungsgrad",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/power_ic/charger": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "charge_voltage",
      "Ladeschlussspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "charge_current",
      "Ladestrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "cell_count",
      "Zellenzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "battery_chemistry",
      "Batteriechemie",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Li-Ion",
          "LiFePO4",
          "NiMH",
          "Blei",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/power_ic/supervisor": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "threshold_voltage",
      "Überwachungsschwelle",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "reset_delay",
      "Resetverzögerung",
      "ms",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Open-Drain",
          "Open-Collector",
          "Push-Pull"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "reset_polarity",
      "Reset aktiv",
      "",
      1,
      {
        "type": "text",
        "options": [
          "High",
          "Low"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "watchdog",
      "Watchdog",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/power_ic/protection_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "current_limit",
      "Strombegrenzung",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "protection_functions",
      "Schutzfunktionen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "internal_switch",
      "Leistungsschalter",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Intern",
          "Extern"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "on_resistance",
      "RON",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "integrated/drivers/gate_driver": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "source_peak_current",
      "Source-Spitzenstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "sink_peak_current",
      "Sink-Spitzenstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "driver_type",
      "Treiberart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Low-Side",
          "High-Side",
          "Halbbrücke",
          "Isoliert"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "bus_voltage",
      "Busspannung max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/drivers/motor_driver": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "motor_voltage_min",
      "Motorversorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "motor_voltage_max",
      "Motorversorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom je Kanal",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "motor_type",
      "Motorart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "DC",
          "Schrittmotor",
          "BLDC",
          "Sonstige"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "integrated/drivers/led_driver": [
    [
      "input_voltage_min",
      "VIN min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "input_voltage_max",
      "VIN max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_voltage_min",
      "LED-Kettenspannung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_voltage_max",
      "LED-Kettenspannung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "led_current",
      "LED-Konstantstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "output_current",
      "Ausgangsstrom je Kanal",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "dimming",
      "Dimmung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "PWM",
          "Analog",
          "PWM und Analog",
          "Keine"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/drivers/relay_driver": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom je Kanal",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "integrated/drivers/display_driver": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom je Kanal",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "display_type",
      "Displaytechnik",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "integrated/converters/adc": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "resolution_bits",
      "Auflösung",
      "Bit",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "sample_rate",
      "Abtast-/Aktualisierungsrate",
      "MS/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "input_range_min",
      "Signalbereich min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "input_range_max",
      "Signalbereich max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "inl",
      "INL",
      "LSB",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "converter_architecture",
      "Architektur",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ],
    [
      "enob",
      "ENOB",
      "Bit",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/converters/dac": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "resolution_bits",
      "Auflösung",
      "Bit",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "sample_rate",
      "Abtast-/Aktualisierungsrate",
      "MS/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Spannung",
          "Strom"
        ],
        "conditions": []
      }
    ],
    [
      "signal_output_min",
      "Signalbereich min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "signal_output_max",
      "Signalbereich max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "inl",
      "INL",
      "LSB",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "converter_architecture",
      "Architektur",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ],
    [
      "settling_time",
      "Einschwingzeit",
      "µs",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/interfaces/can_lin": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/interfaces/serial": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/interfaces/usb_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/interfaces/ethernet_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/interfaces/isolation": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/gates": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/flipflop": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/counter": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/multiplexer": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/logic_buffer": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/logic_family": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic/level_translator": [
    [
      "supply_a_min",
      "Versorgung A min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_a_max",
      "Versorgung A max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "supply_b_min",
      "Versorgung B min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_b_max",
      "Versorgung B max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/processors/cpu": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_count",
      "I/O-Zahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "architecture",
      "Architektur",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "flash_bytes",
      "Flash",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "ram_bytes",
      "RAM",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "processor_features",
      "Rechenfunktionen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/processors/mcu": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "flash_bytes",
      "Flash",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "ram_bytes",
      "RAM",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_count",
      "I/O-Zahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "architecture",
      "Architektur / Familie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "peripherals",
      "Peripherie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ],
    [
      "quiescent_current",
      "Low-Power-Strom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "integrated/processors/dsp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_count",
      "I/O-Zahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "architecture",
      "Architektur",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "flash_bytes",
      "Flash",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "ram_bytes",
      "RAM",
      "KiB",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "processor_features",
      "Rechenfunktionen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/memory/eeprom": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "memory_bits",
      "Kapazität",
      "Kibit",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "access_time",
      "Zugriffszeit",
      "ns",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "memory_organization",
      "Organisation",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "endurance_cycles",
      "Schreibzyklen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "retention_years",
      "Datenerhalt",
      "Jahre",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/memory/ram": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "memory_bits",
      "Kapazität",
      "Kibit",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "access_time",
      "Zugriffszeit",
      "ns",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "memory_organization",
      "Organisation",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "endurance_cycles",
      "Schreibzyklen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "retention_years",
      "Datenerhalt",
      "Jahre",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/memory/flash": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "memory_bits",
      "Kapazität",
      "Kibit",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "access_time",
      "Zugriffszeit",
      "ns",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "memory_organization",
      "Organisation",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "endurance_cycles",
      "Schreibzyklen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "retention_years",
      "Datenerhalt",
      "Jahre",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/memory/rom": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "memory_bits",
      "Kapazität",
      "Kibit",
      0.0009765625,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "access_time",
      "Zugriffszeit",
      "ns",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "memory_organization",
      "Organisation",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "endurance_cycles",
      "Schreibzyklen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "retention_years",
      "Datenerhalt",
      "Jahre",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/programmable/fpga": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_elements",
      "Logikelemente",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_count",
      "I/O-Zahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_standards",
      "I/O-Standards",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "logic_capacity_type",
      "Kapazitätseinheit",
      "",
      1,
      {
        "type": "text",
        "options": [
          "LUT",
          "Logikzellen",
          "Makrozellen"
        ],
        "optional": true,
        "conditions": []
      }
    ],
    [
      "speed_grade",
      "Speed-Grade",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/programmable/cpld": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_elements",
      "Logikelemente",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_count",
      "I/O-Zahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "io_standards",
      "I/O-Standards",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "logic_capacity_type",
      "Kapazitätseinheit",
      "",
      1,
      {
        "type": "text",
        "options": [
          "LUT",
          "Logikzellen",
          "Makrozellen"
        ],
        "optional": true,
        "conditions": []
      }
    ],
    [
      "speed_grade",
      "Speed-Grade",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "integrated/timing/rtc": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "quiescent_current",
      "Ruhestrom",
      "µA",
      1000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "clock_accuracy",
      "Taktabweichung",
      "ppm",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "backup_current",
      "Backup-Strom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "integrated_crystal",
      "Quarz",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Intern",
          "Extern"
        ],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "integrated/timing/pll": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "input_frequency_min",
      "Eingangsfrequenz min.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "input_frequency_max",
      "Eingangsfrequenz max.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_frequency_min",
      "Ausgangsfrequenz min.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_frequency_max",
      "Ausgangsfrequenz max.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "quiescent_current",
      "Ruhestrom",
      "µA",
      1000000.0,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "jitter",
      "Jitter",
      "ps",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "integrated/timing/timer": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "clock_frequency",
      "Taktfrequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "quiescent_current",
      "Ruhestrom",
      "µA",
      1000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Versorgung VCC",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "output_state",
            "label": "Ausgangszustand",
            "unit": "",
            "type": "text",
            "options": [
              "Low",
              "High"
            ]
          },
          {
            "key": "load_current",
            "label": "Laststrom",
            "unit": "A"
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "timer_function",
      "Funktion",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Monostabil",
          "Astabil",
          "Universal",
          "Sonstige"
        ],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "integrated/rf_ic/rf_amp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gain_db",
      "Verstärkung",
      "dB",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "noise_figure",
      "Rauschzahl",
      "dB",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "p1db",
      "P1dB",
      "dBm",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "ip3",
      "IP3",
      "dBm",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/rf_ic/transceiver": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "radio_standard",
      "Standard / Band",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "conditions": []
      }
    ],
    [
      "gain_db",
      "Verstärkung",
      "dB",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "transmit_power",
      "Sendeleistung",
      "dBm",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "sensitivity",
      "Empfindlichkeit",
      "dBm",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/video_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/security_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/analog": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/power_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/drivers": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/converters": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ]
  ],
  "integrated/interfaces": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Standard / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/logic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_family",
      "Logikfamilie",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Push-Pull",
          "Open-Drain",
          "Open-Collector",
          "Tri-State"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "integrated/processors": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ]
  ],
  "integrated/memory": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstellen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": true,
        "conditions": []
      }
    ]
  ],
  "integrated/programmable": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/timing": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "integrated/rf_ic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/rf_coax": [
    [
      "characteristic_impedance",
      "Wellenwiderstand",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "GHz",
      1e-09,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/ffc_fpc": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/headers": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/board_board": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/wire_board": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/terminal": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/dsub": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/round": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/ic_socket": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/power_connector": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/card": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/usb": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/network": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "connectors/audio_video": [
    [
      "pins_description",
      "Polzahl",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "pitch_description",
      "Rasterangabe",
      "mm",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "mounting",
      "Montage",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SMD",
          "THT",
          "Kabel",
          "Panel"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "orientation",
      "Orientierung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Gerade",
          "Gewinkelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "connector_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "rows",
      "Reihen",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/transistor/fet/jfet": [
    [
      "vds_max",
      "VDS max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "idss",
      "IDSS",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "vgs_off",
      "VGS(off)",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "channel_type",
      "Kanal",
      "",
      1,
      {
        "type": "text",
        "options": [
          "N",
          "P"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "idss_min",
      "IDSS min.",
      "A",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "idss_max",
      "IDSS max.",
      "A",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "vgs_off_min",
      "VGS(off) min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "vgs_off_max",
      "VGS(off) max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "semiconductor/transistor/igbt": [
    [
      "vces_max",
      "VCES max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "collector_current",
      "Kollektorstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vce_sat",
      "VCE(sat)",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "base_current",
            "label": "Basisstrom",
            "unit": "A"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "gate_voltage",
      "Gate-Ansteuerung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "e_on",
      "Einschaltenergie",
      "mJ",
      1000,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "gate_resistance",
            "label": "Gate-Widerstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "e_off",
      "Ausschaltenergie",
      "mJ",
      1000,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "gate_resistance",
            "label": "Gate-Widerstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "freewheel_diode",
      "Freilaufdiode",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "semiconductor/diode/bridge": [
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vr_rms",
      "VR(RMS)",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "Ausgangsstrom mittel",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "bridge_forward_voltage",
      "Durchlassspannung gesamter Strompfad",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/diode/photodiode": [
    [
      "vr_max",
      "Sperrspannung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "wavelength",
      "Wellenlänge",
      "nm",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "responsivity",
      "Empfindlichkeit",
      "A/W",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dark_current",
      "Dunkelstrom",
      "nA",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "active_area",
      "Aktive Fläche",
      "mm²",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rise_time",
      "Anstiegszeit",
      "ns",
      1000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/diode/laser": [
    [
      "wavelength",
      "Wellenlänge",
      "nm",
      1000000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "optical_power",
      "Optische Leistung",
      "mW",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "forward_current",
      "Betriebsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "threshold_current",
      "Schwellenstrom",
      "mA",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "beam_divergence",
      "Divergenz",
      "°",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/thyristor": [
    [
      "vr_max",
      "Sperrspannung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "on_current",
      "Durchlassstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gate_trigger_current",
      "Gate-Zündstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "thyristor_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SCR",
          "Triac",
          "DIAC",
          "SIDAC"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "holding_current",
      "Haltestrom",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "latching_current",
      "Einraststrom",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/valve": [
    [
      "anode_voltage",
      "Anodenspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "anode_current",
      "Anodenstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "heater_voltage",
      "Heizspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "heater_current",
      "Heizstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "semiconductor/transistor/other": [],
  "passive/transformer": [
    [
      "turns_ratio",
      "Übersetzungsverhältnis",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_power",
      "Nennleistung",
      "VA",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "Hz",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "Hz",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "transformer_type",
      "Anwendung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Netz",
          "Signal",
          "Strommessung",
          "Schaltnetzteil"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "primary_voltage",
      "Primärspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "secondary_voltage",
      "Sekundärspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "protection/fuse": [
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "breaking_capacity",
      "Ausschaltvermögen",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "i_squared_t",
      "I²t",
      "A²s",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "fuse_characteristic",
      "Charakteristik",
      "",
      1,
      {
        "type": "text",
        "options": [
          "FF",
          "F",
          "M",
          "T",
          "TT",
          "Herstellerangabe"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "protection/varistor": [
    [
      "operating_ac_voltage",
      "Betriebsspannung AC",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "operating_dc_voltage",
      "Betriebsspannung DC",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "varistor_voltage",
      "Varistorspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "surge_energy",
      "Pulsenergie",
      "J",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "opto/led": [
    [
      "led_color",
      "Farbe",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Rot",
          "Grün",
          "Blau",
          "Gelb",
          "Orange",
          "Weiß",
          "RGB",
          "IR",
          "UV"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "forward_current",
      "Durchlassstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "luminous_intensity",
      "Lichtstärke",
      "mcd",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "wavelength",
      "Wellenlänge",
      "nm",
      1000000000.0,
      {
        "conditions": [],
        "optional": true,
        "comparison": "equal"
      }
    ],
    [
      "color_temperature",
      "Farbtemperatur",
      "K",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "luminous_flux",
      "Lichtstrom",
      "lm",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "viewing_angle",
      "Abstrahlwinkel",
      "°",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "cri",
      "CRI",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "binning",
      "Binning",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "opto/optocoupler": [
    [
      "opto_output",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Transistor",
          "Logik",
          "Triac",
          "Gate-Treiber",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "forward_current",
      "IF",
      "mA",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "optional": false,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "opto/display": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "display_rows",
      "Zeilen",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "display_columns",
      "Spalten",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "display_technology",
      "Technologie",
      "",
      1,
      {
        "type": "text",
        "options": [
          "LCD",
          "OLED",
          "LED",
          "Sonstige"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "display_color",
      "Farbe",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "pixel_width",
      "Pixel horizontal",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "pixel_height",
      "Pixel vertikal",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "timing_parts/crystals": [
    [
      "frequency",
      "Frequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "frequency_tolerance",
      "Frequenztoleranz",
      "ppm",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "load_capacitance",
      "Lastkapazität",
      "pF",
      1000000000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "esr",
      "ESR",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "drive_level",
      "Drive-Level",
      "µW",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "resonance_mode",
      "Resonanz",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Serie",
          "Parallel"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "timing_parts/oscillators": [
    [
      "frequency",
      "Frequenz",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "frequency_tolerance",
      "Frequenzstabilität",
      "ppm",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_type",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "CMOS",
          "TTL",
          "LVDS",
          "LVPECL",
          "Sinus",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "relays": [
    [
      "coil_voltage",
      "Spulenspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal",
        "optional": true
      }
    ],
    [
      "coil_power",
      "Spulenleistung",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "contact_current",
      "Kontaktstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_voltage",
      "Kontaktspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_configuration",
      "Kontaktfunktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ohmsch",
          "Induktiv",
          "Kapazitiv",
          "Motor",
          "Lampe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "switches": [
    [
      "contact_current",
      "Kontaktstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_voltage",
      "Kontaktspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_configuration",
      "Kontaktfunktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ohmsch",
          "Induktiv",
          "Kapazitiv",
          "Motor",
          "Lampe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "modules/acdc": [
    [
      "ac_input_voltage_min",
      "AC-Eingang (RMS) min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "ac_input_voltage_max",
      "AC-Eingang (RMS) max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_power",
      "Ausgangsleistung",
      "W",
      1,
      {
        "conditions": [
          {
            "key": "load_impedance",
            "label": "Lastimpedanz",
            "unit": "Ω"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "isolated",
      "Galvanisch getrennt",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "output_mode",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Fest",
          "Einstellbar",
          "Ungeregelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_voltage_min",
      "DC-Ausgang min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_voltage_max",
      "DC-Ausgang max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "efficiency",
      "Wirkungsgrad",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "ripple_voltage",
      "Restwelligkeit",
      "mV",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "modules/dcdc": [
    [
      "dc_input_voltage_min",
      "DC-Eingang min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "dc_input_voltage_max",
      "DC-Eingang max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_voltage",
      "Ausgangsspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_power",
      "Ausgangsleistung",
      "W",
      1,
      {
        "conditions": [
          {
            "key": "load_impedance",
            "label": "Lastimpedanz",
            "unit": "Ω"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "isolated",
      "Galvanisch getrennt",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "output_mode",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Fest",
          "Einstellbar",
          "Ungeregelt"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "output_voltage_min",
      "DC-Ausgang min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_voltage_max",
      "DC-Ausgang max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "efficiency",
      "Wirkungsgrad",
      "%",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "ripple_voltage",
      "Restwelligkeit",
      "mV",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "modules/radio": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "radio_standard",
      "Funkstandard",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "antenna_type",
      "Antenne",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "modules/module_other": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "sensors": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/temperature": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "°C",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "°C",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "°C",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/pressure": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "Pa",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "Pa",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "Pa",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/current": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/voltage": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/distance": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "m",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "m",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "m",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/magnetic": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "T",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "T",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "T",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "sensors/humidity": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_min",
      "Messbereich min.",
      "%RH",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "measurement_max",
      "Messbereich max.",
      "%RH",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "accuracy",
      "Messabweichung (Betrag)",
      "%RH",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "measurement_type",
      "Messgröße",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "audio_parts": [
    [
      "impedance",
      "Impedanz",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "equal"
      }
    ],
    [
      "impedance_frequency",
      "Bezugsfrequenz",
      "Hz",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_power",
      "Nennleistung",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "audio_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Mikrofon",
          "Lautsprecher",
          "Buzzer",
          "Sonstige"
        ],
        "optional": false,
        "conditions": []
      }
    ]
  ],
  "mechanical": [
    [
      "mechanical_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "length",
      "Länge",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "width",
      "Breite",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "height",
      "Höhe",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "material",
      "Material",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "schematic": [],
  "radio_parts": [],
  "electromechanical": [
    [
      "device_function",
      "Funktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_speed",
      "Drehzahl",
      "rpm",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rated_torque",
      "Drehmoment",
      "Nm",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "unassigned": [],
  "footprints": [
    [
      "mechanical_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "length",
      "Länge",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "width",
      "Breite",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "height",
      "Höhe",
      "mm",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "material",
      "Material",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "libraries": [],
  "simulation/sources": [],
  "simulation/measurement": [],
  "simulation/generic/function_blocks": [],
  "simulation/generic/opamp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "bandwidth_description",
      "Bandbreitenangabe",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true,
        "optional": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "integrated/analog/opamp": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "slew_rate",
      "Slew Rate",
      "V/µs",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "offset_voltage",
      "Offsetbetrag |VOS|",
      "mV",
      1000,
      {
        "conditions": [],
        "comparison": "max",
        "absolute": true
      }
    ],
    [
      "channels",
      "Kanäle",
      "",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gbw",
      "GBW",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "rail_to_rail",
      "Rail-to-Rail",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Eingang",
          "Ausgang",
          "Ein-/Ausgang",
          "Nein"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "input_bias_current",
      "Biasstrom",
      "nA",
      1000000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "passive/common_mode_choke": [
    [
      "inductance",
      "Gleichtaktinduktivität",
      "µH",
      1000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR je Wicklung",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "leakage_inductance",
      "Streuinduktivität",
      "µH",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "__common": [
    [
      "operating_temp_min",
      "Betriebstemperatur min.",
      "°C",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "operating_temp_max",
      "Betriebstemperatur max.",
      "°C",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "temperature_reference",
      "Temperaturbezug",
      "",
      1,
      {
        "type": "text",
        "options": [
          "TA – Umgebung",
          "TC – Gehäuse",
          "TJ – Sperrschicht",
          "Herstellerangabe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "qualifications",
      "Qualifikationen",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AEC-Q100",
          "AEC-Q101",
          "AEC-Q200"
        ],
        "optional": true,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "qualification_grade",
      "Qualifikationsklasse / Grade",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "approvals",
      "Zulassungen",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": true,
        "multiple": true,
        "conditions": []
      }
    ],
    [
      "environmental",
      "Umweltanforderungen",
      "",
      1,
      {
        "type": "text",
        "options": [
          "RoHS",
          "Halogenfrei"
        ],
        "optional": true,
        "multiple": true,
        "conditions": []
      }
    ]
  ],
  "opto/optocoupler/transistor": [
    [
      "forward_current",
      "IF",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "ctr_min",
      "CTR min.",
      "%",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vce_max",
      "VCEO max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "collector_current",
      "IC",
      "mA",
      1000,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "opto_output",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Transistor",
          "Logik",
          "Triac",
          "Gate-Treiber",
          "Sonstige"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "ctr_max",
      "CTR max.",
      "%",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "vce_sat",
      "VCE(sat)",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "base_current",
            "label": "Basisstrom",
            "unit": "A"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "propagation_delay",
      "Laufzeit",
      "µs",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "load_capacitance",
            "label": "Lastkapazität",
            "unit": "F"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          }
        ],
        "comparison": "max"
      }
    ]
  ],
  "opto/optocoupler/logic": [
    [
      "forward_current",
      "IF",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_supply_min",
      "Ausgangsversorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_supply_max",
      "Ausgangsversorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "data_rate",
      "Datenrate",
      "Mbit/s",
      1e-06,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "logic_output",
      "Logikausgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Open-Collector",
          "Open-Drain",
          "Push-Pull"
        ],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "opto_output",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Transistor",
          "Logik",
          "Triac",
          "Gate-Treiber",
          "Sonstige"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "cmti",
      "CMTI",
      "V/µs",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "opto/optocoupler/triac": [
    [
      "opto_output",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Transistor",
          "Logik",
          "Triac",
          "Gate-Treiber",
          "Sonstige"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "trigger_current",
      "IFT",
      "mA",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "blocking_voltage",
      "Sperrspannung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_current",
      "Ausgangsstrom",
      "mA",
      1000,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "zero_cross",
      "Nulldurchgang",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "opto/optocoupler/gate_driver": [
    [
      "forward_current",
      "IF",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "output_supply_min",
      "Ausgangsversorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "output_supply_max",
      "Ausgangsversorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "source_peak_current",
      "Source-Spitzenstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "sink_peak_current",
      "Sink-Spitzenstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "opto_output",
      "Ausgangsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Transistor",
          "Logik",
          "Triac",
          "Gate-Treiber",
          "Sonstige"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "cmti",
      "CMTI",
      "V/µs",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/diode/switching": [
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/diode/rectifier": [
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "max"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/diode/schottky": [
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "audio_parts/microphone": [
    [
      "microphone_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "MEMS",
          "Elektret",
          "Dynamisch",
          "Sonstige"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "microphone_sensitivity",
      "Empfindlichkeit",
      "dBV/Pa",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Ausgang",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "supply_max_description",
      "Versorgung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "audio_parts/speaker": [
    [
      "impedance",
      "Impedanz",
      "Ω",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "impedance_frequency",
      "Bezugsfrequenz",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_power",
      "Belastbarkeit",
      "W",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "spl",
      "Schalldruck",
      "dB",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "audio_parts/buzzer": [
    [
      "buzzer_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Aktiv",
          "Passiv"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "rated_voltage",
      "Nennspannung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency",
      "Frequenz",
      "Hz",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "spl",
      "Schalldruck",
      "dB",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "measurement_distance",
      "Messabstand",
      "m",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "radio_parts/antenna": [
    [
      "frequency_min",
      "Frequenz min.",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "characteristic_impedance",
      "Impedanz",
      "Ω",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "antenna_gain",
      "Antennengewinn",
      "dBi",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "radio_parts/balun": [
    [
      "frequency_min",
      "Frequenz min.",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "impedance_ratio",
      "Impedanzverhältnis",
      "",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "insertion_loss",
      "Einfügedämpfung",
      "dB",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "loss_frequency",
      "Bezugsfrequenz",
      "MHz",
      1e-06,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ]
  ],
  "simulation/generic/diode": [
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "simulation/generic/fet": [
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ]
  ],
  "simulation/generic/bjt": [
    [
      "vce_description",
      "|VCEO| – Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "ic_description",
      "|IC| – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "polarity",
      "Polarität",
      "",
      1,
      {
        "type": "text",
        "options": [
          "NPN",
          "PNP"
        ],
        "multiple": false,
        "conditions": [],
        "optional": true
      }
    ],
    [
      "hfe_min",
      "hFE min.",
      "",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "gain_description",
      "hFE (Kennwertart beachten)",
      "",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "vce_sat",
      "|VCE(sat)|",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "base_current",
            "label": "Basisstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "transition_frequency",
      "fT",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "hfe_max",
      "hFE max.",
      "",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistung Ptot",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "simulation/generic/resistor": [
    [
      "resistance",
      "Widerstand",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "tolerance_description",
      "Toleranzangabe",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "temperature_coefficient",
      "Temperaturkoeffizient",
      "ppm/K",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "working_voltage",
      "Arbeitsspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "simulation/generic/capacitor": [
    [
      "capacitance",
      "Kapazität",
      "µF",
      1000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "tolerance_description",
      "Toleranzangabe",
      "%",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "dielectric",
      "Technologie / Dielektrikum",
      "",
      1,
      {
        "type": "text",
        "options": [
          "C0G/NP0",
          "X7R",
          "X5R",
          "Y5V",
          "Aluminium-Elko",
          "Tantal",
          "Folie",
          "Sonstige"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "esr",
      "ESR",
      "Ω",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "ripple_current",
      "Rippelstrom",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "simulation/generic/inductor": [
    [
      "inductance",
      "Induktivität",
      "mH",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "dcr_description",
      "DCR-Angabe",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "saturation_current",
      "Sättigungsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "self_resonance",
      "Eigenresonanz",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "quality_factor",
      "Güte",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shielding",
      "Abschirmung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "passive/magnetics/transformer": [
    [
      "turns_ratio",
      "Übersetzungsverhältnis",
      "",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_power",
      "Nennleistung",
      "VA",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "frequency_min",
      "Frequenz min.",
      "Hz",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "frequency_max",
      "Frequenz max.",
      "Hz",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "transformer_type",
      "Anwendung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Netz",
          "Signal",
          "Strommessung",
          "Schaltnetzteil"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "primary_voltage",
      "Primärspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "secondary_voltage",
      "Sekundärspannung",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "passive/magnetics/suppression/common_mode_choke": [
    [
      "inductance",
      "Gleichtaktinduktivität",
      "µH",
      1000000.0,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR je Wicklung",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "isolation_voltage",
      "Isolationsprüfspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "leakage_inductance",
      "Streuinduktivität",
      "µH",
      1000000.0,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ]
  ],
  "passive/magnetics/inductor": [
    [
      "inductance",
      "Induktivität",
      "mH",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dcr_description",
      "DCR-Angabe",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "saturation_current",
      "Sättigungsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "self_resonance",
      "Eigenresonanz",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "quality_factor",
      "Güte",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shielding",
      "Abschirmung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "passive/magnetics/suppression/differential_choke": [
    [
      "inductance",
      "Induktivität",
      "mH",
      1000,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dcr_description",
      "DCR-Angabe",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "saturation_current",
      "Sättigungsstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "self_resonance",
      "Eigenresonanz",
      "MHz",
      1e-06,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "quality_factor",
      "Güte",
      "",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "shielding",
      "Abschirmung",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "conditions": []
      }
    ]
  ],
  "passive/magnetics/suppression/ferrite": [
    [
      "impedance",
      "Impedanz Z",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "impedance_frequency",
      "Frequenz bei Z",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "passive/magnetics/suppression/cable_ferrite": [
    [
      "impedance",
      "Impedanz Z",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "impedance_frequency",
      "Frequenz bei Z",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "passive/magnetics/suppression/ferrite_other": [
    [
      "impedance",
      "Impedanz Z",
      "Ω",
      1,
      {
        "conditions": [
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "impedance_frequency",
      "Frequenz bei Z",
      "MHz",
      1e-06,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "rated_current",
      "Nennstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "dc_resistance",
      "DCR",
      "Ω",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "passive/magnetics": [],
  "passive/magnetics/suppression": [],
  "relays/electromechanical_relays": [
    [
      "coil_voltage",
      "Spulenspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "coil_power",
      "Spulenleistung",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "contact_current",
      "Kontaktstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_voltage",
      "Kontaktspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_configuration",
      "Kontaktfunktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ohmsch",
          "Induktiv",
          "Kapazitiv",
          "Motor",
          "Lampe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "relays/reed_relay": [
    [
      "coil_voltage",
      "Spulenspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "coil_power",
      "Spulenleistung",
      "W",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "contact_current",
      "Kontaktstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_voltage",
      "Kontaktspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_configuration",
      "Kontaktfunktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ohmsch",
          "Induktiv",
          "Kapazitiv",
          "Motor",
          "Lampe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "relays/solid_state_relay": [
    [
      "contact_current",
      "Kontaktstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_voltage",
      "Kontaktspannung",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "contact_configuration",
      "Kontaktfunktion",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "load_type",
      "Lastart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ohmsch",
          "Induktiv",
          "Kapazitiv",
          "Motor",
          "Lampe"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "voltage_type",
      "Spannungsart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "AC",
          "DC",
          "AC/DC"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "sensors/rotary_encoder": [
    [
      "supply_min_description",
      "Versorgung min.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "supply_max_description",
      "Versorgung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "interface_standard",
      "Ausgang / Schnittstelle",
      "",
      1,
      {
        "type": "text",
        "options": [],
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "response_time",
      "Reaktionszeit",
      "ms",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "max"
      }
    ]
  ],
  "semiconductor/power_modules/igbt": [
    [
      "vces_max",
      "VCES max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "collector_current",
      "Kollektorstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vce_sat",
      "VCE(sat)",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "base_current",
            "label": "Basisstrom",
            "unit": "A"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "gate_voltage",
      "Gate-Ansteuerung",
      "V",
      1,
      {
        "optional": false,
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "e_on",
      "Einschaltenergie",
      "mJ",
      1000,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "gate_resistance",
            "label": "Gate-Widerstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "e_off",
      "Ausschaltenergie",
      "mJ",
      1000,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "gate_resistance",
            "label": "Gate-Widerstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "freewheel_diode",
      "Freilaufdiode",
      "",
      1,
      {
        "type": "text",
        "options": [
          "Ja",
          "Nein"
        ],
        "optional": true,
        "multiple": false,
        "conditions": []
      }
    ]
  ],
  "semiconductor/power_modules/mosfet": [
    [
      "vds_max",
      "|VDS| – Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "id_cont",
      "|ID| – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gatespannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "rds_on",
      "RDS(on)",
      "mΩ",
      1000,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "rds_on_vgs",
      "bei VGS",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "qg",
      "Qg",
      "nC",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channel_type",
      "Kanal",
      "",
      1,
      {
        "type": "text",
        "options": [
          "N",
          "P"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "coss",
      "Coss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_voltage_abs",
      "|VGS| – absolute Grenze",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_min",
      "|VGS(th)| min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_max",
      "|VGS(th)| max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "ciss",
      "Ciss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistung Ptot",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/power_modules/gan": [
    [
      "vds_max",
      "|VDS| – Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "id_cont",
      "|ID| – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gatespannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "rds_on",
      "RDS(on)",
      "mΩ",
      1000,
      {
        "conditions": [
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "rds_on_vgs",
      "bei VGS",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "equal"
      }
    ],
    [
      "qg",
      "Qg",
      "nC",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "channel_type",
      "Kanal",
      "",
      1,
      {
        "type": "text",
        "options": [
          "N",
          "P"
        ],
        "optional": false,
        "multiple": false,
        "conditions": []
      }
    ],
    [
      "coss",
      "Coss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_voltage_abs",
      "|VGS| – absolute Grenze",
      "V",
      1,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_min",
      "|VGS(th)| min.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "gate_threshold_max",
      "|VGS(th)| max.",
      "V",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "ciss",
      "Ciss",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "gate_voltage",
            "label": "Gate-Spannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistung Ptot",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/power_modules/diode_module": [
    [
      "vr_max",
      "VR – DC-Sperrgrenze",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/power_modules/thyristor_module": [
    [
      "vr_max",
      "Sperrspannung max.",
      "V",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "on_current",
      "Durchlassstrom",
      "A",
      1,
      {
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "gate_trigger_current",
      "Gate-Zündstrom",
      "mA",
      1000,
      {
        "conditions": [],
        "comparison": "max"
      }
    ],
    [
      "thyristor_type",
      "Bauart",
      "",
      1,
      {
        "type": "text",
        "options": [
          "SCR",
          "Triac",
          "DIAC",
          "SIDAC"
        ],
        "optional": false,
        "conditions": []
      }
    ],
    [
      "holding_current",
      "Haltestrom",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "latching_current",
      "Einraststrom",
      "mA",
      1000,
      {
        "optional": true,
        "conditions": [],
        "comparison": "min"
      }
    ],
    [
      "if_cont",
      "IF – Dauerstrom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min",
        "optional": true
      }
    ],
    [
      "vf_typ",
      "VF bei IF",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "trr",
      "trr",
      "ns",
      1000000000.0,
      {
        "conditions": [
          {
            "key": "test_current",
            "label": "Prüfstrom",
            "unit": "A"
          },
          {
            "key": "reverse_current",
            "label": "Rückstrom",
            "unit": "A"
          },
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "load_impedance",
            "label": "Lastwiderstand",
            "unit": "Ω"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max",
        "optional": true
      }
    ],
    [
      "vrrm",
      "VRRM – Spitzensperrspannung",
      "V",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "voltage_description",
      "Spannungsangabe",
      "V",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "current_description",
      "Stromangabe",
      "A",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "power_description",
      "Leistungsangabe",
      "W",
      1,
      {
        "conditions": [],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "if_avg",
      "IF(AV) – mittlerer Strom",
      "A",
      1,
      {
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "optional": true,
        "comparison": "min"
      }
    ],
    [
      "surge_current",
      "Stoßstrom IFSM",
      "A",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "pulse_duration",
            "label": "Pulsdauer",
            "unit": "s"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "leakage_current",
      "Leckstrom",
      "µA",
      1000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "max"
      }
    ],
    [
      "junction_capacitance",
      "Sperrschichtkapazität",
      "pF",
      1000000000000.0,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_voltage",
            "label": "Prüfspannung",
            "unit": "V"
          },
          {
            "key": "test_frequency",
            "label": "Prüffrequenz",
            "unit": "Hz"
          },
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          }
        ],
        "comparison": "min"
      }
    ],
    [
      "power_dissipation",
      "Verlustleistungsgrenze",
      "W",
      1,
      {
        "optional": true,
        "conditions": [
          {
            "key": "test_temperature",
            "label": "Prüftemperatur",
            "unit": "°C"
          },
          {
            "key": "temperature_basis",
            "label": "Temperaturbezug",
            "unit": "",
            "type": "text",
            "options": [
              "TA",
              "TC",
              "TJ",
              "Tsp",
              "TL"
            ]
          },
          {
            "key": "diode_loading",
            "label": "Belastete Dioden",
            "unit": "",
            "type": "text",
            "options": [
              "Eine Diode",
              "Zwei Dioden"
            ]
          }
        ],
        "comparison": "min"
      }
    ]
  ],
  "semiconductor/power_modules": []
};
