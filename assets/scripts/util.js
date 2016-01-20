
window.AudioContext = window.AudioContext||window.webkitAudioContext;

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

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

var sin_cache={};

function ceil(n, factor) {
  factor = factor || 1;
  return Math.ceil(n / factor) * factor;
}

function round(n, factor) {
  factor = factor || 1;
  return Math.round(n / factor) * factor;
}

function abs(n) {
  return Math.abs(n);
}

function sin(v) {
  return(Math.sin(v));
  if(!v in sin_cache)
    sin_cache[v]=Math.sin(v);
  return(sin_cache[v]);
}

function cos(v) {
  return(sin(v+Math.PI/2));
}

function tan(v) {
  return Math.tan(v);
}

function normalize(v,length) {
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

function fl(n, number) {
  number = number || 1;
  return Math.floor(n / number) * number;
}

function randint(l,h) {
  return(Math.floor(Math.random()*(h-l+1))+l);
}

function elements(obj) {
  var n=0;
  for(var i in obj)
    n+=1;
  return n;
}

function len(obj) {
  return elements(obj);
}

function s(i) {
  if(i == 1)
    return "";
  else
    return "s";
}

function within(n,c,r) {
  if((n > c+r) || (n < c-r))
    return false;
  return true;
}

function trange(il,i,ih,ol,oh) {
  return(ol+(oh-ol)*(i-il)/(ih-il));
  i=(i/(ih-il))-il;
  return (i*(oh-ol))+ol;
}

function clamp(l,i,h) {
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

function crange(il,i,ih,ol,oh) {
  return clamp(ol,trange(il,i,ih,ol,oh),oh);
}

function srange(il,i,ih) {
  //    return Math.cos();
}

function distance2d(a,b) {
  var x=a[0]-b[0];
  var y=a[1]-b[1];
  return Math.sqrt((x*x)+(y*y));
}

function degrees(radians) {
  return (radians/(Math.PI*2))*360;
}

function radians(degrees) {
  return (degrees/360)*(Math.PI*2);
}

function choose(l) {
  return l[Math.floor(Math.random()*l.length)];
}

function choose_weight(l) {
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


function mod(a, b) {
  return ((a%b)+b)%b;
};

function lpad(n, width) {
  if (n.toString().length >= width) return n.toString();
  var x = "0000000000000" + n;
  return x.substr(x.length-width, width);
}

function angle_offset(a, b) {
  a = degrees(a);
  b = degrees(b);
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
  offset = radians(offset);
  return offset;
}

function average() {
  var sum = 0;
  for(var i=0;i<arguments.length;i++) sum += arguments[i];
  return sum / arguments.length;
}

function heading_to_string(heading) {
  heading = round(mod(degrees(heading), 360));
  if(heading == 0) heading = 360;
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

function radio_spellOut(input) {
  input = input + "";
  input = input.toLowerCase();
  var s = [];
  for(var i=0;i<input.length;i++) {
    var c = radio_names[input[i]];
    if(c) s.push(c);
  }
  return s.join(" ");
}

function radio_runway(input) {
  input = input + "";
  input = input.toLowerCase();
  var s = [];
  for(var i=0;i<input.length;i++) {
    var c = radio_runway_names[input[i]];
    if(c) s.push(c);
  }
  return s.join(" ");
}

function radio_cardinalDir(input) {
  input = input + "";
  input = input.toLowerCase();
  var s = [];
  for(var i=0;i<input.length;i++) {
    var c = radio_cardinalDir_names[input[i]];
    if(c) s.push(c);
  }
  return s.join(" ");
}

function radio_trend(category, measured, target) {
  var CATEGORIES = {
    "altitude": ["descend to", "climb to",  "maintaining"],
    "speed":    ["set speed",  "set speed", "maintaining"]
  };
  if(measured > target) return CATEGORIES[category][0];
  if(measured < target) return CATEGORIES[category][1];
  return CATEGORIES[category][2];
}

function radio_altitude(alt) {
  if(alt >= 18000) return "flight level " + round(alt/100).toString();
  else return alt.toString();
}

function getCardinalDirection(angle) {
  var directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return directions[round(angle / (Math.PI*2) * 8)];
}

// Return a random number within the given interval
// With one argument return a number between 0 and argument
// With no arguments return a number between 0 and 1
function random(low, high) {
  if (low == high) return low;
  if (low == null) return Math.random();
  if (high == null) return Math.random() * low;
  return (low + (Math.random() * (high - low)));
}

function vlen(v) {
  return Math.sqrt(v[0]*v[0] + v[1] * v[1]);
}

function vsum(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function vsub(v1, v2) {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}

function vscale(v, factor) {
  return [v[0] * factor, v[1] * factor];
}

function vradial(v) {
  return Math.atan2(v[0], v[1]);
}

function vturn(radians, v) {
  if (!v) v = [0, 1];
  var 
    x = v[0],
    y = v[1],
    cs = Math.cos(-radians),
    sn = Math.sin(-radians)
    ;
  return [
      x * cs - y * sn,
      x * sn + y * cs
  ];
}

function vnorm(v) {
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
function distance_to_poly(point, poly) {
  var dists = $.map(poly, function(vertex1, i) {
    var prev = (i == 0 ? poly.length : i) - 1,
        vertex2 = poly[prev],
        edge = vsub(vertex2, vertex1);

    if (vlen(edge) == 0)
      return vlen(vsub(point, vertex1));

    // point + normal * i == vertex1 + edge * j
    var norm = vnorm(edge),
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


function point_to_mpoly(point, mpoly) {
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
function point_in_poly(point, vs) {
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
};

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;  
}

function parseElevation(ele) {
  var alt = /^(Infinity|(\d+(\.\d+)?)(m|ft))$/.exec(ele);
  if (alt == null) {
    log('Unable to parse elevation ' + ele);
    return;
  }
  if (alt[1] == 'Infinity') return Infinity;
  return parseFloat(alt[2]) / (alt[4] == 'm' ? 0.3048 : 1);
}
