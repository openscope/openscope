import { km, nm, km_ft, ft_km, radiansToDegrees, degreesToRadians } from './utilities/unitConverters';
import { time } from './utilities/timeHelpers';
import { distance2d } from './math/distance';
import { vlen, vradial, vsub } from './math/vector';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.clone = function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
};

(function() {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				 timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());

// String repetition copied from http://stackoverflow.com/a/5450113
if (!String.prototype.hasOwnProperty("repeat")) {
  String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
  };
}

// ************************ GENERAL FUNCTIONS ************************
window.ceil = function ceil(n, factor) {
  factor = factor || 1;
  return Math.ceil(n / factor) * factor;
}

window.round = function round(n, factor) {
  factor = factor || 1;
  return Math.round(n / factor) * factor;
}

window.abs = function abs(n) {
  return Math.abs(n);
}

window.sin = function sin(a) {
  return Math.sin(a);
}

window.cos = function cos(a) {
  return Math.cos(a);
}

window.tan = function tan(a) {
  return Math.tan(a);
}

window.fl = function fl(n, number) {
  number = number || 1;
  return Math.floor(n / number) * number;
}

window.randint = function randint(l,h) {
  return(Math.floor(Math.random()*(h-l+1))+l);
}

window.s = function s(i) {
  if(i == 1)
    return "";
  else
    return "s";
}

window.within = function within(n,c,r) {
  if((n > c+r) || (n < c-r))
    return false;
  return true;
}

window.trange = function trange(il,i,ih,ol,oh) {
  return(ol+(oh-ol)*(i-il)/(ih-il));
  // i=(i/(ih-il))-il;       // purpose unknown
  // return (i*(oh-ol))+ol;  // purpose unknown
}

window.clamp = function clamp(l,i,h) {
  if(h == null) {
    if(l > i)
      return l;
    return i;
  }
  var temp;
  if(l > h) {
    temp=h;
    h=l;
    l=temp;
  }
  if(l > i)
    return l;
  if(h < i)
    return h;
  return i;
}

window.crange = function crange(il,i,ih,ol,oh) {
  return clamp(ol,trange(il,i,ih,ol,oh),oh);
}

window.srange = function srange(il,i,ih) {
  //    return Math.cos();
}

