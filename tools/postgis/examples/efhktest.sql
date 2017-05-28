WITH fixes AS (
  SELECT fix
  FROM openscope.load_fixes('/home/user/openscope/tools/examples/efhk.json') AS fix
), rwys AS (
  SELECT rwy
  FROM openscope.load_runways('/home/user/openscope/tools/examples/efhk.json') AS rwy

), calc AS (
  SELECT openscope.rwy_dep_dme(
       (SELECT rwy from rwys where (rwy).name = '22R'),
       (select fix from fixes where (fix).name = 'HEL'), 2.5) AS fix
)
    
SELECT openscope.asfixes(fix)
FROM calc;
