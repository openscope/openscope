DROP SCHEMA openscope CASCADE;
CREATE SCHEMA openscope;

CREATE TYPE openscope.fix AS (
  name text,
  pos geography(POINT,4326)
);

CREATE TYPE openscope.runway AS (
  name text,
  start geography(POINT,4326),
  "end" geography(POINT,4326)
);

CREATE TABLE openscope.config (
  north_correction numeric default 0.0
);
INSERT INTO openscope.config VALUES (0.0);

CREATE FUNCTION openscope.minangle(numeric,numeric)
  RETURNS NUMERIC
  AS $$
    SELECT (pi() - abs(abs($1 - $2) - pi()))::numeric
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE FUNCTION openscope.minangle(double precision,double precision)
  RETURNS double precision
  AS $$
    SELECT pi() - abs(abs($1 - $2) - pi())
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE FUNCTION openscope.nm2m(numeric)
  RETURNS NUMERIC
  AS $$
    SELECT $1 * 1852
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE FUNCTION openscope.fix_radial_dist_name(openscope.fix,numeric,numeric)
  RETURNS text
  AS $$
    SELECT regexp_replace('_' || ($1).name ||
                          to_char($2, 'fm000') || to_char($3, 'fm000.00'),
                          '\.00$', '')
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- __fix_radial_dist(fix, radial(rad), distance(m), magnetic)
--
-- With magnetic=true applies the correction from openscope.config table
CREATE FUNCTION openscope.__fix_radial_dist(openscope.fix,double precision,numeric,boolean)
  RETURNS geography(POINT,4326)
  AS $$
  DECLARE
    bearing double precision;
  BEGIN
    bearing := $2;
    IF $4 THEN
      bearing := bearing + radians((select north_correction from openscope.config));
    END IF;
    IF bearing >= 2*pi() THEN
      bearing := bearing - 2*pi();
    END IF;
    IF bearing <= -2*pi() THEN
      bearing := bearing + 2*pi();
    END IF;
    RETURN ST_Project(($1).pos, $3, bearing);
  END
  $$
  LANGUAGE plpgsql
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- fix_radial_dist(fix, radial, distance, magnetic)
--
-- With magnetic=true applies the correction from openscope.config table
CREATE FUNCTION openscope.fix_radial_dist(openscope.fix,numeric,numeric,boolean)
  RETURNS openscope.fix
  AS $$
    SELECT openscope.fix_radial_dist_name($1,$2,$3),
           openscope.__fix_radial_dist($1,radians($2),openscope.nm2m($3),$4)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- dme(fix, radial, distance, magnetic)
--
-- With magnetic=true applies the correction from openscope.config table
CREATE FUNCTION openscope.dme(openscope.fix,numeric,numeric,boolean)
  RETURNS openscope.fix
  AS $$
    SELECT openscope.fix_radial_dist($1,$2,$3,$4)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- radials_on_arc(start, end, interval)