window.distEuclid = function distEuclid(gps1, gps2) {
  var R = 6371; // nm
  var lat1 = degreesToRadians(lat1);
  var lat2 = degreesToRadians(lat2);
  var dlat = degreesToRadians(lat2-lat1);
  var dlon = degreesToRadians(lon2-lon1);
  var a = Math.sin(dlat/2) * Math.sin(dlat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dlon/2) * Math.sin(dlon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d; // distance, in kilometers
}

/**
 * Constrains an angle to within 0 --> Math.PI*2
 */
window.fix_angle = function fix_angle(radians) {
  while(radians > Math.PI*2) radians -= Math.PI*2;
  while(radians < 0) radians += Math.PI*2;
  return radians;
}

window.choose = function choose(l) {
  return l[Math.floor(Math.random()*l.length)];
}

window.choose_weight = function choose_weight(l) {
  if(l.length == 0) return;
  if(typeof l[0] != typeof []) return choose(l);
  // l = [[item, weight], [item, weight] ... ];
  var weight  = 0;
  for(var i=0;i<l.length;i++) {
    weight += l[i][1];
  }
  var random = Math.random() * weight;
  weight     = 0;
  for(var i=0;i<l.length;i++) {
    weight += l[i][1];
    if(weight > random) {
      return l[i][0];
    }
  }
  console.log("OHSHIT");
  return(null);
}

window.mod = function mod(a, b) {
  return ((a%b)+b)%b;
};

/**
 * Prepends zeros to front of str/num to make it the desired width
 */
window.lpad = function lpad(n, width) {
  if (n.toString().length >= width) return n.toString();
  var x = "0000000000000" + n;
  return x.substr(x.length-width, width);
}

/**
 * Returns the angle difference between two headings
 * @param {number} a - heading, in radians
 * @param {number} b - heading, in radians
 */
window.angle_offset = function angle_offset(a, b) {
  a = radiansToDegrees(a);
  b = radiansToDegrees(b);
  var invert=false;
  if(b > a) {
    invert=true;
    var temp=a;
    a=b;
    b=temp;
  }
  var offset=mod(a-b, 360);
  if(offset > 180) offset -= 360;
  if(invert) offset *= -1;
  offset = degreesToRadians(offset);
  return offset;
}

/**
 * Returns the bearing from position 'a' to position 'b'
 * @param {array} a - positional array, start point
 * @param {array} a - positional array, end point
 */
window.bearing = function bearing(a, b) {
  return vradial(vsub(b,a));
}

/**
 * Returns an offset array showing how far [fwd/bwd, left/right] 'aircraft' is of 'target'
 * @param {Aircraft} aircraft - the aircraft in question
 * @param {array} target - positional array of the targeted position [x,y]
 * @param {number} headingThruTarget - (optional) The heading the aircraft should
 *                                     be established on when passing the target.
 *                                     Default value is the aircraft's heading.
 * @returns {array} with two elements: retval[0] is the lateral offset, in km
 *                                     retval[1] is the longitudinal offset, in km
 *                                     retval[2] is the hypotenuse (straight-line distance), in km
 */
window.getOffset = function getOffset(aircraft, target, /*optional*/ headingThruTarget) {
  if(headingThruTarget == null) headingThruTarget = aircraft.heading;
  var offset = [0, 0, 0];
  var vector = vsub(target, aircraft.position); // vector from aircraft pointing to target
  var bearingToTarget = vradial(vector);
  offset[2] = vlen(vector);
  offset[0] = offset[2] * sin(headingThruTarget - bearingToTarget);
  offset[1] = offset[2] * cos(headingThruTarget - bearingToTarget);
  return offset;
}

window.heading_to_string = function heading_to_string(heading) {
  heading = round(mod(radiansToDegrees(heading), 360)).toString();
  if(heading == "0") heading = "360";
  if(heading.length == 1) heading = "00" + heading;
  if(heading.length == 2) heading = "0" + heading;
  return heading;
}

var radio_names = {
  0:"zero",
  1:"one",
  2:"two",
  3:"three",
  4:"four",
  5:"five",
  6:"six",
  7:"seven",
  8:"eight",
  9:"niner",
  10:"ten",
  11:"eleven",
  12:"twelve",
  13:"thirteen",
  14:"fourteen",
  15:"fifteen",
  16:"sixteen",
  17:"seventeen",
  18:"eighteen",
  19:"nineteen",
  20:"twenty",
  30:"thirty",
  40:"fourty",
  50:"fifty",
  60:"sixty",
  70:"seventy",
  80:"eighty",
  90:"ninety",
  a:"alpha",
  b:"bravo",
  c:"charlie",
  d:"delta",
  e:"echo",
  f:"foxtrot",
  g:"golf",
  h:"hotel",
  i:"india",
  j:"juliet",
  k:"kilo",
  l:"lima",
  m:"mike",
  n:"november",
  o:"oscar",
  p:"papa",
  q:"quebec",
  r:"romeo",
  s:"sierra",
  t:"tango",
  u:"uniform",
  v:"victor",
  w:"whiskey",
  x:"x-ray",
  y:"yankee",
  z:"zulu",
  "-":"dash",
  ".":"point",
};

var radio_cardinalDir_names = {
  "n":"north",
  "nw":"northwest",
  "w":"west",
  "sw":"southwest",
  "s":"south",
  "se":"southeast",
  "e":"east",
  "ne":"northeast"
};

var radio_runway_names = clone(radio_names);
    radio_runway_names.l = "left";
    radio_runway_names.c = "center";
    radio_runway_names.r = "right";

/**
 * Force a number to an integer with a specific # of digits
 * @return {string} with leading zeros to reach 'digits' places
 *
 * If the rounded integer has more digits than requested, it will be returned
 * anyway, as chopping them off the end would change the value by orders of
 * magnitude, which is almost definitely going to be undesirable.
 */
window.digits_integer = function digits_integer(number, digits, /*optional*/ truncate) {
  if(truncate) number = Math.floor(number).toString();
  else number = Math.round(number).toString();
  if(number.length > digits) return number;
  else while(number.length < digits) number = "0"+number; // add leading zeros
  return number;
}

/**
 * Round a number to a specific # of digits after the decimal
 * @param {boolean} force - (optional) Forces presence of trailing zeros.
 *        Must be set to true if you want '3' to be able to go to '3.0', or
 *        for '32.168420' to not be squished to '32.16842'. If true, fxn will
 *        return a string, because otherwise, js removes all trailing zeros.
 * @param {boolean} truncate - (optional) Selects shortening method.
 *        to truncate: 'true', to round: 'false' (default)
 * @return {number} if !force
 * @return {string} if force
 *
 * Also supports negative digits. Ex: '-2' would do 541.246 --> 500
 */
window.digits_decimal = function digits_decimal(number, digits, /*optional */ force, truncate) {
  var shorten = (truncate) ? Math.floor : Math.round;
  if(!force) return shorten(number * Math.pow(10,digits)) / Math.pow(10,digits);
  else { // check if needs extra trailing zeros
    if(digits <= 0) return (shorten(number * Math.pow(10,digits)) / Math.pow(10,digits)).toString();
    number = number.toString();
    for(var i=0; i<number.length; i++) {
      if(number[i] == '.') {
        var trailingDigits = number.length - (i+1);
        if(trailingDigits == digits) {
          return number.toString();
        }
        else if(trailingDigits < digits)  // add trailing zeros
          return number + Array(digits - trailingDigits+1).join("0");
        else if(trailingDigits > digits) {
          if(truncate) return number.substr(0,number.length-(trailingDigits - digits));
          else {
            var len = number.length-(trailingDigits - digits+1);
            var part1 = number.substr(0,len);
            var part2 = (digits==0) ? "" : shorten(parseInt(number.substr(len,2))/10).toString();
            return part1 + part2;
          }
        }
      }
    }
  }
}

window.getGrouping = function getGrouping(groupable) {
  var digit1 = groupable[0];
  var digit2 = groupable[1];
  if(digit1 == 0) {
    if(digit2 == 0) return "hundred";
    else return radio_names[digit1] + " " + radio_names[digit2];    // just digits (eg 'zero seven')
  }
  else if(digit1 == 1) return radio_names[groupable];         // exact number (eg 'seventeen')
  else if(digit1 >= 2) {
    if(digit2 == 0) return radio_names[(digit1+"0")]; // to avoid 'five twenty zero'
    else return radio_names[(digit1+"0")] + " " + radio_names[digit2]; // combo number (eg 'fifty one')
  }
  else return radio_names[digit1] + " " + radio_names[digit2];
}

window.groupNumbers = function groupNumbers(callsign, /*optional*/ airline) {
  if(!/^\d+$/.test(callsign)) { // GA, eg '117KS' = 'one-one-seven-kilo-sierra')

    if(airline == "November") { //callsign "November"
      var s = [];
      for (var k in callsign) { s.push(radio_names[callsign[k]]); } // one after another (eg 'one one seven kilo sierra')
      return s.join(" ");
    }

    else { // airline grouped, eg '3110A' = 'thirty-one-ten-alpha'
      //divide callsign into alpha/numeric sections
      var sections = [], cs = callsign, thisIsDigit;
      var index = cs.length - 1;
      var lastWasDigit = !isNaN(parseInt(cs[index]));
      index--;
      while(index>=0) {
        thisIsDigit = !isNaN(parseInt(cs[index]));
        while(thisIsDigit == lastWasDigit) {
          index--;
          thisIsDigit = !isNaN(parseInt(cs[index]));
          if(index<0) break;
        }
        sections.unshift(cs.substr(index+1));
        cs = cs.substr(0, index+1);
        lastWasDigit = thisIsDigit;
      }

      //build words, section by section
      var s = [];
      for (var i in sections) {
        if(isNaN(parseInt(sections[i])))  // alpha section
          s.push(radio_spellOut(sections[i]));
        else {  // numeric section
          switch (sections[i].length) {
          case 0: s.push(sections[i]); break;
          case 1: s.push(radio_names[sections[i]]); break;
          case 2: s.push(getGrouping(sections[i])); break;
          case 3: s.push(radio_names[sections[i][0]] + " " + getGrouping(sections[i].substr(1))); break;
          case 4: s.push(getGrouping(sections[i].substr(0,2)) + " " + getGrouping(sections[i].substr(2))); break;
          default: s.push(radio_spellOut(sections[i]));
          }
        }
      }
      return s.join(" ");
    }
  }
  else switch (callsign.length) {
    case 0: return callsign; break;
    case 1: return radio_names[callsign]; break;
    case 2: return getGrouping(callsign); break;
    case 3: return radio_names[callsign[0]] + " " + getGrouping(callsign.substr(1)); break;
    case 4: return getGrouping(callsign.substr(0,2)) + " " + getGrouping(callsign.substr(2)); break;
    default: return callsign;
  }
}

window.radio_runway = function radio_runway(input) {
  input = input + "";
  input = input.toLowerCase();
  var s = [];
  for(var i=0;i<input.length;i++) {
    var c = radio_runway_names[input[i]];
    if(c) s.push(c);
  }
  return s.join(" ");
}

window.radio_heading = function radio_heading(heading) {
  var str = heading.toString();
  var hdg = [];
  if(str) {
    if(str.length == 1) return "zero zero " + radio_names[str];
    else if(str.length == 2) return "zero " + radio_names[str[0]] + " " + radio_names[str[1]];
    else return radio_names[str[0]] + " " + radio_names[str[1]] + " " + radio_names[str[2]];
  } else return heading;
}

window.radio_spellOut = function radio_spellOut(alphanumeric) {
  var str = alphanumeric.toString();
  var arr = [];
  if(!str) return;
  for(var i=0; i<str.length; i++) {
    arr.push(radio_names[str[i]]);
  }
  return arr.join(" ");
}

window.radio_altitude = function radio_altitude(altitude) {
  var alt_s = altitude.toString();
  var s = [];
  if(altitude >= 18000) {
    s.push("flight level", radio_names[alt_s[0]], radio_names[alt_s[1]], radio_names[alt_s[2]]);
  }
  else if(altitude >= 10000) {
    s.push(radio_names[alt_s[0]], radio_names[alt_s[1]], "thousand");
    if(!(altitude % (Math.floor(altitude/1000)*1000) == 0)) {
      s.push(radio_names[alt_s[2]], "hundred");
    }
  }
  else if(altitude >= 1000) {
    s.push(radio_names[alt_s[0]], "thousand");
    if(!(altitude % (Math.floor(altitude/1000)*1000) == 0)) {
      s.push(radio_names[alt_s[1]], "hundred");
    }
  }
  else if(altitude >= 100) {
    s.push(radio_names[alt_s[0]], "hundred");
  }
  else return altitude;
  return s.join(" ");
}

window.radio_trend = function radio_trend(category, measured, target) {
  var CATEGORIES = {
    "altitude": ["descend and maintain", "climb and maintain",  "maintain"],
    "speed":    ["reduce speed to",  "increase speed to", "maintain present speed of"]
  };
  if(measured > target) return CATEGORIES[category][0];
  if(measured < target) return CATEGORIES[category][1];
  return CATEGORIES[category][2];
}

window.getCardinalDirection = function getCardinalDirection(angle) {
  var directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return directions[round(angle / (Math.PI*2) * 8)];
}

window.to_canvas_pos = function to_canvas_pos(pos) {
  return [prop.canvas.size.width / 2 + prop.canvas.panX + km(pos[0]),
          prop.canvas.size.height / 2 + prop.canvas.panY - km(pos[1])];
}

/**
 * Compute a point of intersection of a ray with a rectangle.
 * Args:
 *   pos: array of 2 numbers, representing ray source.
 *   dir: array of 2 numbers, representing ray direction.
 *   rectPos: array of 2 numbers, representing rectangle corner position.
 *   rectSize: array of 2 positive numbers, representing size of the rectangle.
 *
 * Returns:
 * - undefined, if pos is outside of the rectangle.
 * - undefined, in case of a numerical error.
 * - array of 2 numbers on a rectangle boundary, in case of an intersection.
 */
window.positive_intersection_with_rect = function positive_intersection_with_rect(pos, dir, rectPos, rectSize) {
  var left = rectPos[0];
  var right = rectPos[0] + rectSize[0];
  var top = rectPos[1];
  var bottom = rectPos[1] + rectSize[1];

  dir = vnorm(dir);

  // Check if pos is outside of rectangle.
  if (clamp(left, pos[0], right) != pos[0] || clamp(top, pos[1], bottom) != pos[1]) {
    return undefined;
  }

  // Check intersection with top segment.
  if (dir[1] < 0) {
    var t = (top - pos[1]) / dir[1];
    var x = pos[0] + dir[0] * t;
    if (clamp(left, x, right) == x) {
      return [x, top];
    }
  }

  // Check intersection with bottom segment.
  if (dir[1] > 0) {
    var t = (bottom - pos[1]) / dir[1];
    var x = pos[0] + dir[0] * t;
    if (clamp(left, x, right) == x) {
      return [x, bottom];
    }
  }

  // Check intersection with left segment.
  if (dir[0] < 0) {
    var t = (left - pos[0]) / dir[0];
    var y = pos[1] + dir[1] * t;
    if (clamp(top, y, bottom) == y) {
      return [left, y];
    }
  }

  // Check intersection with right segment.
  if (dir[0] > 0) {
    var t = (right - pos[0]) / dir[0];
    var y = pos[1] + dir[1] * t;
    if (clamp(top, y, bottom) == y) {
      return [right, y];
    }
  }

  // Failed to compute intersection due to numerical precision.
  return undefined;
}

/**
 * Return a random number within the given interval
 *  With one argument return a number between 0 and argument
 *  With no arguments return a number between 0 and 1
 */
window.random = function random(low, high) {
  if (low == high) return low;
  if (low == null) return Math.random();
  if (high == null) return Math.random() * low;
  return (low + (Math.random() * (high - low)));
}

/**
 * Get new position by fix-radial-distance method
 * @param {array} fix - positional array of start point, in decimal-degrees [lat,lon]
 * @param {number} radial - heading to project along, in radians
 * @param {number} dist - distance to project, in nm
 * @returns {array} location of the projected fix
 */
window.fixRadialDist = function fixRadialDist(fix, radial, dist) {
  fix = [degreesToRadians(fix[0]), degreesToRadians(fix[1])]; // convert GPS coordinates to radians
  var R = 3440; // radius of Earth, nm
  var lat2 = Math.asin(Math.sin(fix[1])*Math.cos(dist/R) +
             Math.cos(fix[1])*Math.sin(dist/R)*Math.cos(radial));
  var lon2 = fix[0] + Math.atan2(Math.sin(radial)*Math.sin(dist/R)*Math.cos(fix[1]),
             Math.cos(dist/R)-Math.sin(fix[1])*Math.sin(lat2));
  return [radiansToDegrees(lon2), radiansToDegrees(lat2)];
}

/**
 * Splices all empty elements out of an array
 */
window.array_clean = function array_clean(array, deleteValue) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == deleteValue) {
      array.splice(i, 1);
      i--;
    }
  }
  return array;
};

