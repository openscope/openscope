/* eslint-disable */
// mock data pulled directly from `klas.json` with very few modifications
export const STAR_LIST_MOCK = {
    'GRNPA1': {
        'icao': 'GRNPA1',
        'name': 'Grandpa One',
        'suffix': {'01L': '1A', '01R': '1B', '07L': '2A', '07R': '2B', '19L': '3A', '19R': '3B', '25L': '4A', '25R': '4B'},
        'entryPoints': {
            'BETHL': ['BETHL', ['HOLDM', 'A270']],
            'BCE':   ['BCE'],
            'DVC':   ['DVC', 'BETHL', ['HOLDM', 'A270']],
            'MLF':   ['MLF']
        },
        'body': [['KSINO', 'A170'], ['LUXOR', 'A120|S250'], ['GRNPA', 'A110'], ['DUBLX', 'A90'], ['FRAWG', 'A80|S210'], 'TRROP', 'LEMNZ'],
        'rwy': {
            '01L': ['THREEVE'],
            '01R': [],
            '07L': [],
            '07R': [],
            '19L': [],
            '19R': [],
            '25L': [],
            '25R': []
        },
        "draw": [[]]
    },
    'KEPEC3': {
        'icao': 'KEPEC3',
        'name': 'Kepec Three',
        'entryPoints': {
            'DAG': ['DAG', ['MISEN', 'A240']],
            'TNP': ['TNP', 'JOTNU', ['ZELMA', 'A310-']]
        },
        'body': [['CLARR', 'A130|S250'], 'SKEBR', ['KEPEC', 'A130'], ['IPUMY', 'A110|S230'], ['NIPZO', 'A90'], ['SUNST', 'A80|S210'], ['KIMME', 'A80|S210'], ['CHIPZ', 'A80|S170'], 'POKRR', 'PRINO'],
        'rwy': {
            '01L': [],
            '01R': [],
            '07L': [],
            '07R': [],
            '19L': [],
            '19R': [],
            '25L': [],
            '25R': []
        },
        "draw": [[]]
    },
    'SUNST3': {
        'icao': 'SUNST3',
        'name': 'Sunset Three',
        'entryPoints': {
            'BTY':   ['BTY'],
            'TACUS': ['TACUS', 'TUMBE']
        },
        'body': [['MYCAL', 'A240'], ['FUZZY', 'A160|S250'], 'TRAGR', ['IPUMY', 'A110|S230'], ['NIPZO', 'A90'], ['SUNST', 'A80|S210'], ['KIMME', 'A80|S210'], ['CHIPZ', 'A80|S170'], 'POKRR', 'PRINO'],
        'rwy': {
            '01L': [],
            '01R': [],
            '07L': [],
            '07R': [],
            '19L': [],
            '19R': [],
            '25L': [],
            '25R': []
        },
        "draw": [[]]
    },
    'TYSSN4': {
        'icao': 'TYSSN4',
        'name': 'Tyson Three',
        'entryPoints': {
            'DRK':   ['DRK', ['IGM', 'A240'], ['ZATES', 'A190']],
            'IGM':   [['IGM', 'A240'], ['ZATES', 'A190']],
            'PGS':   ['PGS', ['CEJAY', 'A190']],
            'LRAIN': ['LRAIN', ['CORKR', 'A200+'], ['ONRUE', 'A340-'], ['CEJAY', 'A190']]
        },
        'body': [['KADDY', 'A120|S250'], 'TYSSN', ['SUZSI', 'A100|S210'], ['PRINO', 'A80']],
        'rwy': {
            '01L': [],
            '01R': [],
            '07L': [],
            '07R': [],
            '19L': [],
            '19R': [],
            '25L': [],
            '25R': []
        },
        "draw": [[]]
    }
};

export const STAR_WITHOUT_RWY = {
    'icao': 'GRNPA1',
    'name': 'Grandpa One',
    'entryPoints': {
        'BETHL': ['BETHL', ['HOLDM', 'A270']],
        'BCE':   ['BCE'],
        'DVC':   ['DVC', 'BETHL', ['HOLDM', 'A270']],
        'MLF':   ['MLF']
    },
    'body': [['KSINO', 'A170'], ['LUXOR', 'A120|S250'], ['GRNPA', 'A110'], ['DUBLX', 'A90'], ['FRAWG', 'A80|S210'], 'TRROP', 'LEMNZ'],
    'draw': [[]]
};

