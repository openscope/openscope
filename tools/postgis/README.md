# PostGIS Toolset

#### PostgreSQL and PostGIS
You will need at least PostgreSQL 9.4 and PostGIS 2.0 installed to use this toolset.

In order for loading an airport json directly using openscope.load_airport (or other load_* variants), the PostgreSQL user has to be superuser (`ALTER USER <user> WITH SUPERUSER;`).

#### Initialization

First run `psql -f init.sql` to load the toolset functions into the database.

#### Capabilities

- DME ARCs (hidden fixes, routing printput)
- fix-radial-distance waypoints
- 2xfix radials intersection calculation
- Hidden DME waypoints along runway extented centerline

#### Usage

See `examples/` directory.