/**
 * Returns the sum of all numerical values in the array
 */
window.array_sum = function array_sum(array) {
  var total = 0;
  for(var i=0; i<array.length; i++) total += parseFloat(array[i]);
  return total;
}

window.inAirspace = function inAirspace(pos) {
  var apt = airport_get();
  var perim = apt.perimeter;
  if(perim) {
    return point_in_area(pos, perim);
  }
  else {
    return distance2d(pos, apt.position.position) <= apt.ctr_radius;
  }
}

window.dist_to_boundary = function dist_to_boundary(pos) {
  var apt = airport_get();
  var perim = apt.perimeter;
  if(perim) {
    return distance_to_poly(pos, area_to_poly(perim));  // km
  }
  else {
    return abs(distance2d(pos, apt.position.position) - apt.ctr_radius);
  }
}

// ************************ VECTOR FUNCTIONS ************************
// For more info, see http://threejs.org/docs/#Reference/Math/Vector3
// Remember: [x,y] convention is used, and doesn't match [lat,lon]

/**
 * Normalize a 2D vector
 * eg scaling elements such that net length is 1
 * Turns vector 'v' into a 'unit vector'
 */
window.vnorm = function vnorm(v,length) {
  var x=v[0];
  var y=v[1];
  var angle=Math.atan2(x,y);
  if(!length)
    length=1;
  return([
    sin(angle)*length,
    cos(angle)*length
  ]);
}

