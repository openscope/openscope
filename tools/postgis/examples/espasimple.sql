-- Bearings are MAG, get the correction
UPDATE openscope.config
  SET north_correction =
    (openscope.load_airport('/home/user/openscope/assets/airports/espa.json')->>'magnetic_north')::numeric;

-- Read fixes & runway data
WITH fixes AS (
  SELECT fix
  FROM openscope.load_fixes('/home/user/openscope/assets/airports/espa.json') AS fix
), rwys AS (
  SELECT rwy
  FROM openscope.load_runways('/home/user/openscope/assets/airports/espa.json') AS rwy

), calc AS (
  SELECT openscope.dme_arc(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'),
       9.0, 118, 350, -4, true) AS fix
)

-- Output fixes, short in a sub-query as ORDER BY is incompatible with UNION
SELECT *
FROM (
  SELECT DISTINCT ON ((fix).name) openscope.asfixes(fix)
  FROM calc
  ORDER BY (fix).name
) AS sub

UNION ALL

SELECT ''

UNION ALL

-- While at it, also output the arc routes
SELECT openscope.arc_asroute(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'),
       9.0, 118, 350, -4)
;