export const STAR_WITH_SUFFIX = {
    'icao': 'GRNPA1',
    'name': 'Grandpa One',
    'suffix': {'01L': '1A', '01R': '1B', '07L': '2A', '07R': '2B', '19L': '3A', '19R': '3B', '25L': '4A', '25R': '4B'},
    'entryPoints': {
        'BETHL': ['BETHL', ['HOLDM', 'A270']],
        'BCE':   ['BCE'],
        'DVC':   ['DVC', 'BETHL', ['HOLDM', 'A270']],
        'MLF':   ['MLF']
    },
    'body': [['KSINO', 'A170'], ['LUXOR', 'A120|S250'], ['GRNPA', 'A110'], ['DUBLX', 'A90'], ['FRAWG', 'A80|S210'], 'TRROP', 'LEMNZ'],
    'rwy': {
        '01L': [],
        '01R': [],
        '07L': [],
        '07R': [],
        '19L': [],
        '19R': [],
        '25L': [],
        '25R': []
    },
    'draw': [[]]
};

export const STAR_WITH_ONLY_VECTORS = {
    'icao': 'GRNPA1',
    'name': 'Grandpa One',
    'entryPoints': {
        'BETHL': ['BETHL'],
        'BCE':   ['BCE'],
        'DVC':   ['DVC'],
        'MLF':   ['MLF']
    },
    'body': ['#130'],
    'draw': [[]]
};