/**
 * Create a 2D vector
 * Pass a heading (rad), and this will return the corresponding unit vector
 */
window.vectorize_2d = function vectorize_2d(direction) {
  return [ Math.sin(direction), Math.cos(direction) ];
}

/**
 * Adds Vectors (all dimensions)
 */
window.vadd = function vadd(v1, v2) {
  try {
    var v = [], lim = Math.min(v1.length,v2.length);
    for(var i=0; i<lim; i++) v.push(v1[i] + v2[i]);
    return v;
  }
  catch(err) {console.error("call to vadd() failed. v1:"+v1+" | v2:"+v2+" | Err:"+err);}
}

// /**
//  * Subtracts Vectors (all dimensions)
//  */
// window.vsub = function vsub(v1, v2) {
//     debugger;
//   try {
//     var v = [], lim = Math.min(v1.length,v2.length);
//     for(var i=0; i<lim; i++) v.push(v1[i] - v2[i]);
//     return v;
//   }
//   catch(err) {console.error("call to vsub() failed. v1:"+v1+" | v2:"+v2+" | Err:"+err);}
// }

/**
 * Multiplies Vectors (all dimensions)
 */
window.vmul = function vmul(v1, v2) {
  try {
    var v = [], lim = Math.min(v1.length,v2.length);
    for(var i=0; i<lim; i++) v.push(v1[i] * v2[i]);
    return v;
  }
  catch(err) {console.error("call to vmul() failed. v1:"+v1+" | v2:"+v2+" | Err:"+err);}
}