--
-- Use negative intervals for counter-clockwise generation
CREATE FUNCTION openscope.radials_on_arc(
    startradial int,
    endradial int,
    delta int)
  RETURNS SETOF int
  AS $$
  DECLARE
    radial int;
  BEGIN
    startradial := startradial + 360;
    endradial := endradial + 360;

    radial := startradial;
    RETURN NEXT radial % 360;

    IF sign(endradial - radial) <> sign(delta) THEN
      endradial := endradial + sign(delta) * 360;
    END IF;

    LOOP
      radial := radial + delta;
      EXIT WHEN sign(endradial - radial) <> sign(endradial - startradial);

      RETURN NEXT radial % 360;
    END LOOP;

    RETURN NEXT (endradial + 360) % 360;
  END;
  $$
  LANGUAGE plpgsql
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- dmearc(origo, distance, radialstart, radialend, interval, magnetic)
--
-- Use negative intervals for counter-clockwise generation
-- With magnetic=true applies the correction from openscope.config table
CREATE FUNCTION openscope.dme_arc(openscope.fix,numeric,int,int,int,boolean)
  RETURNS SETOF openscope.fix
  AS $$
    SELECT openscope.fix_radial_dist($1, radial, $2, $6)
    FROM openscope.radials_on_arc($3, $4, $5) as radial
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- rwy_dme_name(rwy, distance)
CREATE FUNCTION openscope.rwy_dme_name(text,numeric)
  RETURNS text
  AS $$
    SELECT '_RWY' || $1 ||
           regexp_replace(to_char($2, 'fm00.00'), '\.00$', '') || 'DME'
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- final_dme(rwy, distance)
--
-- For DME zero at threshold of the rwy
CREATE FUNCTION openscope.final_dme(openscope.runway,numeric)
  RETURNS openscope.fix
  AS $$
    SELECT openscope.rwy_dme_name(($1).name, $2),
           openscope.__fix_radial_dist(ROW(($1).name,($1).start)::openscope.fix,
                                       ST_Azimuth(($1)."end", ($1).start),
                                       openscope.nm2m($2), false)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE FUNCTION openscope.geog_makeline(geography(POINT,4326),geography(POINT,4326))
  RETURNS geography(LINESTRING,4326)
  AS $$
    SELECT ST_GeogFromText('SRID=4326;LINESTRING(' ||
                           trim (trailing ')' from
                                 substring (ST_AsEWKT($1) from 17)) ||
                           ',' ||
                           trim (trailing ')' from
                                 substring (ST_AsEWKT($2) from 17)) ||
                           ')')
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- rwy_centerline_ext(rwy, bearing, distance)
CREATE FUNCTION openscope.rwy_centerline_ext(openscope.runway,numeric,numeric)
  RETURNS geography(LINESTRING,4326)
  AS $$
    SELECT openscope.geog_makeline(($1)."start",
                                   (openscope.fix_radial_dist(ROW(($1).name,($1)."start"),
                                                                  $2,$3,false)).pos)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- radials_intersection(fix1, radial1, fix2, radial2, magnetic)
--
-- With magnetic=true applies the correction from openscope.config table
CREATE FUNCTION openscope.radials_intersection(openscope.fix,numeric,
                                               openscope.fix,numeric,boolean)
  RETURNS openscope.fix
  AS $$
    WITH maxdist as (
      SELECT (ST_Distance(($1).pos,($3).pos) /
              sin(pi() -
              openscope.minangle(ST_Azimuth(($1).pos,($3).pos), radians($2)) -
              openscope.minangle(ST_Azimuth(($3).pos,($1).pos), radians($4))))::numeric as maxdist
    )
    SELECT '_' || ($1).name || to_char($2, 'fm000') ||
           '_' || ($3).name || to_char($4, 'fm000'),
           ST_Intersection(openscope.geog_makeline(($1).pos,
                               openscope.__fix_radial_dist($1,radians($2),maxdist*1.1,$5)),
                           openscope.geog_makeline(($3).pos,
                               openscope.__fix_radial_dist($3,radians($4),maxdist*1.1,$5)))
    FROM maxdist
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- __rwy_dep_dme(rwy, threshold, bearing(rad), dmefix, distance)
CREATE FUNCTION openscope.__rwy_dep_dme(text,geography(POINT,4326),double precision,
                                      openscope.fix,numeric)
  RETURNS openscope.fix
  AS $$
    WITH alpha as (
      SELECT openscope.minangle(ST_Azimuth($2,($4).pos), $3) as alpha
    ), double_r as (
      SELECT openscope.nm2m($5) / sin(alpha) as double_r
      FROM alpha
    ), beta as (
      SELECT asin(ST_Distance($2,($4).pos) / double_r) as beta
      FROM double_r
    ), gamma as (
      SELECT pi() - (SELECT alpha from alpha) - (SELECT beta from beta) as gamma
    )
    SELECT openscope.rwy_dme_name($1,$5),
           openscope.__fix_radial_dist(ROW($1,$2), $3,
              ((SELECT double_r from double_r) *
                sin((SELECT gamma from gamma)))::numeric,false)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- rwy_dep_dme(rwy, dmefix, distance)
--
-- DME at distance on the rwy extented centerline
CREATE FUNCTION openscope.rwy_dep_dme(openscope.runway,openscope.fix,numeric)
  RETURNS openscope.fix
  AS $$
    SELECT openscope.__rwy_dep_dme(($1).name, ($1).start,
                                   ST_Azimuth(($1).start, ($1)."end"),
                                   $2, $3)
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- Format fix output
CREATE FUNCTION openscope.asfixes(openscope.fix)
  RETURNS text
  AS $$
    SELECT rpad('"' || ($1).name || '"',
                greatest(5, length(($1).name)) + 2) || ': ' ||
           '["' ||
           substring('SNN' from (sign(ST_Y((($1).pos)::geometry)) + 2)::int for 1) ||
           to_char(abs(ST_Y((($1).pos)::geometry)), 'FM90.0999999') ||
           '", "' ||
           substring('WEE' from (sign(ST_X((($1).pos)::geometry)) + 2)::int for 1) ||
           to_char(abs(ST_X((($1).pos)::geometry)), 'FM90.0999999') ||
           '"],'
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;

