export const SID_LIST_MOCK = {
    "BOACH6": {
        "icao": "BOACH6",
        "name": "Boach Six",
        "rwy": {
            "01L": [["BESSY", "S230"], ["WITLA", "A100"], "JEBBB"],
            "01R": [["BESSY", "S230"], ["WITLA", "A100"], "JEBBB"],
            "07L": ["WASTE", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "07R": ["JESJI", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "19L": ["FIXIX", ["ROPPR", "A70"], "RODDD"],
            "19R": ["JAKER", ["ROPPR", "A70"], "RODDD"],
            "25L": ["PIRMD", ["ROPPR", "A70"], "RODDD"],
            "25R": ["RBELL", ["ROPPR", "A70"], "RODDD"]
        },
        "body": [["BOACH", "A130+"]],
        "exitPoints": {
            "HEC": ["HEC"],
            "TNP": ["ZELMA", "JOTNU", "TNP"]
        },
        "draw": [
            ["BESSY", "WITLA", "JEBBB", "BOACH", "ZELMA", "JOTNU", "TNP*"],
            ["JESJI", "BAKRR"],
            ["WASTE", "BAKRR", "MINEY", "HITME", "BOACH"],
            ["RBELL", "ROPPR"],
            ["PIRMD", "ROPPR"],
            ["FIXIX", "ROPPR"],
            ["JAKER", "ROPPR", "RODDD", "BOACH", "HEC*"]
        ]
    },
        "COWBY6": {
        "icao": "COWBY6",
        "name": "Cowboy Six",
        "rwy": {
            "01L": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
            "01R": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
            "07L": ["WASTE", ["BAKRR", "A70"], "COMPS"],
            "07R": ["JESJI", ["BAKRR", "A70"], "COMPS"],
            "19L": ["FIXIX", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "19R": ["JAKER", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "25L": ["PIRMD", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "25R": ["RBELL", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]]
        },
        "body": ["COWBY"],
        "exitPoints": {
            "DRK": ["NAVHO", "DRK"],
            "GUP": [["MOSBI", "A150+"], "GUP"],
            "INW": [["CUTRO", "A150+"], "INW"]
        },
        "draw": [
            ["ROPPR", "CEASR", "HITME", "COWBY", "MOSBI", "GUP*"],
            ["BAKRR", "COMPS", "COWBY", "CUTRO", "INW*"],
            ["_NAPSE068", "NAPSE", "RIOOS", "COMPS"],
            ["COWBY", "NAVHO", "DRK*"]
        ]
    },
    "SHEAD9": {
        "icao": "SHEAD9",
        "name": "Shead Nine",
        "rwy": {
            "01L": [["BESSY", "S230"], ["MDDOG", "A90"], ["TARRK", "A110"]],
            "01R": [["BESSY", "S230"], ["MDDOG", "A90"], ["TARRK", "A110"]],
            "07L": ["WASTE", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "07R": ["JESJI", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "19L": ["FIXIX", ["ROPPR", "A70"], ["MDDOG", "A90"], ["TARRK", "A110"]],
            "19R": ["JAKER", ["ROPPR", "A70"], ["MDDOG", "A90"], ["TARRK", "A110"]],
            "25L": ["PIRMD", ["ROPPR", "A70"], ["MDDOG", "A90"], ["TARRK", "A110"]],
            "25R": ["RBELL", ["ROPPR", "A70"], ["MDDOG", "A90"], ["TARRK", "A110"]]
        },
        "body": [["SHEAD", "A140+"]],
        "exitPoints": {
            "KENNO": [["DBIGE", "A210+"], ["BIKKR", "A210+"], "KENNO"],
            "OAL": [["DBIGE", "A210+"], ["BIKKR", "A210+"], "KENNO", "OAL"]
        },
        "draw": [
            ["BESSY", "MDDOG"],
            ["ROPPR", "MDDOG", "TARRK", "SHEAD"],
            ["HITME", "SHEAD", "DBIGE", "BIKKR", "KENNO*"],
            ["KENNO", "OAL*"]
        ]
    },
    "TRALR6": {
        "icao": "TRALR6",
        "name": "Trailer Six",
        "rwy": {
            "01L": ["_NAPSE068", "NAPSE", "TINNK", ["RIOOS", "A130+"]],
            "01R": ["_NAPSE068", "NAPSE", "TINNK", ["RIOOS", "A130+"]],
            "07L": ["WASTE", ["BAKRR", "A70"]],
            "07R": ["JESJI", ["BAKRR", "A70"]],
            "19L": ["FIXIX", ["ROPPR", "A70"], ["CEASR", "A80+"], "FORGE", ["WILLW", "A140+"]],
            "19R": ["JAKER", ["ROPPR", "A70"], ["CEASR", "A80+"], "FORGE", ["WILLW", "A140+"]],
            "25L": ["PIRMD", ["ROPPR", "A70"], ["CEASR", "A80+"], "FORGE", ["WILLW", "A140+"]],
            "25R": ["RBELL", ["ROPPR", "A70"], ["CEASR", "A80+"], "FORGE", ["WILLW", "A140+"]]
        },
        "body": ["TRALR"],
        "exitPoints": {
            "MLF": ["MLF"],
            "BCE": ["BCE"],
            "DVC": ["NICLE", "DVC"]
        },
        "draw": [
            ["BAKRR", "TRALR", "NICLE", "DVC*"],
            ["CEASR", "FORGE", "WILLW", "TRALR", "BCE*"],
            ["NAPSE", "TINNK", "RIOOS", "TRALR", "MLF*"]
        ]
    }
};