/**
 * Divides Vectors (all dimensions)
 */
window.vdiv = function vdiv(v1, v2) {
  try {
    var v = [], lim = Math.min(v1.length,v2.length);
    for(var i=0; i<lim; i++) v.push(v1[i] / v2[i]);
    return v;
  }
  catch(err) {console.error("call to vdiv() failed. v1:"+v1+" | v2:"+v2+" | Err:"+err);}
}

/**
 * Scales vectors in magnitude (all dimensions)
 */
window.vscale = function vscale(v, factor) {
  var vs = [];
  for(var i=0; i<v.length; i++) vs.push(v[i] * factor);
  return vs;
}

/**
 * Vector dot product (all dimensions)
 */
window.vdp = function vdp(v1, v2) {
  var n = 0, lim = Math.min(v1.length,v2.length);
  for (var i = 0; i < lim; i++) n += v1[i] * v2[i];
  return n;
}

/**
 * Vector cross product (3D/2D*)
 * Passing 3D vector returns 3D vector
 * Passing 2D vector (classically improper) returns z-axis SCALAR
 * *Note on 2D implementation: http://stackoverflow.com/a/243984/5774767
 */
window.vcp = function vcp(v1, v2) {
  if(Math.min(v1.length,v2.length) == 2)  // for 2D vector (returns z-axis scalar)
    return vcp([v1[0],v1[1],0],[v2[0],v2[1],0])[2];
  if(Math.min(v1.length,v2.length) == 3)  // for 3D vector (returns 3D vector)
    return [vdet([v1[1],v1[2]],[v2[1],v2[2]]),
           -vdet([v1[0],v1[2]],[v2[0],v2[2]]),
            vdet([v1[0],v1[1]],[v2[0],v2[1]])];
}

