WITH fixes AS (
  SELECT fix
  FROM openscope.load_fixes('/home/user/openscope/assets/airports/efhk.json') AS fix
), rwys AS (
  SELECT rwy
  FROM openscope.load_runways('/home/user/openscope/assets/airports/efhk.json') AS rwy

), calc AS (
  SELECT openscope.rwy_dep_dme(
       (SELECT rwy FROM rwys WHERE (rwy).name = '22R'),
       (SELECT fix FROM fixes WHERE (fix).name = 'HEL'), 2.5) AS fix
)

SELECT openscope.asfixes(fix)
FROM calc;
