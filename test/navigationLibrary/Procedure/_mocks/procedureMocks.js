/* eslint-disable quotes, quote-props */
export const SID_MOCK = {
    "BOACH6": {
        "icao": "BOACH6",
        "name": "Boach Six",
        "rwy": {
            "KLAS01L": [["BESSY", "S230"], ["WITLA", "A100"], "JEBBB"],
            "KLAS01R": [["BESSY", "S230"], ["WITLA", "A100"], "JEBBB"],
            "KLAS07L": ["WASTE", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "KLAS07R": ["JESJI", ["BAKRR", "A70"], ["MINEY", "A80+"], "HITME"],
            "KLAS19L": ["FIXIX", ["ROPPR", "A70"], "RODDD"],
            "KLAS19R": ["JAKER", ["ROPPR", "A70"], "RODDD"],
            "KLAS25L": ["PIRMD", ["ROPPR", "A70"], "RODDD"],
            "KLAS25R": ["RBELL", ["ROPPR", "A70"], "RODDD"]
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
    }
};

export const STAR_MOCK = {
    "KEPEC1": {
        "icao": "KEPEC1",
        "name": "Kepec One",
        "entryPoints": {
            "DAG": ["DAG", ["MISEN", "A240"]],
            "TNP": ["TNP", "JOTNU", ["ZELMA", "A310-"]]
        },
        "body": [["CLARR", "A130|S250"], "SKEBR", ["KEPEC", "A130"], ["IPUMY", "A110|S230"]],
        "rwy": {
            "KLAS01L": [["NIPZO", "A90"]],
            "KLAS01R": [["SUNST", "A80|S210"]],
            "KLAS07L": [["KIMME", "A80|S210"]],
            "KLAS07R": [["CHIPZ", "A80|S170"]],
            "KLAS19L": ['POKRR'],
            "KLAS19R": [],
            "KLAS25L": ['RBELL'],
            "KLAS25R": ['PRINO']
        },
        "draw": [
            ["DAG", "MISEN", "CLARR"],
            ["TNP", "JOTNU", "ZELMA", "CLARR"],
            ["CLARR", "SKEBR", "KEPEC", "IPUMY"],
            ["IPUMY", "NIPZO"],
            ["IPUMY", "SUNST"],
            ["IPUMY", "KIMME"],
            ["IPUMY", "CHIPZ"],
            ["IPUMY", 'POKRR'],
            ["IPUMY", "RBELL"],
            ["IPUMY", "PRINO"]
        ]
    }
};