/**
 * Compute determinant of 2D/3D vectors
 * Remember: May return negative values (undesirable in some situations)
 */
window.vdet = function vdet(v1, v2, /*optional*/ v3) {
  if(Math.min(v1.length,v2.length) == 2)  // 2x2 determinant
    return (v1[0]*v2[1])-(v1[1]*v2[0]);
  else if(Math.min(v1.length,v2.length,v3.length) == 3 && v3) // 3x3 determinant
    return (v1[0]*vdet([v2[1],v2[2]],[v3[1],v3[2]])
          - v1[1]*vdet([v2[0],v2[2]],[v3[0],v3[2]])
          + v1[2]*vdet([v2[0],v2[1]],[v3[0],v3[1]]));
}

/**
 * Returns vector rotated by "radians" radians
 */
window.vturn = function vturn(radians, v) {
  if (!v) v = [0, 1];
  var x = v[0],
      y = v[1],
      cs = Math.cos(-radians),
      sn = Math.sin(-radians);
  return [x * cs - y * sn,
          x * sn + y * cs];
}

/**
 * Determines if and where two runways will intersect.
 * Note: Please pass ONLY the runway identifier (eg '28r')
 */
window.runwaysIntersect = function runwaysIntersect(rwy1_name, rwy2_name) {
  return raysIntersect(
    airport_get().getRunway(rwy1_name).position,
    airport_get().getRunway(rwy1_name).angle,
    airport_get().getRunway(rwy2_name).position,
    airport_get().getRunway(rwy2_name).angle,
    9.9 ); // consider "parallel" if rwy hdgs differ by maximum of 9.9 degrees
}