export const SID_LIST_MOCK = {
    'BOACH6': {
        'icao': 'BOACH6',
        'name': 'Boach Six',
        'rwy': {
            '01L': [['BESSY', 'S230'], ['WITLA', 'A100'], 'JEBBB'],
            '01R': [['BESSY', 'S230'], ['WITLA', 'A100'], 'JEBBB'],
            '07L': ['WASTE', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
            '07R': ['JESJI', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
            '19L': ['FIXIX', ['ROPPR', 'A70'], 'RODDD'],
            '19R': ['JAKER', ['ROPPR', 'A70'], 'RODDD'],
            '25L': ['PIRMD', ['ROPPR', 'A70'], 'RODDD'],
            '25R': ['RBELL', ['ROPPR', 'A70'], 'RODDD']
        },
        'body': [['BOACH', 'A130+']],
        'exitPoints': {
            'HEC': ['HEC'],
            'TNP': ['ZELMA', 'JOTNU', 'TNP']
        },
        'draw': [
            ['BESSY', 'WITLA', 'JEBBB', 'BOACH', 'ZELMA', 'JOTNU', 'TNP*'],
            ['JESJI', 'BAKRR'],
            ['WASTE', 'BAKRR', 'MINEY', 'HITME', 'BOACH'],
            ['RBELL', 'ROPPR'],
            ['PIRMD', 'ROPPR'],
            ['FIXIX', 'ROPPR'],
            ['JAKER', 'ROPPR', 'RODDD', 'BOACH', 'HEC*']
        ]
    },
    'COWBY6': {
        'icao': 'COWBY6',
        'name': 'Cowboy Six',
        'suffix': {'01L': '1A', '01R': '1B', '07L': '2A', '07R': '2B', '19L': '3A', '19R': '3B', '25L': '4A', '25R': '4B'},
        'rwy': {
            '01L': ['_NAPSE068', 'NAPSE', ['RIOOS', 'A130+'], 'COMPS'],
            '01R': ['_NAPSE068', 'NAPSE', ['RIOOS', 'A130+'], 'COMPS'],
            '07L': ['WASTE', ['BAKRR', 'A70'], 'COMPS'],
            '07R': ['JESJI', ['BAKRR', 'A70'], 'COMPS'],
            '19L': ['FIXIX', ['ROPPR', 'A70'], ['CEASR', 'A80+'], ['HITME', 'A110+']],
            '19R': ['JAKER', ['ROPPR', 'A70'], ['CEASR', 'A80+'], ['HITME', 'A110+']],
            '25L': ['PIRMD', ['ROPPR', 'A70'], ['CEASR', 'A80+'], ['HITME', 'A110+']],
            '25R': ['RBELL', ['ROPPR', 'A70'], ['CEASR', 'A80+'], ['HITME', 'A110+']]
        },
        'body': ['COWBY'],
        'exitPoints': {
            'DRK': ['NAVHO', 'DRK'],
            'GUP': [['MOSBI', 'A150+'], 'GUP'],
            'INW': [['CUTRO', 'A150+'], 'INW']
        },
        'draw': [
            ['ROPPR', 'CEASR', 'HITME', 'COWBY', 'MOSBI', 'GUP*'],
            ['BAKRR', 'COMPS', 'COWBY', 'CUTRO', 'INW*'],
            ['_NAPSE068', 'NAPSE', 'RIOOS', 'COMPS'],
            ['COWBY', 'NAVHO', 'DRK*']
        ]
    },
    'SHEAD9': {
        'icao': 'SHEAD9',
        'name': 'Shead Nine',
        'rwy': {
            '01L': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
            '01R': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
            '07L': ['WASTE', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
            '07R': ['JESJI', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
            '19L': ['FIXIX', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
            '19R': ['JAKER', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
            '25L': ['PIRMD', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
            '25R': ['RBELL', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']]
        },
        'body': [['SHEAD', 'A140+']],
        'exitPoints': {
            'KENNO': [['DBIGE', 'A210+'], ['BIKKR', 'A210+'], 'KENNO'],
            'OAL': [['DBIGE', 'A210+'], ['BIKKR', 'A210+'], 'KENNO', 'OAL']
        },
        'draw': [
            ['BESSY', 'MDDOG'],
            ['ROPPR', 'MDDOG', 'TARRK', 'SHEAD'],
            ['HITME', 'SHEAD', 'DBIGE', 'BIKKR', 'KENNO*'],
            ['KENNO', 'OAL*']
        ]
    },
    'TRALR6': {
        'icao': 'TRALR6',
        'name': 'Trailer Six',
        'rwy': {
            '01L': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
            '01R': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
            '07L': ['WASTE', ['BAKRR', 'A70']],
            '07R': ['JESJI', ['BAKRR', 'A70']],
            '19L': ['FIXIX', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '19R': ['JAKER', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '25L': ['PIRMD', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '25R': ['RBELL', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']]
        },
        'body': ['TRALR'],
        'exitPoints': {
            'MLF': ['MLF'],
            'BCE': ['BCE'],
            'DVC': ['NICLE', 'DVC']
        },
        'draw': [
            ['BAKRR', 'TRALR', 'NICLE', 'DVC*'],
            ['CEASR', 'FORGE', 'WILLW', 'TRALR', 'BCE*'],
            ['NAPSE', 'TINNK', 'RIOOS', 'TRALR', 'MLF*']
        ]
    }
};

export const SID_WITHOUT_BODY_MOCK = {
    'icao': 'TRALR6',
    'name': 'Trailer Six',
    'rwy': {
        '01L': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
        '01R': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
        '07L': ['WASTE', ['BAKRR', 'A70']],
        '07R': ['JESJI', ['BAKRR', 'A70']],
        '19L': ['FIXIX', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
        '19R': ['JAKER', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
        '25L': ['PIRMD', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
        '25R': ['RBELL', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']]
    },
    'exitPoints': {
        'MLF': ['MLF'],
        'BCE': ['BCE'],
        'DVC': ['NICLE', 'DVC']
    },
    'draw': [
        ['BAKRR', 'TRALR', 'NICLE', 'DVC*'],
        ['CEASR', 'FORGE', 'WILLW', 'TRALR', 'BCE*'],
        ['NAPSE', 'TINNK', 'RIOOS', 'TRALR', 'MLF*']
    ]
};

export const SID_WITHOUT_EXIT_MOCK = {
    'TRALR6': {
        'icao': 'TRALR6',
        'name': 'Trailer Six',
        'rwy': {
            '01L': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
            '01R': ['_NAPSE068', 'NAPSE', 'TINNK', ['RIOOS', 'A130+']],
            '07L': ['WASTE', ['BAKRR', 'A70']],
            '07R': ['JESJI', ['BAKRR', 'A70']],
            '19L': ['FIXIX', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '19R': ['JAKER', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '25L': ['PIRMD', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']],
            '25R': ['RBELL', ['ROPPR', 'A70'], ['CEASR', 'A80+'], 'FORGE', ['WILLW', 'A140+']]
        },
        'body': ['TRALR'],
        'draw': [
            ['BAKRR', 'TRALR', 'NICLE', 'DVC*'],
            ['CEASR', 'FORGE', 'WILLW', 'TRALR', 'BCE*'],
            ['NAPSE', 'TINNK', 'RIOOS', 'TRALR', 'MLF*']
        ]
    }
};

export const ROUTE_SEGMENTS_MOCK = {
    '01L': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
    '01R': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
    '07L': ['WASTE', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
    '07R': ['JESJI', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
    '19L': ['FIXIX', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
    '19R': ['JAKER', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
    '25L': ['PIRMD', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
    '25R': ['RBELL', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']]
};
