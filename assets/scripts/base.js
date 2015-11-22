// A physical location on the Earth's surface
//
// properties:
//   latitude - Latitude in decimal degrees
//   longitude - Longitude in decimal degrees
//   elevation - Elevation in feet
//   reference_position - Position to use when calculating offsets
//   x - Offset from reference position in km
//   y - Offset from reference position in km
//   position - Array containing the x,y pair
//
var Position=Fiber.extend(function() {
  return {
    // coordinates - Array containing offset pair or latitude/longitude pair
    // reference - Position to use for calculating offsets when lat/long given
    //
    // coordinates may contain an optional elevation as a third
    // element.  It must be suffixed by either 'ft' or 'm' to indicate
    // the units.
    // Latitude and Longitude numbers may be one of the following forms:
    //   Decimal degrees - 'N47.112388112'
    //   Decimal minutes - 'N38d38.109808'
    //   Decimal seconds - 'N58d27m12.138'
    init: function(coordinates, reference, magnetic_north) {
      if(!coordinates) coordinates=[];

      this.latitude = 0;
      this.longitude = 0;
      this.elevation = 0;

      this.reference_position = reference;
      this.magnetic_north = magnetic_north;
      if (!this.magnetic_north) this.magnetic_north = 0;
      this.x = 0;
      this.y = 0;
      this.position = [this.x, this.y];

      this.parse(coordinates);
    },
    parse: function(coordinates) {
      if (! /^[NESW]/.test(coordinates[0])) {
        this.x = coordinates[0];
        this.y = coordinates[1];
        this.position = [this.x, this.y];
        return;
      }

      this.latitude = this.parseCoordinate(coordinates[0]);
      this.longitude = this.parseCoordinate(coordinates[1]);

      if (coordinates[2] != null) {
        this.elevation = parseElevation(coordinates[2]);
      }

      // this function (parse4326) is moved to be able to call it if point is
      // EPSG:4326, numeric decimal, like those from GeoJSON
      if (this.reference_position != null) {
        this.x = this.longitude;
        this.y = this.latitude;
        this.parse4326();
      }
    },
    parse4326: function() {
      // if coordinates were in WGS84 EPSG:4326 (signed decimal lat/lon -12.123,83.456)
      // parse them
      this.longitude = this.x;
      this.latitude = this.y;
      this.x = this.distanceToPoint(this.reference_position.latitude,
                                    this.reference_position.longitude,
                                    this.reference_position.latitude,
                                    this.longitude);
      if (this.reference_position.longitude > this.longitude) {
        this.x *= -1;
      }

      this.y = this.distanceToPoint(this.reference_position.latitude,
                                    this.reference_position.longitude,
                                    this.latitude,
                                    this.reference_position.longitude);
      if (this.reference_position.latitude > this.latitude) {
        this.y *= -1;
      }

      // Adjust to use magnetic north instead of true north
      var t = Math.atan2(this.y, this.x);
      var r = Math.sqrt(this.x*this.x + this.y*this.y);
      t += this.magnetic_north;
      this.x = r * Math.cos(t);
      this.y = r * Math.sin(t);

      this.position = [this.x, this.y];
    },
    distanceTo: function(point) {
      return this.distanceToPoint(this.latitude,
                                  this.longitude,
                                  point.latitude,
                                  point.longitude);
    },
    // The distance in km between two locations
    distanceToPoint: function(lat_a, lng_a, lat_b, lng_b) {
      var d_lat = radians(lat_a - lat_b);
      var d_lng = radians(lng_a - lng_b);

      var a = Math.pow(Math.sin(d_lat/2), 2) +
        (Math.cos(radians(lat_a)) *
         Math.cos(radians(lat_b)) *
         Math.pow(Math.sin(d_lng/2), 2));
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return c * 6371.00;
    },
    parseCoordinate: function(coord) {
      var r = /^([NESW])(\d+(\.\d+)?)([d °](\d+(\.\d+)?))?([m '](\d+(\.\d+)?))?$/;
      var match = r.exec(coord)
      if (match == null) {
        log('Unable to parse coordinate ' + coord);
        return;
      }
      var ret = parseFloat(match[2]);
      if (match[5] != null) {
        ret += parseFloat(match[5])/60;
        if (match[8] != null) {
          ret += parseFloat(match[8])/3600;
        }
      }

      if (/[SW]/.test(match[1])) {
        ret *= -1;
      }
      return ret;
    },
  };
});