/**
 * Determines if and where two rays will intersect. All angles in radians.
 * Variation based on http://stackoverflow.com/a/565282/5774767
 */
window.raysIntersect = function raysIntersect(pos1, dir1, pos2, dir2, deg_allowance) {
  if(!deg_allowance) deg_allowance = 0; // degrees divergence still considered 'parallel'
  var p = pos1;
  var q = pos2;
  var r = vectorize_2d(dir1);
  var s = vectorize_2d(dir2);
  var t = abs(vcp(vsub(q,p),s) / vcp(r,s));
  var t_norm = abs(vcp(vsub(vnorm(q),vnorm(p)),s) / vcp(r,s));
  var u_norm = abs(vcp(vsub(vnorm(q),vnorm(p)),r) / vcp(r,s));
  if(abs(vcp(r,s)) < abs(vcp([0,1],vectorize_2d(degreesToRadians(deg_allowance))))) { // parallel (within allowance)
    if(vcp(vsub(vnorm(q),vnorm(p)),r) == 0) return true; // collinear
    else return false;  // parallel, non-intersecting
  }
  else if((0 <= t_norm && t_norm <= 1) && (0 <= u_norm && u_norm <= 1))
    return vadd(p,vscale(r,t)); // rays intersect here
  else return false;  // diverging, non-intersecting
}

/**
 * 'Flips' vector's Y component in direction
 * Helper function for culebron's poly edge vector functions
 */
window.vflipY = function vflipY(v) {
  return [-v[1], v[0]];
}

