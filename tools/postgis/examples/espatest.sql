-- Bearings are MAG, get the correction
UPDATE openscope.config
  SET north_correction = 
    (openscope.load_airport('/home/user/openscope/tools/examples/espa.json')->>'magnetic_north')::numeric;

-- Read fixes & runway data
WITH fixes AS (
  SELECT fix
  FROM openscope.load_fixes('/home/user/openscope/tools/examples/espa.json') AS fix
), rwys AS (
  SELECT rwy
  FROM openscope.load_runways('/home/user/openscope/tools/examples/espa.json') AS rwy

), arcs AS (
  SELECT *
  FROM (VALUES
-- arcs to produce
    (9.0, 118, 350, -4),
    (10.0, 350, 118, 4),
    (10.0, 200, 141, -4),
    (11.0, 310, 352, 4),
    (11.0, 240, 298, 4)
  ) AS data (dist, start, "end", "interval")

), calc AS (
  SELECT openscope.rwy_dep_dme(
       (SELECT rwy FROM rwys WHERE (rwy).name = rwyname),
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'), dist) AS fix
  FROM (VALUES
-- DMEs at RWY extented centerline
    ('14', 7.0), ('14', 2.5)
  ) AS data (rwyname, dist)

UNION ALL
  SELECT openscope.fix_radial_dist(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'),
       radial, dist, true) AS fix
  FROM (VALUES
-- Radial, distance
    (5, 12.0),
    (5, 13.0),
    (149, 8.0),
    (222, 12.0),
    (222, 13.0),
    (292, 9.0),
    (335, 12.0),
    (335, 16.5)
  ) AS data (radial, dist)

UNION ALL
  SELECT openscope.dme_arc(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'),
       dist, start, "end", "interval", true) AS fix
  FROM arcs

UNION ALL
-- Radials intersection
  SELECT openscope.radials_intersection(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'), 335,
       (SELECT fix FROM fixes WHERE (fix).name = 'OL'), 3, true)
)

-- Output fixes, short in a sub-query as ORDER BY is incompatible with UNION
SELECT *
FROM (
  SELECT DISTINCT ON ((fix).name) openscope.asfixes(fix)
  FROM calc
  ORDER BY (fix).name
) AS sub

UNION ALL

-- While at it, also output the arc routes
SELECT openscope.arc_asroute(
       (SELECT fix FROM fixes WHERE (fix).name = 'SLU'),
       dist, start, "end", "interval")
FROM arcs
;