-- arc_asroute(origo, distance, radialstart, radialend, interval)
--
-- Format arc route output
CREATE FUNCTION openscope.arc_asroute(openscope.fix,numeric,int,int,int)
  RETURNS text
  AS $$
    SELECT string_agg('"' || openscope.fix_radial_dist_name($1,radial,$2) || '"', ', ')
    FROM openscope.radials_on_arc($3, $4, $5) as radial
  $$
  LANGUAGE SQL
  IMMUTABLE RETURNS NULL ON NULL INPUT;


-- load_fixes(file)
--
-- Limitations:
--  - COPY for a file requires postgresql superuser rights
--
CREATE FUNCTION openscope.load_airport(text)
  RETURNS SETOF json
  AS $$
  DECLARE
    fname ALIAS for $1;
  BEGIN
    CREATE TEMPORARY TABLE temp_load_json (values text, line serial) ON COMMIT DROP;
    EXECUTE 'COPY temp_load_json (values) FROM ''' || $1 || ''' ' ||
            'CSV QUOTE E''\x01'' DELIMITER E''\x02''';
    RETURN QUERY
      SELECT replace(values,'\','\\')::json
      FROM (
        SELECT string_agg(values, ' ' ORDER BY line) as values
        FROM temp_load_json
      ) as sub;

    DROP TABLE temp_load_json;
  END;
  $$
  LANGUAGE plpgsql
  RETURNS NULL ON NULL INPUT;

CREATE FUNCTION openscope.parse_coord(text)
  RETURNS numeric
  AS $$
  DECLARE
    guessdms text[];
    ret numeric;
    scale numeric;
    idx int;
  BEGIN
    guessdms := regexp_split_to_array($1, '[dm]');
    guessdms[1] := translate(guessdms[1], 'SWNE', '--');

    scale := 1.0;
    ret := 0;
    idx := 1;

    loop
      ret := ret + guessdms[idx]::numeric / scale;
      idx := idx + 1;
      scale := scale * 60.0;
      exit when idx > array_upper(guessdms, 1);
    end loop;

    RETURN ret;
  END;
  $$
  LANGUAGE plpgsql
  RETURNS NULL ON NULL INPUT;

-- load_fixes(file)
--
-- See limitations from load_airport(file)
CREATE FUNCTION openscope.load_fixes(text)
  RETURNS SETOF openscope.fix
  AS $$
    SELECT ROW((a).key,
               ST_SetSRID(ST_Point(openscope.parse_coord((a).value->>1),
                                   openscope.parse_coord((a).value->>0)),
                          4326)::geography)::openscope.fix
    FROM (
      SELECT json_each(openscope.load_airport($1)->'fixes') as a
    ) as sub
  $$
  LANGUAGE SQL
  RETURNS NULL ON NULL INPUT;

-- load_runways(file)
--
-- See limitations from load_airport(file)
CREATE FUNCTION openscope.load_runways(text)
  RETURNS SETOF openscope.runway
  AS $$
    WITH data as (
      SELECT (a)->'name' as name, (a)->'end' as "end"
      FROM (
        SELECT json_array_elements(openscope.load_airport($1)->'runways') as a
      ) as sub
    ), zeroone as (
      SELECT generate_series(0, 1) as dir
    )
    SELECT ROW((name)->>dir,
               ST_SetSRID(ST_Point(openscope.parse_coord(("end")->dir->>1),
                                   openscope.parse_coord(("end")->dir->>0)),
                          4326)::geography,
               ST_SetSRID(ST_Point(openscope.parse_coord(("end")->(dir#1)->>1),
                                   openscope.parse_coord(("end")->(dir#1)->>0)),
                          4326)::geography
                          )::openscope.runway
    FROM data, zeroone
  $$
  LANGUAGE SQL
  RETURNS NULL ON NULL INPUT;