/*
solution by @culebron
turn poly edge into a vector.
the edge vector scaled by j and its normal vector scaled by i meet
if the edge vector points between the vertices,
then normal is the shortest distance.
--------
x1 + x2 * i == x3 + x4 * j
y1 + y2 * i == y3 + y4 * j
0 < j < 1
--------

i == (y3 + j y4 - y1) / y2
x1 + x2 y3 / y2 + j x2 y4 / y2 - x2 y1 / y2 == x3 + j x4
j x2 y4 / y2 - j x4 == x3 - x1 - x2 y3 / y2 + x2 y1 / y2
j = (x3 - x1 - x2 y3 / y2 + x2 y1 / y2) / (x2 y4 / y2 - x4)
i = (y3 + j y4 - y1) / y2

i == (x3 + j x4 - x1) / x2
y1 + y2 x3 / x2 + j y2 x4 / x2 - y2 x1 / x2 == y3 + j y4
j y2 x4 / x2 - j y4 == y3 - y1 - y2 x3 / x2 + y2 x1 / x2
j = (y3 - y1 - y2 x3 / x2 + y2 x1 / x2) / (y2 x4 / x2 - y4)
i = (x3 + j x4 - x1) / x2
*/
window.distance_to_poly = function distance_to_poly(point, poly) {
  var dists = $.map(poly, function(vertex1, i) {
    var prev = (i == 0 ? poly.length : i) - 1,
        vertex2 = poly[prev],
        edge = vsub(vertex2, vertex1);

    if (vlen(edge) == 0)
      return vlen(vsub(point, vertex1));

    // point + normal * i == vertex1 + edge * j
    var norm = vflipY(edge),
        x1 = point[0],
        x2 = norm[0],
        x3 = vertex1[0],
        x4 = edge[0],
        y1 = point[1],
        y2 = norm[1],
        y3 = vertex1[1],
        y4 = edge[1],
        i, j;

    if (y2 != 0) {
      j = (x3 - x1 - x2 * y3 / y2 + x2 * y1 / y2) / (x2 * y4 / y2 - x4);
      i = (y3 + j * y4 - y1) / y2;
    }
    else if (x2 != 0) { // normal can't be zero unless the edge has 0 length
      j = (y3 - y1 - y2 * x3 / x2 + y2 * x1 / x2) / (y2 * x4 / x2 - y4);
      i = (x3 + j * x4 - x1) / x2;
    }

    if (j < 0 || j > 1 || j == null)
      return Math.min(
        vlen(vsub(point, vertex1)),
        vlen(vsub(point, vertex2)));

    return vlen(vscale(norm, i));
  });

  return Math.min.apply(null, dists);
}


window.point_to_mpoly = function point_to_mpoly(point, mpoly) {
  /* returns: boolean inside/outside & distance to the polygon */
  var k, ring, inside = false;
  for (var k in mpoly) {
    ring = mpoly[k];
    if (point_in_poly(point, ring)) {
      if (k == 0)
        inside = true; // if inside outer ring, remember that and wait till the end
      else // if by change in one of inner rings, it's out of poly, return distance to the inner ring
        return {inside: false, distance: distance_to_poly(point, ring)}
    }
  }
  // if not matched to inner circles, return the match to outer and distance to it
  return {inside: inside, distance: distance_to_poly(point, mpoly[0])};
}

// source: https://github.com/substack/point-in-polygon/
window.point_in_poly = function point_in_poly(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0],
        y = point[1],
        i,
        j = vs.length - 1,
        inside = false;

    for (i in vs) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
        j = i;
    }

    return inside;
}

/**
 * Converts an 'area' to a 'poly'
 */
window.area_to_poly = function area_to_poly(area) {
  return $.map(area.poly, function(v) {return [v.position];});
}

/**
 * Checks to see if a point is in an area
 */
window.point_in_area = function point_in_area(point, area) {
  return point_in_poly(point, area_to_poly(area));
}

window.endsWith = function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

window.parseElevation = function parseElevation(ele) {
  var alt = /^(Infinity|(\d+(\.\d+)?)(m|ft))$/.exec(ele);
  if (alt == null) {
    log('Unable to parse elevation ' + ele);
    return;
  }
  if (alt[1] == 'Infinity') return Infinity;
  return parseFloat(alt[2]) / (alt[4] == 'm' ? 0.3048 : 1);
}

// adjust all aircraft's eid values
window.update_aircraft_eids = function update_aircraft_eids() {
  for(var i=0; i<prop.aircraft.list.length; i++) {
    prop.aircraft.list[i].eid = i;  // update eid in aircraft
    prop.aircraft.list[i].fms.my_aircrafts_eid = i; // update eid in aircraft's fms
  }
}

// Remove the specified aircraft and perform cleanup operations
window.aircraft_remove = function aircraft_remove(aircraft) {
  prop.aircraft.callsigns.splice(prop.aircraft.callsigns.indexOf(aircraft.callsign), 1);
  prop.aircraft.list.splice(prop.aircraft.list.indexOf(aircraft), 1);
  update_aircraft_eids();
  aircraft.cleanup();
}
