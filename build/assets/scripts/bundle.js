(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     Fiber.js 1.0.4
//     @Author: Kirollos Risk
//
//     Copyright (c) 2012 LinkedIn.
//     All Rights Reserved. Apache Software License 2.0
//     http://www.apache.org/licenses/LICENSE-2.0

( function( global ) {

  // Baseline setup
  // --------------

  // Stores whether the object is being initialized. i.e., whether
  // to run the `init` function, or not.
  var initializing = false,

  // Keep a few prototype references around - for speed access,
  // and saving bytes in the minified version.
    ArrayProto = Array.prototype,

  // Save the previous value of `Fiber`.
    previousFiber = global.Fiber;

  // Helper function to copy properties from one object to the other.
  function copy( from, to ) {
    var name;
    for( name in from ) {
      if( from.hasOwnProperty( name ) ) {
        to[name] = from[name];
      }
    }
  }

  // The base `Fiber` implementation.
  function Fiber(){};

  // ###Extend
  //
  // Returns a subclass.
  Fiber.extend = function( fn ) {
    // Keep a reference to the current prototye.
    var parent = this.prototype,

    // Invoke the function which will return an object literal used to define
    // the prototype. Additionally, pass in the parent prototype, which will
    // allow instances to use it.
      properties = fn( parent ),

    // Stores the constructor's prototype.
      proto;

    // The constructor function for a subclass.
    function child(){
      if( !initializing ){
        // Custom initialization is done in the `init` method.
        this.init.apply( this, arguments );
        // Prevent susbsequent calls to `init`.
        // Note: although a `delete this.init` would remove the `init` function from the instance,
        // it would still exist in its super class' prototype.  Therefore, explicitly set
        // `init` to `void 0` to obtain the `undefined` primitive value (in case the global's `undefined`
        // property has been re-assigned).
        this.init = void 0;
      }
    }

    // Instantiate a base class (but only create the instance, without running `init`).
    // and make every `constructor` instance an instance of `this` and of `constructor`.
    initializing = true;
    proto = child.prototype = new this;
    initializing = false;

    // Add default `init` function, which a class may override; it should call the
    // super class' `init` function (if it exists);
    proto.init = function(){
      if ( typeof parent.init === 'function' ) {
        parent.init.apply( this, arguments );
      }
    };

     // Copy the properties over onto the new prototype.
    copy( properties, proto );

    // Enforce the constructor to be what we expect.
    proto.constructor = child;

    // Keep a reference to the parent prototype.
    // (Note: currently used by decorators and mixins, so that the parent can be inferred).
    child.__base__ = parent;

     // Make this class extendable.
    child.extend = Fiber.extend;

    return child;
  };

  // Utilities
  // ---------

  // ###Proxy
  //
  // Returns a proxy object for accessing base methods with a given context.
  //
  // - `base`: the instance' parent class prototype.
  // - `instance`: a Fiber class instance.
  //
  // Overloads:
  //
  // - `Fiber.proxy( instance )`
  // - `Fiber.proxy( base, instance )`
  //
  Fiber.proxy = function( base, instance ) {
    var name,
      iface = {},
      wrap;

    // If there's only 1 argument specified, then it is the instance,
    // thus infer `base` from its constructor.
    if ( arguments.length === 1 ) {
      instance = base;
      base = instance.constructor.__base__;
    }

    // Returns a function which calls another function with `instance` as
    // the context.
    wrap = function( fn ) {
      return function() {
        return base[fn].apply( instance, arguments );
      };
    };

    // For each function in `base`, create a wrapped version.
    for( name in base ){
      if( base.hasOwnProperty( name ) && typeof base[name] === 'function' ){
        iface[name] = wrap( name );
      }
    }
    return iface;
  };

  // ###Decorate
  //
  // Decorate an instance with given decorator(s).
  //
  // - `instance`: a Fiber class instance.
  // - `decorator[s]`: the argument list of decorator functions.
  //
  // Note: when a decorator is executed, the argument passed in is the super class' prototype,
  // and the context (i.e. the `this` binding) is the instance.
  //
  //  *Example usage:*
  //
  //     function Decorator( base ) {
  //       // this === obj
  //       return {
  //         greet: function() {
  //           console.log('hi!');
  //         }
  //       };
  //     }
  //
  //     var obj = new Bar(); // Some instance of a Fiber class
  //     Fiber.decorate(obj, Decorator);
  //     obj.greet(); // hi!
  //
  Fiber.decorate = function( instance /*, decorator[s] */) {
    var i,
      // Get the base prototype.
      base = instance.constructor.__base__,
      // Get all the decorators in the arguments.
      decorators = ArrayProto.slice.call( arguments, 1 ),
      len = decorators.length;

    for( i = 0; i < len; i++ ){
      copy( decorators[i].call( instance, base ), instance );
    }
  };

  // ###Mixin
  //
  // Add functionality to a Fiber definition
  //
  // - `definition`: a Fiber class definition.
  // - `mixin[s]`: the argument list of mixins.
  //
  // Note: when a mixing is executed, the argument passed in is the super class' prototype
  // (i.e., the base)
  //
  // Overloads:
  //
  // - `Fiber.mixin( definition, mix_1 )`
  // - `Fiber.mixin( definition, mix_1, ..., mix_n )`
  //
  // *Example usage:*
  //
  //     var Definition = Fiber.extend(function(base) {
  //       return {
  //         method1: function(){}
  //       }
  //     });
  //
  //     function Mixin(base) {
  //       return {
  //         method2: function(){}
  //       }
  //     }
  //
  //     Fiber.mixin(Definition, Mixin);
  //     var obj = new Definition();
  //     obj.method2();
  //
  Fiber.mixin = function( definition /*, mixin[s] */ ) {
    var i,
      // Get the base prototype.
      base = definition.__base__,
      // Get all the mixins in the arguments.
      mixins = ArrayProto.slice.call( arguments, 1 ),
      len = mixins.length;

    for( i = 0; i < len; i++ ){
      copy( mixins[i]( base ), definition.prototype );
    }
  };

  // ###noConflict
  //
  // Run Fiber.js in *noConflict* mode, returning the `fiber` variable to its
  // previous owner. Returns a reference to the Fiber object.
  Fiber.noConflict = function() {
    global.Fiber = previousFiber;
    return Fiber;
  };

  // Common JS
  // --------------

  // Export `Fiber` to Common JS Loader
  if( typeof module !== 'undefined' ) {
    if( typeof module.setExports === 'function' ) {
      module.setExports( Fiber );
    } else if( module.exports ) {
      module.exports = Fiber;
    }
  } else {
    global.Fiber = Fiber;
  }

// Establish the root object: `window` in the browser, or global on the server.
})( this );

},{}],2:[function(require,module,exports){
/*eslint-disable no-unused-vars*/
/*!
 * jQuery JavaScript Library v3.1.0
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2016-07-07T21:44Z
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};



	function DOMEval( code, doc ) {
		doc = doc || document;

		var script = doc.createElement( "script" );

		script.text = code;
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}
/* global Symbol */
// Defining this global in .eslintrc would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.1.0",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = jQuery.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isFunction: function( obj ) {
		return jQuery.type( obj ) === "function";
	},

	isArray: Array.isArray,

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {

		// As of jQuery 3.0, isNumeric is limited to
		// strings and numbers (primitives or objects)
		// that can be coerced to finite numbers (gh-2662)
		var type = jQuery.type( obj );
		return ( type === "number" || type === "string" ) &&

			// parseFloat NaNs numeric-cast false positives ("")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			!isNaN( obj - parseFloat( obj ) );
	},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		// Support: Android <=2.3 only (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		DOMEval( code );
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE <=9 - 11, Edge 12 - 13
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.0
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-01-04
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true;
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {
	// Known :disabled false positives:
	// IE: *[disabled]:not(button, input, select, textarea, optgroup, option, menuitem, fieldset)
	// not IE: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Check form elements and option elements for explicit disabling
		return "label" in elem && elem.disabled === disabled ||
			"form" in elem && elem.disabled === disabled ||

			// Check non-disabled form elements for fieldset[disabled] ancestors
			"form" in elem && elem.disabled === false && (
				// Support: IE6-11+
				// Ancestry is covered for us
				elem.isDisabled === disabled ||

				// Otherwise, assume any non-<option> under fieldset[disabled] is disabled
				/* jshint -W018 */
				elem.isDisabled !== !disabled &&
					("label" in elem || !disabledAncestor( elem )) !== disabled
			);
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				return m ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( indexOf.call( qualifier, elem ) > -1 ) !== not && elem.nodeType === 1;
	} );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnotwhite = ( /\S+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( jQuery.isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && jQuery.isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && jQuery.isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Support: Android 4.0 only
			// Strict mode functions invoked without .call/.apply get global-object context
			resolve.call( undefined, value );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.call( undefined, value );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = jQuery.isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( jQuery.isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								jQuery.isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				jQuery.isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			len ? fn( elems[ 0 ], key ) : emptyGet;
};
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ jQuery.camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ jQuery.camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ jQuery.camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( jQuery.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( jQuery.camelCase );
			} else {
				key = jQuery.camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnotwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :

					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? JSON.parse( data ) :
					data;
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			jQuery.contains( elem.ownerDocument, elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted,
		scale = 1,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		do {

			// If previous iteration zeroed out, double until we get *something*.
			// Use string for doubling so we don't accidentally see scale as unchanged below
			scale = scale || ".5";

			// Adjust and apply
			initialInUnit = initialInUnit / scale;
			jQuery.style( elem, prop, initialInUnit + unit );

		// Update scale, tolerating zero or NaN from tween.cur()
		// Break the loop if scale is unchanged or perfect, or if we've just had enough.
		} while (
			scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
		);
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) ),
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

var rscriptType = ( /^$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret = typeof context.getElementsByTagName !== "undefined" ?
			context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== "undefined" ?
				context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, contains, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( jQuery.type( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();
var documentElement = document.documentElement;



var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 only
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Support: IE <=9
		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		//
		// Support: Firefox <=42
		// Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
		if ( delegateCount && cur.nodeType &&
			( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push( { elem: cur, handlers: matches } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: jQuery.isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			return ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
		}

		return event.which;
	}
}, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

function manipulationTarget( elem, content ) {
	if ( jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return elem.getElementsByTagName( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		isFunction = jQuery.isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( isFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( isFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), doc );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rmargin = ( /^margin/ );

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		div.style.cssText =
			"box-sizing:border-box;" +
			"position:relative;display:block;" +
			"margin:auto;border:1px;padding:1px;" +
			"top:1%;width:50%";
		div.innerHTML = "";
		documentElement.appendChild( container );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = divStyle.marginLeft === "2px";
		boxSizingReliableVal = divStyle.width === "4px";

		// Support: Android 4.0 - 4.3 only
		// Some styles come back with percentage values, even though they shouldn't
		div.style.marginRight = "50%";
		pixelMarginRightVal = divStyle.marginRight === "4px";

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
		"padding:0;margin-top:1px;position:absolute";
	container.appendChild( div );

	jQuery.extend( support, {
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelMarginRight: function() {
			computeStyleTests();
			return pixelMarginRightVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,
		style = elem.style;

	computed = computed || getStyles( elem );

	// Support: IE <=9 only
	// getPropertyValue is only needed for .css('filter') (#12537)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?

		// If we already have the right measurement, avoid augmentation
		4 :

		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {

			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// At this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {

			// At this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// At this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var val,
		valueIsBorderBox = true,
		styles = getStyles( elem ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// Support: IE <=11 only
	// Running getBoundingClientRect on a disconnected node
	// in IE throws an error.
	if ( elem.getClientRects().length ) {
		val = elem.getBoundingClientRect()[ name ];
	}

	// Some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {

		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test( val ) ) {
			return val;
		}

		// Check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox &&
			( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// Use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] ||
			( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				style[ name ] = value;
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] ||
			( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}
		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, name, extra );
						} ) :
						getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = extra && getStyles( elem ),
				subtract = extra && augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				);

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ name ] = value;
				value = jQuery.css( elem, name );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function raf() {
	if ( timerId ) {
		window.requestAnimationFrame( raf );
		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 13
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( jQuery.isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					jQuery.proxy( result.stop, result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnotwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	// Go to the end state if fx are off or if document is hidden
	if ( jQuery.fx.off || document.hidden ) {
		opt.duration = 0;

	} else {
		opt.duration = typeof opt.duration === "number" ?
			opt.duration : opt.duration in jQuery.fx.speeds ?
				jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = window.requestAnimationFrame ?
			window.requestAnimationFrame( raf ) :
			window.setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	if ( window.cancelAnimationFrame ) {
		window.cancelAnimationFrame( timerId );
	} else {
		window.clearInterval( timerId );
	}

	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					jQuery.nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) ||
						rclickable.test( elem.nodeName ) && elem.href ?
							0 :
							-1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {
			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




var rclass = /[\t\r\n\f]/g;

function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnotwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 &&
					( " " + curValue + " " ).replace( rclass, " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		if ( typeof value === "string" && value ) {
			classes = value.match( rnotwhite ) || [];

			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 &&
					( " " + curValue + " " ).replace( rclass, " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( type === "string" ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = value.match( rnotwhite ) || [];

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + getClass( elem ) + " " ).replace( rclass, " " )
					.indexOf( className ) > -1
			) {
				return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g,
	rspaces = /[\x20\t\r\n\f]+/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?

					// Handle most common string cases
					ret.replace( rreturn, "" ) :

					// Handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					jQuery.trim( jQuery.text( elem ) ).replace( rspaces, " " );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




support.focusin = "onfocusin" in window;


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = jQuery.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = jQuery.isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					} ) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 13
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in uncached url if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rts, "" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( jQuery.isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" ).prop( {
					charset: s.scriptCharset,
					src: s.url
				} ).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = jQuery.trim( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var docElem, win, rect, doc,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		rect = elem.getBoundingClientRect();

		// Make sure element is not hidden (display: none)
		if ( rect.width || rect.height ) {
			doc = elem.ownerDocument;
			win = getWindow( doc );
			docElem = doc.documentElement;

			return {
				top: rect.top + win.pageYOffset - docElem.clientTop,
				left: rect.left + win.pageXOffset - docElem.clientLeft
			};
		}

		// Return zeros for disconnected and hidden elements (gh-2310)
		return rect;
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
		// because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume getBoundingClientRect is there when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {

			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset = {
				top: parentOffset.top + jQuery.css( offsetParent[ 0 ], "borderTopWidth", true ),
				left: parentOffset.left + jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true )
			};
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

jQuery.parseJSON = JSON.parse;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}





var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}


return jQuery;
} );

},{}],3:[function(require,module,exports){
/** Details about aircraft in close proximity in relation to 'the rules'
 */
window.zlsa.atc.Conflict = Fiber.extend(function() {
  return {
    init: function(first, second) {
      this.aircraft = [first, second];
      this.distance = vlen(vsub(first.position, second.position));
      this.distance_delta = 0;
      this.altitude = abs(first.altitude - second.altitude);

      this.collided = false;

      this.conflicts = {};
      this.violations = {};

      this.aircraft[0].addConflict(this, second);
      this.aircraft[1].addConflict(this, first);

      this.update();
    },

    /**
     * Is there anything which should be brought to the controllers attention
     *
     * @returns {Array of Boolean} First element true if any conflicts/warnings,
     *                             Second element true if any violations.
     */
    hasAlerts: function() {
      return [this.hasConflict(), this.hasViolation()];
    },

    /**
     *  Whether any conflicts are currently active
     */
    hasConflict: function() {
      for (var i in this.conflicts) {
        if (this.conflicts[i])
          return true;
      }
      return false;
    },

    /**
     *  Whether any violations are currently active
     */
    hasViolation: function() {
      for (var i in this.violations) {
        if (this.violations[i])
          return true;
      }
      return false;
    },

    /**
     * Update conflict and violation checks, potentially removing this conflict.
     */
    update: function() {
      // Avoid triggering any more conflicts if the two aircraft have collided
      if (this.collided) return;

      var d = this.distance;
      this.distance = vlen(vsub(this.aircraft[0].position, this.aircraft[1].position));
      this.distance_delta = this.distance - d;
      this.altitude = abs(this.aircraft[0].altitude - this.aircraft[1].altitude);

      // Check if the separation is now beyond the bounding box check
      if (this.distance > 14.816) { // 14.816km = 8nm (max possible sep minmum)
        this.remove();
        return;
      }

      this.checkCollision();
      this.checkRunwayCollision();

      // Ignore aircraft below about 1000 feet
      var airportElevation = airport_get().elevation;
      if (((this.aircraft[0].altitude - airportElevation) < 990) ||
          ((this.aircraft[1].altitude - airportElevation) < 990))
        return;

      // Ignore aircraft in the first minute of their flight
      if ((game_time() - this.aircraft[0].takeoffTime < 60) ||
          (game_time() - this.aircraft[0].takeoffTime < 60)) {
        return;
      }

      this.checkProximity();
    },

    /**
     * Remove conflict for both aircraft
     */
    remove: function() {
      this.aircraft[0].removeConflict(this.aircraft[1]);
      this.aircraft[1].removeConflict(this.aircraft[0]);
    },

    /**
     * Check for collision
     */
    checkCollision: function() {
      if(this.aircraft[0].isLanded() || this.aircraft[1].isLanded()) return;  // TEMPORARY FIX FOR CRASHES BTWN ARRIVALS AND TAXIIED A/C
      // Collide within 160 feet
      if (((this.distance < 0.05) && (this.altitude < 160)) &&
          (this.aircraft[0].isVisible() && this.aircraft[1].isVisible()))
      {
        this.collided = true;
        ui_log(true,
               this.aircraft[0].getCallsign() + " collided with "
               + this.aircraft[1].getCallsign());
        prop.game.score.hit += 1;
        this.aircraft[0].hit = true;
        this.aircraft[1].hit = true;

        // If either are in runway queue, remove them from it
        for(var i in airport_get().runways) {
          var rwy = airport_get().runways[i];

          // Primary End of Runway
          rwy[0].removeQueue(this.aircraft[0], true);
          rwy[0].removeQueue(this.aircraft[1], true);

          // Secondary End of Runway
          rwy[1].removeQueue(this.aircraft[0], true);
          rwy[1].removeQueue(this.aircraft[1], true);
        }
      }
    },

    /**
     * Check for a potential head-on collision on a runway
     */
    checkRunwayCollision: function() {
      // Check if the aircraft are on a potential collision course
      // on the runway
      var airport = airport_get();

      // Check for the same runway, different ends and under about 6 miles
      if ((!this.aircraft[0].isTaxiing() && !this.aircraft[1].isTaxiing()) &&
          (this.aircraft[0].rwy_dep != null) &&
          (this.aircraft[0].rwy_dep !=
           this.aircraft[1].rwy_dep) &&
          (airport.getRunway(this.aircraft[1].rwy_dep) ===
           airport.getRunway(this.aircraft[0].rwy_dep)) &&
          (this.distance < 10))
      {
        if (!this.conflicts.runwayCollision) {
          this.conflicts.runwayCollision = true;
          ui_log(true, this.aircraft[0].getCallsign()
                 + " appears on a collision course with "
                 + this.aircraft[1].getCallsign()
                 + " on the same runway");
          prop.game.score.warning += 1;
        }
      }
      else {
        this.conflicts.runwayCollision = false;
      }
    },

    /**
     * Check for physical proximity and trigger crashes if necessary
     */
    checkProximity: function() {
      // No conflict or warning if vertical separation is present
      if (this.altitude >= 1000) {
        this.conflicts.proximityConflict = false;
        this.conflicts.proximityViolation = false;
        return;
      }

      var conflict = false;
      var violation = false;
      var disableNotices = false;
      var a1 = this.aircraft[0], a2 = this.aircraft[1];


      // Standard Basic Lateral Separation Minimum
      var applicableLatSepMin = 5.556;  // 3.0nm


      // Established on precision guided approaches
      if ( (a1.isPrecisionGuided() && a2.isPrecisionGuided()) &&
           (a1.rwy_arr != a2.rwy_arr)) { // both are following different instrument approaches
        var runwayRelationship = airport_get().metadata.rwy[a1.rwy_arr][a2.rwy_arr];
        if (runwayRelationship.parallel) {
          // Determine applicable lateral separation minima for conducting
          // parallel simultaneous dependent approaches on these runways:
          disableNotices = true;  // hide notices for aircraft on adjacent final approach courses
          var feetBetween = km_ft(runwayRelationship.lateral_dist);
          if(feetBetween < 2500)  // Runways separated by <2500'
            var applicableLatSepMin = 5.556;  // 3.0nm
          else if(2500 <= feetBetween && feetBetween <= 3600) // 2500'-3600'
            var applicableLatSepMin = 1.852;  // 1.0nm
          else if(3600 <  feetBetween && feetBetween <= 4300) // 3600'-4300'
            var applicableLatSepMin = 2.778;  // 1.5nm
          else if(4300 <  feetBetween && feetBetween <= 9000) // 4300'-9000'
            var applicableLatSepMin = 3.704;  // 2.0nm
          else if(feetBetween > 9000) // Runways separated by >9000'
            var applicableLatSepMin = 5.556;  // 3.0nm
          // Note: The above does not take into account the (more complicated)
          // rules for dual/triple simultaneous parallel dependent approaches as
          // outlined by FAA JO 7110.65, para 5-9-7. Users playing at any of our
          // airports that have triple parallels may be able to "get away with"
          // the less restrictive rules, whilst their traffic may not be 100%
          // legal. It's just complicated and not currently worthwhile to add
          // rules for running trips at this point... maybe later. -@erikquinn
          // Reference: FAA JO 7110.65, section 5-9-6
        }
      }


      // Considering all of the above cases,...
      violation = (this.distance < applicableLatSepMin);
      conflict  = (this.distance < applicableLatSepMin + 1.852 && !disableNotices) || violation;  // +1.0nm


      // "Passing & Diverging" Rules (the "exception" to all of the above rules)
      if(conflict) { // test the below only if separation is currently considered insufficient
        var hdg_difference = abs(angle_offset(a1.groundTrack, a2.groundTrack));
        if (hdg_difference >= radians(15)) {
          if (hdg_difference > radians(165)) {  // 'opposite' courses
            if (this.distance_delta > 0) {  // OKAY IF the distance is increasing
              conflict = false;
              violation = false;
            }
          }
          else {  // 'same' or 'crossing' courses
            // Ray intersection from http://stackoverflow.com/a/2932601
            var ad = vturn(a1.groundTrack);
            var bd = vturn(a2.groundTrack);
            var dx = a2.position[0] - a1.position[0];
            var dy = a2.position[1] - a1.position[1];
            var det = bd[0] * ad[1] - bd[1] * ad[0];
            var u = (dy * bd[0] - dx * bd[1]) / det;  // a1's distance from point of convergence
            var v = (dy * ad[0] - dx * ad[1]) / det;  // a2's distance from point of convergence
            if ((u < 0) || (v < 0)) { // check if either a/c has passed the point of convergence
              conflict  = false;  // targets are diverging
              violation = false;  // targets are diverging
            }
            // Reference: FAA JO 7110.65, section 5-5-7-a-1:
            // (a) Aircraft are on opposite/reciprocal courses and you have observed
            // that they have passed each other; or aircraft are on same or crossing
            // courses/assigned radar vectors and one aircraft has crossed the
            // projected course of the other, and the angular difference between
            // their courses/assigned radar vectors is at least 15 degrees.
          }
        }
      }

      // Update Conflicts
      if (conflict) this.conflicts.proximityConflict = true;
      else this.conflicts.proximityConflict = false;
      if (violation) this.violations.proximityViolation = true;
      else this.violations.proximityViolation = false;
    }
  };
});

/**
 * Definitions for characteristics of a particular aircraft type
 *
 * @class Model
 */
var Model = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.loading = true;
      this.loaded = false;
      this.priorityLoad = false;

      this.name = null;
      this.icao = null;

      this.engines = null;
      this.weightclass = null;
      this.category = null;

      this.rate = {
        turn:       0, // radians per second
        climb:      0, // feet per second
        descent:    0,
        accelerate: 0, // knots per second
        decelerate: 0,
      };

      this.runway = {
        takeoff: 0, // km needed to takeoff
        landing: 0,
      };

      this.speed = {
        min:     0,
        max:     0,
        landing: 0,
        cruise:  0
      };

      this._pendingAircraft = [];

      this.parse(options);

      if(options.url) this.load(options.url);

    },
    parse: function(data) {
      if(data.name) this.name = data.name;
      if(data.icao) this.icao = data.icao;

      if(data.engines) this.engines = data.engines;
      if(data.weightclass) this.weightclass = data.weightclass;
      if(data.category) this.category = data.category;
      if(data.ceiling) this.ceiling = data.ceiling;
      if(data.rate) {
        this.rate         = data.rate;
        this.rate.climb  = this.rate.climb;
        this.rate.descent = this.rate.descent;
      }

      if(data.runway) this.runway = data.runway;

      if(data.speed) this.speed = data.speed;
    },
    load: function(url) {
      this._url = url;
      zlsa.atc.loadAsset({url: url,
                          immediate: false})
        .done(function (data) {
          this.parse(data);
          this.loading = false;
          this.loaded = true;
          this._generatePendingAircraft();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          this._pendingAircraft = [];
          console.error("Unable to load aircraft/" + this.icao
                        + ": " + textStatus);
        }.bind(this));
    },

    /**
     * Generate a new aircraft of this model
     *
     * Handles the case where this model may be asynchronously loaded
     */
    generateAircraft: function(options) {
      if (!this.loaded) {
        if (this.loading) {
          this._pendingAircraft.push(options);
          if (!this.priorityLoad) {
            zlsa.atc.loadAsset({url: this._url,
                                immediate: true});
            this.priorityLoad = true;
          }
          return true;
        }
        else {
          console.warn("Unable to spawn aircraft/" + options.icao
                       + " as loading failed");
          return false;
        }
      }
      return this._generateAircraft(options);
    },

    /**
     * Actual implementation of generateAircraft
     */
    _generateAircraft: function(options) {
      options.model = this;
      var aircraft = new Aircraft(options);
      prop.aircraft.list.push(aircraft);
      console.log("Spawning " + options.category + " : " + aircraft.getCallsign());
      return true;
    },

    /**
     * Generate aircraft which were queued while the model loaded
     */
    _generatePendingAircraft: function() {
      $.each(this._pendingAircraft, function (idx, options) {
        this._generateAircraft(options);
      }.bind(this));
      this._pendingAircraft = null;
    },
  };
});

/** Build a waypoint object
 ** Note that .prependLeg() or .appendLeg() or .insertLeg()
 ** should be called in order to add waypoints to the fms, based on which
 ** you want. This function serves only to build the waypoint object; it is
 ** placed by one of the other three functions.
 */
window.zlsa.atc.Waypoint = Fiber.extend(function(data, fms) {
  return {
    /** Initialize Waypoint with empty values, then call the parser
     */
    init: function(data, fms) {
      if(data === undefined) data = {};
      this.altitude = null;
      this.fix      = null;
      this.navmode  = null;
      this.heading  = null;
      this.turn     = null;
      this.location = null;
      this.expedite = false;
      this.speed    = null;
      this.hold     = {
        dirTurns  : null,
        fixName   : null,
        fixPos    : null,
        inboundHdg: null,
        legLength : null,
        timer     : 0
      };
      this.fixRestrictions = {
        alt: null,
        spd: null
      };
      this.parse(data, fms);
    },

    /** Parse input data and apply to this waypoint
     */
    parse: function(data, fms) {
      // Populate Waypoint with data
      if (data.fix) {
        this.navmode = 'fix';
        this.fix = data.fix;
        this.location = airport_get().getFix(data.fix);
      }
      for (var f in data) {
        if(this.hasOwnProperty(f)) this[f] = data[f];
      }
      if(!this.navmode) { // for aircraft that don't yet have proper guidance (eg SID/STAR, for example)
        this.navmode = "heading";
        var apt = airport_get();
        if(data.route.split('.')[0] == apt.icao && this.heading == null) {
          this.heading = apt.getRunway(apt.runway).angle;  // aim departure along runway heading
        }
        else if(data.route.split('.')[0] == "KDBG" && this.heading == null) {
          this.heading = this.radial + Math.PI;  // aim arrival @ middle of airspace
        }
      }
    }
  };
});

/** Build a 'leg' of the route (contains series of waypoints)
 ** @param {object} data = {route: "KSFO.OFFSH9.SXC", // either a fix, or with format 'start.procedure.end', or "[RNAV/GPS]" for custom positions
 **                         type: "sid",              // can be 'sid', 'star', 'iap', 'awy', 'fix'
 **                         firstIndex: 0}            // the position in fms.legs to insert this leg
 */
window.zlsa.atc.Leg = Fiber.extend(function(data, fms) {
  return {
    /** Initialize leg with empty values, then call the parser
     */
    init: function(data, fms) {
      if(data === undefined) data = {};
      this.route         = "[radar vectors]"; // eg 'KSFO.OFFSH9.SXC' or 'FAITH'
      this.type          = "[manual]";        // can be 'sid', 'star', 'iap', 'awy', 'fix', '[manual]'
      this.waypoints     = [];                // an array of zlsa.atc.Waypoint objects to follow

      // Fill data with default Leg properties if they aren't specified (prevents wp constructor from getting confused)
      if(!data.route) data.route = this.route;
      if(!data.type) data.type = this.type;
      if(!data.waypoints) data.waypoints = this.waypoints;

      this.parse(data, fms);
    },

    /** Parse input data and apply to this leg
     */
    parse: function(data, fms) {
      for(var i in data) if(this.hasOwnProperty(i)) this[i] = data[i]; // Populate Leg with data
      if(this.waypoints.length == 0) this.generateWaypoints(data, fms);
      if(this.waypoints.length == 0) this.waypoints = [new zlsa.atc.Waypoint({route:""}, fms)];
    },

    /** Adds zlsa.atc.Waypoint objects to this Leg, based on the route & type
     */
    generateWaypoints: function(data, fms) {
      if(!this.type) return;
      else if(this.type == "sid") {
        if(!fms) {
          log("Attempted to generate waypoints for SID, but cannot because fms ref not passed!", LOG_WARNING);
          return;
        }
        var apt = data.route.split('.')[0];
        var sid = data.route.split('.')[1];
        var exit = data.route.split('.')[2];
        var rwy = fms.my_aircraft.rwy_dep;
        this.waypoints = [];

        // Generate the waypoints
        if(!rwy) {
          ui_log(true, fms.my_aircraft.getCallsign() + " unable to fly SID, we haven't been assigned a departure runway!");
          return;
        }
        var pairs = airport_get(apt).getSID(sid, exit, rwy);
        // Remove the placeholder leg (if present)
        if(fms.my_aircraft.isLanded() && fms.legs.length>0
            && fms.legs[0].route == airport_get().icao && pairs.length>0) {
          fms.legs.splice(0,1); // remove the placeholder leg, to be replaced below with SID Leg
        }
        for (var i=0; i<pairs.length; i++) { // for each fix/restr pair
          var f = pairs[i][0];
          var a = null, s = null;
          if(pairs[i][1]) {
            var a_n_s = pairs[i][1].toUpperCase().split("|");
            for(var j in a_n_s) {
              if(a_n_s[j][0] == "A") a = a_n_s[j].substr(1);
              else if(a_n_s[j][0] == "S") s = a_n_s[j].substr(1);
            }
          }
          this.waypoints.push(new zlsa.atc.Waypoint({fix:f, fixRestrictions:{alt:a,spd:s}}, fms));
        }
        if(!this.waypoints[0].speed) this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
      }
      else if(this.type == "star") {
        if(!fms) {
          log("Attempted to generate waypoints for STAR, but cannot because fms ref not passed!", LOG_WARNING);
          return;
        }
        var entry = data.route.split('.')[0];
        var star = data.route.split('.')[1];
        var apt = data.route.split('.')[2];
        var rwy = fms.my_aircraft.rwy_arr;
        this.waypoints = [];

        // Generate the waypoints
        var pairs = airport_get(apt).getSTAR(star, entry, rwy);
        for (var i=0; i<pairs.length; i++) { // for each fix/restr pair
          var f = pairs[i][0];
          var a = null, s = null;
          if(pairs[i][1]) {
            var a_n_s = pairs[i][1].toUpperCase().split("|");
            for(var j in a_n_s) {
              if(a_n_s[j][0] == "A") a = a_n_s[j].substr(1);
              else if(a_n_s[j][0] == "S") s = a_n_s[j].substr(1);
            }
          }
          this.waypoints.push(new zlsa.atc.Waypoint({fix:f, fixRestrictions:{alt:a,spd:s}}, fms));
        }
        if(!this.waypoints[0].speed)
          this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
      }
      else if(this.type == "iap") {
        // FUTURE FUNCTIONALITY
      }
      else if(this.type == "awy") {
        var start  = data.route.split('.')[0];
        var airway = data.route.split('.')[1];
        var end    = data.route.split('.')[2];

        // Verify airway is valid
        var apt = airport_get();
        if(!apt.hasOwnProperty("airways") || !apt.airways.hasOwnProperty(airway)) {
          log("Airway "+airway+" not defined at "+apt.icao, LOG_WARNING);
          return;
        }

        // Verify start/end points are along airway
        var awy = apt.airways[airway];
        if(!(awy.indexOf(start) != -1 && awy.indexOf(end) != -1)) {
          log("Unable to follow "+airway+" from "+start+" to "+end, LOG_WARNING);
          return;
        }

        // Build list of fixes, depending on direction traveling along airway
        var fixes = [], readFwd = (awy.indexOf(end) > awy.indexOf(start));
        if(readFwd) for(var f=awy.indexOf(start); f<=awy.indexOf(end); f++) fixes.push(awy[f]);
        else for(var f=awy.indexOf(start); f>=awy.indexOf(end); f--) fixes.push(awy[f]);

        // Add list of fixes to this.waypoints
        this.waypoints = [];
        this.waypoints = $.map(fixes, function(f){return new zlsa.atc.Waypoint({fix:f}, fms);});
      }
      else if(this.type == "fix") {
        this.waypoints = [];
        this.waypoints.push(new zlsa.atc.Waypoint({fix:data.route}, fms));
      }
      else this.waypoints.push(new zlsa.atc.Waypoint(data, fms));
    }
  };
});

/** Manage current and future aircraft waypoints
 **
 ** waypoint navmodes
 ** -----------------
 ** May be one of null, "fix", "heading", "hold", "rwy"
 **
 ** * null is assigned, if the plane is not actively following an
 **   objective. This is only the case, if a plane enters the airspace
 **   or an action has been aborted and no new command issued
 ** * "fix" is assigned, if the plane is heading for a fix. In this
 **    case, the attribute request.fix is used for navigation
 ** * "heading" is assigned, if the plane was given directive to follow
 **    the course set out by the given heading. In this case, the
 **    attributes request.heading and request.turn are used for
 **    navigation
 ** * "hold" is assigned, if the plane should hold its position. As
 **    this is archieved by continuously turning, request.turn is used
 **    in this case
 ** * "rwy" is assigned, if the plane is heading for a runway. This is
 **    only the case, if the plane was issued the command to land. In
 **    this case, request.runway is used
 */
window.zlsa.atc.AircraftFlightManagementSystem = Fiber.extend(function() {
  return {
    init: function(options) {
      this.my_aircrafts_eid = options.aircraft.eid;
      this.my_aircraft = options.aircraft;
      this.legs = [];
      this.current = [0,0]; // [current_Leg, current_Waypoint_within_that_Leg]
      this.fp = { altitude: null, route: [] };
      this.following = {
        sid:  null,   // Standard Instrument Departure Procedure
        star: null,   // Standard Terminal Arrival Route Procedure
        iap:  null,   // Instrument Approach Procedure (like ILS, GPS, RNAV, VOR-A, etc)
        awy:  null,   // Airway (V, J, T, Q, etc.)
        tfc:  null,   // Traffic (another airplane)
        anything:  false   // T/F flag for if anything is being "followed"
      };

      // set initial
      this.fp.altitude = clamp(1000, options.model.ceiling, 60000);
      if(options.aircraft.category == "arrival")
        this.prependLeg({route:"KDBG"});
      else if(options.aircraft.category == "departure")
        this.prependLeg({route:airport_get().icao});
      this.update_fp_route();
    },

    /******************* FMS FLIGHTPLAN CONTROL FUNCTIONS *******************/

    /** Insert a Leg at the front of the flightplan
     */
    prependLeg: function (data) {
      var prev = this.currentWaypoint();
      this.legs.unshift(new zlsa.atc.Leg(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a waypoint at current position and immediately activate it
     */
    insertWaypointHere: function(data) {
      var prev = this.currentWaypoint();
      this.currentLeg().waypoints.splice(this.current[1], 0, new zlsa.atc.Waypoint(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a Leg at a particular position in the flightplan
     ** Note: if no position passed in, defaults to add to the end
     */
    insertLeg: function(data) {
      if(data.firstIndex == null) data.firstIndex = this.legs.length;
      var prev = this.currentWaypoint();
      this.legs.splice(data.firstIndex, 0, new zlsa.atc.Leg(data, this));
      this.update_fp_route();

      // Adjust 'current'
      if(this.current[0] >= data.firstIndex) this.current[1] = 0;

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a Leg at current position immediately activate it
     */
    insertLegHere: function(data) {
      data.firstIndex = this.current[0];  // index of current leg
      this.insertLeg(data); // put new Leg at current position
      this.current[1] = 0;  // start at first wp in this new leg
    },

    /** Insert a Leg at the end of the flightplan
     */
    appendLeg: function(data) {
      this.legs.push(new zlsa.atc.Leg(data, this));
      this.update_fp_route();
    },

    /** Insert a waypoint after the *current* waypoint
     */
    appendWaypoint: function(data) {
      this.currentLeg().waypoints.splice(this.current[1]+1, 0, new zlsa.atc.Waypoint(data, this));
      this.update_fp_route();
    },

    /** Switch to the next waypoint
     */
    nextWaypoint: function() {
      var prev = this.currentWaypoint();
      var leg = this.current[0];
      var wp = this.current[1];
      if(wp+1 < this.legs[leg].waypoints.length) {
        this.current[1]++;  // look to next waypoint in current leg
      }
      else if(leg+1 < this.legs.length) {
        this.current[0]++;  // look to the next leg
        this.current[1]=0;  // look to the first waypoint of that leg
      }

      // Replace null values with current values
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
      if(!curr.heading && curr.navmode == "heading") curr.heading = prev.heading;
    },

    /** Switch to the next Leg
     */
    nextLeg: function() {
      var prev = this.currentWaypoint();
      this.current[0]++;
      this.current[1] = 0;

      // Replace null values with current values
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
      if(!curr.heading && curr.navmode == "heading") curr.heading = prev.heading;
    },

    /** Skips to the given waypoint
     ** @param {string} name - the name of the fix to skip to
     */
    skipToFix: function(name) {
      var prev = this.currentWaypoint();
      for(var l=0; l<this.legs.length; l++) {
        for(var w=0; w<this.legs[l].waypoints.length; w++) {
          if(this.legs[l].waypoints[w].fix == name) {
            this.current = [l,w];

            // Verify altitude & speed not null
            var curr = this.currentWaypoint();
            if(prev && !curr.altitude) curr.altitude = prev.altitude;
            if(prev && !curr.speed) curr.speed = prev.speed;

            return true;
          }
        }
      }
      return false;
    },

    /** Modify all waypoints
     */
    setAll: function(data) {
      for (var i=0; i<this.legs.length; i++) {
        for(var j=0; j<this.legs[i].waypoints.length; j++) {
          for (var k in data) {
            this.legs[i].waypoints[j][k] = data[k];
          }
        }
      }
    },

    /** Modify the current waypoint
     */
    setCurrent: function(data) {
      for (var i in data) {
        this.currentWaypoint()[i] = data[i];
      }
    },

    /** Updates fms.fp.route to correspond with the fms Legs
     */
    update_fp_route: function() {
      var r = [];
      for(var l in this.legs) {
        if(!this.legs[l].type) continue;
        else if(this.legs[l].type == "sid") {
          r.push(this.legs[l].route.split('.')[0]); // departure airport
          r.push(this.legs[l].route.split('.')[1] + '.' + this.legs[l].route.split('.')[2]);  // 'sidname.exitPoint'
        }
        else if(this.legs[l].type == "star") {
          r.push(this.legs[l].route.split('.')[0] + '.' + this.legs[l].route.split('.')[1]);  // 'entryPoint.starname.exitPoint'
          r.push(this.legs[l].route.split('.')[2]); // arrival airport
        }
        else if(this.legs[l].type == "iap") {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
        else if(this.legs[l].type == "awy") {
          if(r[r.length-1] != this.legs[l].route.split('.')[0])
            r.push(this.legs[l].route.split('.')[0]); // airway entry fix
          r.push(this.legs[l].route.split('.')[1]); // airway identifier
          r.push(this.legs[l].route.split('.')[2]); // airway exit fix
        }
        else if(this.legs[l].type == "fix") {
          r.push(this.legs[l].route);
        }
        else if(this.legs[l].type == "[manual]") {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
      }
      if(r.length == 0) r.push(this.legs[0].route);
      this.fp.route = r;
    },

    /** Calls various task-based functions and sets 'fms.following' flags
     */
    followCheck: function() {
      var leg = this.currentLeg();
      if(leg.type == "sid") {
        this.following.anything = true;
        this.following.sid = leg.route.split('.')[1];
      }
      else if(leg.type == "star") {
        this.following.anything = true;
        this.following.star = leg.route.split('.')[1];
      }
      else if(leg.type == "iap") {
        this.following.anything = true;
        // this.following.iap = ;  // *******NEEDS TO BE FINISHED***************************
      }
      else if(leg.type == "tfc") {    // **FUTURE FUNCTIONALITY**
        // this.following.anything = true;
        // this.following.tfc = // EID of the traffic we're following
      }
      else if(leg.type == "awy") { // **FUTURE FUNCTIONALITY**
        this.following.anything = true;
        this.following.awy = leg.route.split('.')[1];
      }
      else {
        this.followClear();
        return false;
      }
      return this.following;
    },

    /** Clears any current follows by updating the 'fms.following' flags
     */
    followClear: function() {
      this.following = {
        sid:  null,
        star: null,
        iap:  null,
        awy:  null,
        tfc:  null,
        anything: false
      };
    },

    /** Join an instrument approach (eg. ILS/GPS/RNAV/VOR/LAAS/etc)
     ** @param {string} type - the type of approach (like "ils")
     ** @param {Runway} rwy - the Runway object the approach ends into
     ** @param {string} variant - (optional) for stuff like "RNAV-Z 17L"
     */
    followApproach: function(type, rwy, /*optional*/ variant) {
      // Note: 'variant' is set up to pass to this function, but is not used here yet.
      if(type == "ils") {
        this.my_aircraft.cancelFix();
        this.setCurrent({
          navmode: "rwy",
          runway: rwy.toUpperCase(),
          turn: null,
          start_speed: this.my_aircraft.speed,
        });
      }
      // if-else all the other approach types here...
      // ILS, GPS, RNAV, VOR, NDB, LAAS/WAAS, MLS, etc...
    },

    /** Inserts the SID as the first Leg in the fms's flightplan
     */
    followSID: function(route) {
      for(var i=0; i<this.legs.length; i++) {
        if(this.legs[i].route == airport_get().icao)  // sid assigned after taking off without SID
          this.legs.splice(i,1);  // remove the manual departure leg
        else if(this.legs[i].type == "sid") // check to see if SID already assigned
          this.legs.splice(i,1);  // remove the old SID
      }
      // Add the new SID Leg
      this.prependLeg({type:"sid", route:route})
      this.setAll({altitude:Math.max(airport_get().initial_alt,this.my_aircraft.altitude)});
    },

    /** Inserts the STAR as the last Leg in the fms's flightplan
     */
    followSTAR: function(route) {
      for(var i=0; i<this.legs.length; i++) {
        if(this.legs[i].type == "star") // check to see if STAR already assigned
          this.legs.splice(i,1);  // remove the old STAR
      }
      // Add the new STAR Leg
      this.appendLeg({type:"star", route:route})
    },

    /** Takes a single-string route and converts it to a semented route the fms can understand
     ** Note: Input Data Format : "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
     **       Return Data Format: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     */
    formatRoute: function(data) {
      // Format the user's input
      var route = [], ap = airport_get, fixOK = ap().getFix;
      if(data.indexOf(" ") != -1) return; // input can't contain spaces
      data = data.split('..'); // split apart "direct" pieces
      for(var i=0; i<data.length; i++) {  // deal with multilinks (eg 'KSFO.OFFSH9.SXC.V458.IPL')
        if(data[i].split('.').length == 1) {
          if(!fixOK(data[i])) return;
          route.push(data[i]); // just a fix/navaid
          continue;
        }
        else {  // is a procedure, eg SID, STAR, IAP, airway, etc.
          if(data[i].split('.').length % 2 != 1) return;  // user either didn't specify start point or end point
          else {
            var pieces = data[i].split('.');
            var a = [pieces[0] + '.' + pieces[1] + '.' + pieces[2]];
            for(var j=3; j<data[i].split('.').length; j+2) { // chop up the multilink
              if(!fixOK(pieces[0]) || !fixOK(pieces[2])) return;  // invalid join/exit points
              if(!Object.keys(ap().sids).indexOf(pieces[1])
                || !Object.keys(ap().airways).indexOf(pieces[1])) return; // invalid procedure
              a.push(pieces[j-1] + '.' + pieces[j] + pieces[j+1]);
            }
          }
        }
        route = route.concat(a);  // push the properly reformatted multilink
      }
      return route;
    },

    /** Take an array of leg routes and build the legs that will go into the fms
     ** @param {array} route - an array of properly formatted route strings
     **                        Example: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL",
     **                                 "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     ** @param {boolean} fullRouteClearance - set to true IF you want the provided route to completely
     **                                       replace the current contents of 'this.legs'
     */
    customRoute: function(route, fullRouteClearance) {
      var legs = [];
      var curr = this.currentWaypoint(); // save the current waypoint
      for(var i=0; i<route.length; i++) {
        if(route[i].split('.').length == 1) { // just a fix/navaid
          legs.push(new zlsa.atc.Leg({type:"fix", route:route[i]}, this));
        }
        else if(route[i].split('.').length == 3) {  // is an instrument procedure
          var pieces = route[i].split('.');
          if(Object.keys(airport_get().sids).indexOf(pieces[1]) > -1) {  // it's a SID!
            legs.push(new zlsa.atc.Leg({type:"sid", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().stars).indexOf(pieces[1]) > -1) { // it's a STAR!
            legs.push(new zlsa.atc.Leg({type:"star", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().airways).indexOf(pieces[1]) > -1) { // it's an airway!
            legs.push(new zlsa.atc.Leg({type:"awy", route:route[i]}, this));
          }
        }
        else {  // neither formatted like "JAN" nor "JAN.V18.MLU"
          log("Passed invalid route to fms. Unable to create leg from input:" + route[i], LOG_WARNING);
          return false;
        }
      }

      if(!fullRouteClearance) { // insert user's route to the legs
        // Check if user's route hooks up to the current Legs anywhere
        var pieces = legs[legs.length-1].route.split('.');
        var last_fix = pieces[pieces.length-1];
        var continuity = this.indexOfWaypoint(last_fix);
        if(continuity) {  // user route connects with existing legs
          var inMiddleOfLeg = continuity.lw[1] != this.legs[continuity.lw[0]].waypoints.length-1;
          var legsToRemove = Math.max(0,continuity.lw[0]-inMiddleOfLeg - this.current[0]);
          if(inMiddleOfLeg) { // change the existing leg @ merge point
            this.legs[continuity.lw[0]].waypoints.splice(0, continuity.lw[1]);  // Remove the waypoints before the merge point
            var r = this.legs[continuity.lw[0]].route.split('.');
            this.legs[continuity.lw[0]].route = last_fix + '.' + r[1] + '.' + r[2]; // Update the leg's route to reflect the change
          }
          this.legs.splice.apply(this.legs, [Math.max(0,continuity.lw[0]-legsToRemove), legsToRemove].concat(legs)); // remove old legs before the point where the two routes join
          // move to the newly inserted Leg
          this.current[0] = Math.max(0,continuity.lw[0]-legsToRemove);
          this.current[1] = 0;
        }
        else {  // no route continuity... just adding legs
          this.legs.splice.apply(this.legs, [this.current[0]+1, 0].concat(legs));  // insert the legs after the active Leg
          this.nextLeg();
        }
      }
      else {  // replace all legs with the legs we've built here in this function
        this.legs = legs;
        this.current = [0,0]; // look to beginning of route
      }
      this.update_fp_route();

      // Maintain old speed and altitude
      if(this.currentWaypoint().altitude == null) this.setCurrent({altitude: curr.altitude});
      if(this.currentWaypoint().speed == null) this.setCurrent({speed:curr.speed});

      return true;
    },

    /** Invokes flySID() for the SID in the flightplan (fms.fp.route)
     */
    clearedAsFiled: function() {
      var retval = this.my_aircraft.runSID([aircraft_get(this.my_aircrafts_eid).destination]);
      var ok = !(Array.isArray(retval) && retval[0]=="fail");
      return ok;
    },

    /** Climbs aircraft in compliance with the SID they're following
     ** Adds altitudes and speeds to each waypoint that are as high as
     ** possible without exceeding any the following:
     **    - (alt) airspace ceiling ('ctr_ceiling')
     **    - (alt) filed cruise altitude
     **    - (alt) waypoint's altitude restriciton
     **    - (spd) 250kts when under 10k ft
     **    - (spd) waypoint's speed restriction
     */
    climbViaSID: function() {
      if(!this.currentLeg().type == "sid") return;
      var wp = this.currentLeg().waypoints;
      var cruise_alt = this.fp.altitude;
      var cruise_spd = this.my_aircraft.model.speed.cruise;

      for(var i=0; i<wp.length; i++) {
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if(a) {
          if(a.indexOf("+") != -1) {  // at-or-above altitude restriction
            var minAlt = parseInt(a.replace("+","")) * 100;
            var alt = Math.min(airport_get().ctr_ceiling, cruise_alt);
          }
          else if(a.indexOf("-") != -1) {
            var maxAlt = parseInt(a.replace("-","")) * 100;
            var alt = Math.min(maxAlt, cruise_alt) // climb as high as restrictions permit
          }
          else var alt = parseInt(a) * 100; // cross AT this altitude
        }
        else var alt = Math.min(airport_get().ctr_ceiling, cruise_alt);
        wp[i].altitude = alt; // add altitudes to wp

        // Speed Control
        if(s) {
          if(s.indexOf("+") != -1) {  // at-or-above speed restriction
            var minSpd = parseInt(s.replace("+",""));
            var spd = Math.min(minSpd, cruise_spd);
          }
          else if(s.indexOf("-") != -1) {
            var maxSpd = parseInt(s.replace("-",""));
            var spd = Math.min(maxSpd, cruise_spd) // go as fast as restrictions permit
          }
          else var spd = parseInt(s); // cross AT this speed
        }
        else var spd = cruise_spd;
        wp[i].speed = spd;  // add speeds to wp
      }

      // change fms waypoints to wp (which contains the altitudes and speeds)
      this.legs[this.current[0]].waypoints = wp;
      return true;
    },

    /** Descends aircraft in compliance with the STAR they're following
     ** Adds altitudes and speeds to each waypoint in accordance with the STAR
     */
    descendViaSTAR: function() {
      // Find the STAR leg
      var wp, legIndex;
      for(var l in this.legs) {
        if(this.legs[l].type == "star") {
          legIndex = l;
          wp = this.legs[l].waypoints; break;
        }
      }
      if(!wp) return;

      var start_alt = this.currentWaypoint().altitude || this.my_aircraft.altitude;
      var start_spd = this.currentWaypoint().speed || this.my_aircraft.model.speed.cruise;

      for(var i=0; i<wp.length; i++) {
        if(i >= 1) {
          start_alt = wp[i-1].altitude;
          start_spd = wp[i-1].speed;
        }
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if(a) {
          if(a.indexOf("+") != -1) {  // at-or-above altitude restriction
            var minAlt = parseInt(a.replace("+","")) * 100;
            var alt = Math.max(minAlt, start_alt);
          }
          else if(a.indexOf("-") != -1) {
            var maxAlt = parseInt(a.replace("-","")) * 100;
            var alt = Math.min(maxAlt, start_alt) // climb as high as restrictions permit
          }
          else var alt = parseInt(a) * 100; // cross AT this altitude
        }
        else var alt = start_alt;
        wp[i].altitude = alt; // add altitudes to wp

        // Speed Control
        if(s) {
          if(s.indexOf("+") != -1) {  // at-or-above speed restriction
            var minSpd = parseInt(s.replace("+",""));
            var spd = Math.min(minSpd, start_spd);
          }
          else if(s.indexOf("-") != -1) {
            var maxSpd = parseInt(s.replace("-",""));
            var spd = Math.min(maxSpd, start_spd) // go as fast as restrictions permit
          }
          else var spd = parseInt(s); // cross AT this speed
        }
        else var spd = start_spd;
        wp[i].speed = spd;  // add speeds to wp
      }

      // change fms waypoints to wp (which contains the altitudes and speeds)
      this.legs[legIndex].waypoints = wp;
      return true;
    },


    /************************** FMS QUERY FUNCTIONS **************************/

    /** True if waypoint of the given name exists
     */
    hasWaypoint: function(name) {
      for(var i=0; i<this.legs.length; i++) {
        for(var j=0; j<this.legs[i].waypoints.length; j++) {
          if (this.legs[i].waypoints[j].fix == name) return true;
        }
      }
      return false;
    },

    /** Returns object's position in flightplan as object with 2 formats
     ** @param {string} fix - name of the fix to look for in the flightplan
     ** @returns {wp: "position-of-fix-in-waypoint-list",
     **           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfWaypoint: function(fix) {
      var wp = 0;
      for(var l=0; l<this.legs.length; l++) {
        for(var w=0; w<this.legs[l].waypoints.length; w++) {
          if(this.legs[l].waypoints[w].fix == fix) {
            return {wp:wp, lw:[l,w]};
          }
          else {
            wp++;
          }
        }
      }
      return false;
    },

    /** Returns currentWaypoint's position in flightplan as object with 2 formats
     ** @returns {wp: "position-of-fix-in-waypoint-list",
     **           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfCurrentWaypoint: function() {
      var wp = 0;
      for(var i=0; i<this.current[0]; i++) wp += this.legs[i].waypoints.length;  // add wp's of completed legs
      wp += this.current[1];

      return {wp:wp, lw:this.current};
    },


    /*************************** FMS GET FUNCTIONS ***************************/

    /** Return the current leg
     */
    currentLeg: function() {
      return this.legs[this.current[0]];
    },

    /** Return the current waypoint
     */
    currentWaypoint: function() {
      if(this.legs.length < 1) return null;
      else return this.legs[this.current[0]].waypoints[this.current[1]];
    },

    /** Returns an array of all fixes along the flightplan route
     */
    fixes: function() {
      return $.map(this.waypoints(),function(w){return w.fix;});
    },

    /** Return this fms's parent aircraft
     */
    my_aircraft: function() {
      return aircraft_get(this.my_aircrafts_eid);
    },

    /** Returns a waypoint at the provided position
     ** @param {array or number} pos - position of the desired waypoint. May be
     **                          provided either as an array showing the leg and
     **                          waypoint within the leg (eg [l,w]), or as the
     **                          number representing the position of the desired
     **                          waypoint in the list of all waypoints (running
     **                          this.waypoints() will return the list)
     ** @returns {Waypoint} - the Waypoint object at the specified location
     */
    waypoint: function(pos) {
      if(Array.isArray(pos)) {  // input is like [leg,waypointWithinLeg]
        return this.legs[pos[0]].waypoints[pos[1]];
      }
      else if(typeof pos == "number") { // input is a position of wp in list of all waypoints
        var l = 0;
        while(pos >= 0) {  // count up to pos to locate the waypoint
          if(this.legs[l].waypoints.length <= pos) {
            pos -= this.legs[l].waypoints.length;
            l++;
          }
          else return this.legs[l].waypoints[pos];
        }
      }
      else return;
    },

    /** Returns all waypoints in fms, in order
     */
    waypoints: function() {
      return $.map(this.legs,function(v){return v.waypoints});
    },

    atLastWaypoint: function() {
      return this.indexOfCurrentWaypoint().wp == this.waypoints().length-1;
    }
  };
});

/**
 * Each simulated aircraft in the game. Contains a model, fms, and conflicts.
 *
 * @class Aircraft
 */
var Aircraft = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.eid          = prop.aircraft.list.length;  // entity ID
      this.position     = [0, 0];     // Aircraft Position, in km, relative to airport position
      this.model        = null;       // Aircraft type
      this.airline      = "";         // Airline Identifier (eg. 'AAL')
      this.callsign     = "";         // Flight Number ONLY (eg. '551')
      this.heading      = 0;          // Magnetic Heading
      this.altitude     = 0;          // Altitude, ft MSL
      this.speed        = 0;          // Indicated Airspeed (IAS), knots
      this.groundSpeed  = 0;          // Groundspeed (GS), knots
      this.groundTrack  = 0;          //
      this.ds           = 0;          //
      this.takeoffTime  = 0;          //
      this.rwy_dep      = null;       // Departure Runway (to use, currently using, or used)
      this.rwy_arr      = null;       // Arrival Runway (to use, currently using, or used)
      this.approachOffset = 0;        // Distance laterally from the approach path
      this.approachDistance = 0;      // Distance longitudinally from the threshold
      this.radial       = 0;          // Angle from airport center to aircraft
      this.distance     = 0;          //
      this.destination  = null;       // Destination they're flying to
      this.trend        = 0;          // Indicator of descent/level/climb (1, 0, or 1)
      this.history      = [];         // Array of previous positions
      this.restricted   = {list:[]};  //
      this.notice       = false;      // Whether aircraft
      this.warning      = false;      //
      this.hit          = false;      // Whether aircraft has crashed
      this.taxi_next    = false;      //
      this.taxi_start   = 0;          //
      this.taxi_time    = 3;          // Time spent taxiing to the runway. *NOTE* this should be INCREASED to around 60 once the taxi vs LUAW issue is resolved (#406)
      this.rules        = "ifr";      // Either IFR or VFR (Instrument/Visual Flight Rules)
      this.inside_ctr   = false;      // Inside ATC Airspace
      this.datablockDir = -1;         // Direction the data block points (-1 means to ignore)
      this.conflicts    = {};         // List of aircraft that MAY be in conflict (bounding box)

      if (prop.airport.current.terrain) {
        var terrain = prop.airport.current.terrain;
        this.terrain_ranges = {};
        this.terrain_level = 0;
        for (var k in terrain) {
          this.terrain_ranges[k] = {};
          for (var j in terrain[k]) {
            this.terrain_ranges[k][j] = Infinity;
          }
        }
      } else {
        this.terrain_ranges = false;
      }

      // Set to true when simulating future movements of the aircraft
      // Should be checked before updating global state such as score
      // or HTML.
      this.projected = false;

      this.position_history = [];

      this.category = options.category; // or "departure"
      this.mode     = "cruise";  // "apron", "taxi", "waiting", "takeoff", "cruise", or "landing"
      // where:
      // - "apron" is the initial status of a new departing plane. After
      //   the plane is issued the "taxi" command, the plane transitions to
      //   "taxi" mode
      // - "taxi" describes the process of getting ready for takeoff. After
      //   a delay, the plane becomes ready and transitions into "waiting" mode
      // - "waiting": the plane is ready for takeoff and awaits clearence to
      //   take off
      // - "takeoff" is assigned to planes in the process of taking off. These
      //   planes are still on the ground or have not yet reached the minimum
      //   altitude
      // - "cruse" describes, that a plane is currently in flight and
      //   not following an ILS path. Planes of category "arrival" entering the
      //   playing field also have this state. If an ILS path is picked up, the
      //   plane transitions to "landing"
      // - "landing" the plane is following an ILS path or is on the runway in
      //   the process of stopping. If an ILS approach or a landing is aborted,
      //   the plane reenters "cruise" mode

      /*
       * the following diagram illustrates all allowed mode transitions:
       *
       * apron -> taxi -> waiting -> takeoff -> cruise <-> landing
       *   ^                                       ^
       *   |                                       |
       * new planes with                      new planes with
       * category "departure"                 category "arrival"
       */


      // Initialize the FMS
      this.fms = new zlsa.atc.AircraftFlightManagementSystem({
        aircraft: this, model:options.model
      });

      //target represents what the pilot makes of the tower's commands. It is
      //most important when the plane is in a 'guided' situation, that is it is
      //not given a heading directly, but has a fix or is following an ILS path
      this.target = {
        heading:  null,
        turn:     null,
        altitude: 0,
        expedite: false,
        speed:    0
      };

      this.emergency = {};

      // Setting up links to restricted areas
      var ra = prop.airport.current.restricted_areas;
      for (var i in ra) {
        this.restricted.list.push({
          data: ra[i], range: null, inside: false});
      }

      // Initial Runway Assignment
      if (options.category == "arrival") this.setArrivalRunway(airport_get().runway);
      else if (options.category == "departure") this.setDepartureRunway(airport_get().runway);
      this.takeoffTime = (options.category == "arrival") ? game_time() : null;

      this.parse(options);
      this.createStrip();
      this.updateStrip();
    },
    setArrivalWaypoints: function(waypoints) {
      for (var i=0; i<waypoints.length; i++) {  // add arrival fixes to fms
        this.fms.appendLeg({type:"fix", route:waypoints[i].fix});
      }
      if (this.fms.currentWaypoint().navmode == 'heading') {
        this.fms.setCurrent({heading: vradial(this.position) + Math.PI,});  // aim aircraft at airport
      }
      if(this.fms.legs.length > 0) this.fms.nextWaypoint(); // go to the first fix!
    },
    setArrivalRunway: function(rwy) {
      this.rwy_arr = rwy;

      //Update the assigned STAR to use the fixes for the specified runway, if they exist
    },
    setDepartureRunway: function(rwy) {
      this.rwy_dep = rwy;

      // Update the assigned SID to use the portion for the new runway
      var l = this.fms.currentLeg();
      if(l.type == "sid") {
        var a = $.map(l.waypoints,function(v){return v.altitude});
        var cvs = !a.every(function(v){return v==airport_get().initial_alt;});
        this.fms.followSID(l.route);
        if(cvs) this.fms.climbViaSID();
      }
    },
    cleanup: function() {
      this.html.remove();
    },
    /** Create the aircraft's flight strip and add to strip bay
     */
    createStrip:function() {
      this.html = $("<li class='strip'></li>");

      // Top Line Data
      this.html.append("<span class='callsign'>" + this.getCallsign() + "</span>");
      this.html.append("<span class='heading'>???</span>");
      this.html.append("<span class='altitude'>???</span>");

      // Bottom Line Data
      if(["H","U"].indexOf(this.model.weightclass) > -1)
        this.html.append("<span class='aircraft'>" + "H/" + this.model.icao  + "</span>");
      else this.html.append("<span class='aircraft'>" + this.model.icao + "</span>");
      this.html.append("<span class='destination'>" + this.destination + "</span>");
      this.html.append("<span class='speed'>???</span>");

      // Initial Styling
      if(this.category == "departure") this.html.addClass('departure');
      else this.html.addClass('arrival');

      // Strip Interactivity Functions
      this.html.find(".strip").prop("title", this.fms.fp.route.join(' '));  // show fp route on hover
      this.html.click(this, function(e) {
        input_select(e.data.getCallsign());
      });
      this.html.dblclick(this, function (e) {
        prop.canvas.panX = 0 - round(km_to_px(e.data.position[0]));
        prop.canvas.panY = round(km_to_px(e.data.position[1]));
        prop.canvas.dirty = true;
      });

      // Add the strip to the html
      var scrollPos = $("#strips").scrollTop();
      $("#strips").prepend(this.html);
      $("#strips").scrollTop(scrollPos + 45);  // shift scroll down one strip's height

      // Determine whether or not to show the strip in our bay
      if (this.category == "arrival") this.html.hide(0);
      else if (this.category == "departure") this.inside_ctr = true;
    },
    // Called when the aircraft crosses the center boundary
    crossBoundary: function(inbound) {
      this.inside_ctr = inbound;
      if (this.projected)
        return;
      // Crossing into the center
      if (inbound) {
        this.showStrip();
        this.callUp();
      }
      // Leaving the facility's airspace
      else {
        this.hideStrip();

        if (this.category == "departure") {
          if(this.destination == "number") {
            // Within 5 degrees of destination heading
            if (abs(this.radial - this.destination) < 0.08726) {
              this.radioCall("switching to center, good day", "dep");
              prop.game.score.departure += 1;
            }
            else {
              this.radioCall("leaving radar coverage outside departure window", "dep", true);
              prop.game.score.departure -= 1;
            }
          }
          else { // following a Standard Instrument Departure procedure
            // Find the desired SID exitPoint
            var exit;
            for(var l in this.fms.legs) {
              if(this.fms.legs[l].type == "sid") {
                exit = this.fms.legs[l].waypoints[this.fms.legs[l].waypoints.length-1].fix;
                break;
              }
            }
            // Verify aircraft was cleared to departure fix
            var ok = false;
            for(var i=0; i<this.fms.waypoints().length; i++)
              if(this.fms.waypoints()[i].fix == exit) {ok = true; break;}
            if(ok) {
              this.radioCall("switching to center, good day", "dep");
              prop.game.score.departure += 1;
            }
            else {
              this.radioCall("leaving radar coverage without being cleared to " +
                this.fms.fp.route[1].split(".")[1],"dep",true)
              prop.game.score.departure -= 1;
            }
          }
          this.fms.setCurrent({altitude:this.fms.fp.altitude, speed:this.model.speed.cruise});
        }
        if (this.category == "arrival") {
          this.radioCall("leaving radar coverage as arrival", "app", true);
          prop.game.score.failed_arrival += 1;
        }
      }
    },
    matchCallsign: function(callsign) {
      if( callsign === '*')
        return true;
      callsign = callsign.toLowerCase();
      var this_callsign = this.getCallsign().toLowerCase();
      if(this_callsign.indexOf(callsign) == 0) return true;
      return false;
    },
    getCallsign: function() {
      return (this.getAirline().icao + this.callsign).toUpperCase();
    },
    getAirline: function() {
      return airline_get(this.airline);
    },
    getRadioCallsign: function(condensed) {
      var heavy = "";
      if(this.model.weightclass == "H") heavy = " heavy"
      if(this.model.weightclass == "U") heavy = " super"
      var callsign = this.callsign;
      if(condensed) {
        var length = 2;
        callsign = callsign.substr(callsign.length - length);
      }
      var cs = airline_get(this.airline).callsign;
      if(cs == "November") cs += " " + radio_spellOut(callsign) + heavy;
      else cs += " " + groupNumbers(callsign, this.airline) + heavy;
      return cs;
    },
    getClimbRate: function() {
      var a = this.altitude;
      var r = this.model.rate.climb;
      var c = this.model.ceiling;
      if(this.model.engines.type == "J") var serviceCeilingClimbRate = 500;
      else var serviceCeilingClimbRate = 100;
      if(this.altitude < 36152) { // in troposphere
        var cr_uncorr = r*420.7* ((1.232*Math.pow((518.6 - 0.00356*a)/518.6, 5.256)) / (518.6 - 0.00356*a));
        var cr_current = cr_uncorr - (a/c*cr_uncorr) + (a/c*serviceCeilingClimbRate);
      }
      else { // in lower stratosphere
        //re-do for lower stratosphere
        //Reference: https://www.grc.nasa.gov/www/k-12/rocket/atmos.html
        //also recommend using graphing calc from desmos.com
        return this.model.rate.climb; // <-- NOT VALID! Just a placeholder!
      }
      return cr_current;
    },
    getClimbRate: function() {
      var a = this.altitude;
      var r = this.model.rate.climb;
      var c = this.model.ceiling;
      if(this.model.engines.type == "J") var serviceCeilingClimbRate = 500;
      else var serviceCeilingClimbRate = 100;
      if(this.altitude < 36152) { // in troposphere
        var cr_uncorr = r*420.7* ((1.232*Math.pow((518.6 - 0.00356*a)/518.6, 5.256)) / (518.6 - 0.00356*a));
        var cr_current = cr_uncorr - (a/c*cr_uncorr) + (a/c*serviceCeilingClimbRate);
      }
      else { // in lower stratosphere
        //re-do for lower stratosphere
        //Reference: https://www.grc.nasa.gov/www/k-12/rocket/atmos.html
        //also recommend using graphing calc from desmos.com
        return this.model.rate.climb; // <-- NOT VALID! Just a placeholder!
      }
      return cr_current;
    },
    hideStrip: function() {
      this.html.hide(600);
    },

    COMMANDS: {
      abort: 'runAbort',
      altitude: 'runAltitude',
      clearedAsFiled: 'runClearedAsFiled',
      climbViaSID: 'runClimbViaSID',
      debug: 'runDebug',
      delete: 'runDelete',
      descendViaSTAR: 'runDescendViaSTAR',
      direct: 'runDirect',
      fix: 'runFix',
      flyPresentHeading: 'runFlyPresentHeading',
      heading: 'runHeading',
      hold: 'runHold',
      land: 'runLanding',
      moveDataBlock: 'runMoveDataBlock',
      route: 'runRoute',
      reroute: 'runReroute',
      sayRoute: 'runSayRoute',
      sid: 'runSID',
      speed: 'runSpeed',
      star: 'runSTAR',
      takeoff: 'runTakeoff',
      taxi: 'runTaxi'
    },

    runCommands: function(commands) {
      if (!this.inside_ctr)
        return true;

      var response = [];
      var response_end = "";
      var deferred = [];

      for(var i=0;i<commands.length;i+=1) {
        var command = commands[i][0];
        var args = commands[i].splice(1);

        if (command == 'takeoff') {
          deferred.push([command, args]);
          continue;
        }

        var retval  = this.run(command, args);

        if(retval) {
          if(!retval[1].hasOwnProperty("log") || !retval[1].hasOwnProperty("say")) {
            retval = [retval[0],{log:retval[1], say:retval[1]}];
          }
          response.push(retval[1]);
          if(retval[2]) response_end = retval[2];
        }

      }

      for(var i=0;i<deferred.length;i+=1) {
        var command = deferred[i][0];
        var args = deferred[i][1];

        var retval  = this.run(command, args);
        if(retval) {
          if(retval[1].length != null) { // true if array, and not log/say object
            retval[1] = {say:retval[1], log:retval[1]};  // make into log/say object
          }
          response.push(retval[1]);
        }
      }

      if(commands.length == 0) {
        response     = [{say:"not understood", log:"not understood"}];
        response_end = "say again";
      }

      if(response.length >= 1) {
        if(response_end) response_end = ", " + response_end;

        var r_log = function f(){var x = [];for(var i=0;i<response.length;i++){x.push(response[i].log)}return x;};
        var r_say = function f(){var x = [];for(var i=0;i<response.length;i++){x.push(response[i].say)}return x;};

        ui_log(this.getCallsign() + ", " + r_log().join(", ") + response_end);
        speech_say([ {type:"callsign", content:this}, {type:"text", content:r_say().join(", ") + response_end} ]);
      }

      this.updateStrip();

      return true;
    },
    run: function(command, data) {
      var call_func;

      if (this.COMMANDS[command]) {
        call_func = this.COMMANDS[command];
      }

      if (!call_func)
        return ["fail", "not understood"];

      return this[call_func].apply(this, [data]);
    },
    runHeading: function(data) {
      var direction = data[0];
      var heading = data[1];
      var incremental = data[2];

      var instruction = null;
      var amount = 0;

      if(isNaN(heading)) return ["fail", "heading not understood"];

      if (incremental) {
        amount = heading;
        if(direction == "left") {
          heading = degrees(this.heading) - amount;
        }
        else if(direction == "right") {
          heading = degrees(this.heading) + amount;
        }
      }

      // Update the FMS
      var wp = this.fms.currentWaypoint();
      var leg = this.fms.currentLeg();
      var f = this.fms.following;
      if(wp.navmode == "rwy") this.cancelLanding();
      if(['heading'].indexOf(wp.navmode) > -1) { // already being vectored or holding. Will now just change the assigned heading.
        this.fms.setCurrent({
          altitude: wp.altitude,
          navmode: "heading",
          heading: radians(heading),
          speed: wp.speed,
          turn:direction,
          hold:false
        });
      }
      else if(['hold'].indexOf(wp.navmode) > -1) {  // in hold. Should leave the hold, and add leg for vectors
        var index = this.fms.current[0] + 1;
        this.fms.insertLeg({firstIndex:index, waypoints:[new zlsa.atc.Waypoint({  // add new Leg after hold leg
          altitude: wp.altitude,
          navmode: "heading",
          heading: radians(heading),
          speed: wp.speed,
          turn:direction,
          hold:false
        },this.fms)]});
        this.fms.nextWaypoint();  // move from hold leg to vector leg.
      }
      else if(f.sid || f.star || f.awy) {
        leg.waypoints.splice(this.fms.current[1] , 0, // insert wp with heading at current position within the already active leg
          new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn: direction,
            hold: false,
          },this.fms)
        );
      }
      else if(leg.route != "[radar vectors]") { // needs new leg added
        if(this.fms.atLastWaypoint()) {
          this.fms.appendLeg({waypoints:[new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn:direction,
            hold:false
          },this.fms)]});
          this.fms.nextLeg();
        }
        else {
          this.fms.insertLegHere({waypoints:[new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn:direction,
            hold:false
          },this.fms)]});
        }
      }
      wp = this.fms.currentWaypoint();  // update 'wp'

      // Construct the readback
      if(direction) instruction = "turn " + direction + " heading ";
      else instruction = "fly heading ";
      if(incremental)
        var readback = {
          log: "turn " + amount + " degrees " + direction,
          say: "turn " + groupNumbers(amount) + " degrees " + direction};
      else var readback = {
          log: instruction + heading_to_string(wp.heading),
          say: instruction + radio_heading(heading_to_string(wp.heading))};
      return ['ok', readback];
    },
    runAltitude: function(data) {
      var altitude = data[0];
      var expedite = data[1];

      if ((altitude == null) || isNaN(altitude)) {
        if (expedite) {
          this.fms.setCurrent({expedite: true});
          return ['ok', radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + ' expedite'];
        }
        return ["fail", "altitude not understood"];
      }

      if(this.mode == "landing")
        this.cancelLanding();

      var ceiling = airport_get().ctr_ceiling;
      if (prop.game.option.get('softCeiling') == 'yes')
        ceiling += 1000;

      this.fms.setAll({
        altitude: clamp(round(airport_get().elevation/100)*100 + 1000, altitude, ceiling),
        expedite: expedite,
      })

      if(expedite) expedite = " and expedite";
      else         expedite = "";

      var readback = {
        log: radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + expedite,
        say: radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + radio_altitude(this.fms.currentWaypoint().altitude) + expedite
      };
      return ['ok', readback];
    },
    runClearedAsFiled: function() {
      if(this.fms.clearedAsFiled()) {
        return ['ok',
          {log: "cleared to destination via the " + airport_get().sids[this.destination].icao +
            " departure, then as filed" + ". Climb and maintain " + airport_get().initial_alt +
            ", expect " + this.fms.fp.altitude + " 10 minutes after departure",
          say: "cleared to destination via the " + airport_get().sids[this.destination].name +
            " departure, then as filed" + ". Climb and maintain " + radio_altitude(
            airport_get().initial_alt) + ", expect " + radio_altitude(this.fms.fp.altitude) +
            "," + radio_spellOut(" 10 ") + "minutes after departure"}];
      }
      else return [true, "unable to clear as filed"];
    },
    runClimbViaSID: function() {
      if(!(this.fms.currentLeg().type == "sid")) var fail = true;
      else if(this.fms.climbViaSID())
        return ['ok', {log: "climb via the " + this.fms.currentLeg().route.split('.')[1] + " departure",
          say: "climb via the " + airport_get().sids[this.fms.currentLeg().route.split('.')[1]].name + " departure"}];

      if(fail) ui_log(true, this.getCallsign() + ", unable to climb via SID");
    },
    runDescendViaSTAR: function() {
      if(this.fms.descendViaSTAR() && this.fms.following.star)
      return ['ok', {log: "descend via the " + this.fms.following.star + " arrival",
        say: "descend via the " + airport_get().stars[this.fms.following.star].name + " arrival"}];
      else ui_log(true, this.getCallsign() + ", unable to descend via STAR");
    },
    runSpeed: function(data) {
      var speed = data[0];
      if(isNaN(speed)) return ["fail", "speed not understood"];

      this.fms.setAll({speed: clamp(this.model.speed.min,
                                    speed,
                                    this.model.speed.max)});
      var readback = {
        log: radio_trend("speed", this.speed, this.fms.currentWaypoint().speed) + " " + this.fms.currentWaypoint().speed,
        say: radio_trend("speed", this.speed, this.fms.currentWaypoint().speed) + " " + radio_spellOut(this.fms.currentWaypoint().speed)
      };
      return ["ok", readback];
    },
    runHold: function(data) {
      var dirTurns = data[0];
      var legLength = data[1];
      var holdFix = data[2];
      var holdFixLocation = null;

      if (dirTurns == null)
        dirTurns = "right"; // standard for holding patterns is right-turns

      if (legLength == null)
        legLength = "1min";

      if (holdFix != null) {
        holdFix = holdFix.toUpperCase();
        holdFixLocation = airport_get().getFix(holdFix);
        if (!holdFixLocation) {
          return ["fail", "unable to find fix " + holdFix];
        }
      }

      if(this.isTakeoff() && !holdFix) return ["fail", "where do you want us to hold?"];

      // Determine whether or not to enter the hold from present position
      if(holdFix) {  // holding over a specific fix (currently only able to do so on inbound course)
        var inboundHdg = vradial(vsub(this.position, holdFixLocation));
        if(holdFix != this.fms.currentWaypoint().fix) {  // not yet headed to the hold fix
          this.fms.insertLegHere({type:"fix", route: "[GPS/RNAV]", waypoints:[
            new zlsa.atc.Waypoint({ // proceed direct to holding fix
              fix: holdFix,
              altitude: this.fms.currentWaypoint().altitude,
              speed: this.fms.currentWaypoint().speed
            },this.fms),
            new zlsa.atc.Waypoint({ // then enter the hold
              navmode:"hold",
              speed: this.fms.currentWaypoint().speed,
              altitude: this.fms.currentWaypoint().altitude,
              fix: null,
              hold: {
                fixName: holdFix,
                fixPos: holdFixLocation,
                dirTurns: dirTurns,
                legLength: legLength,
                inboundHdg: inboundHdg,
                timer: null,
              }
            },this.fms)
          ]});
        }
        else {  // already currently going to the hold fix
          this.fms.appendWaypoint({
            navmode:"hold",
            speed: this.fms.currentWaypoint().speed,
            altitude: this.fms.currentWaypoint().altitude,
            fix: null,
            hold: {
              fixName: holdFix,
              fixPos: holdFixLocation,
              dirTurns: dirTurns,
              legLength: legLength,
              inboundHdg: inboundHdg,
              timer: null, }});  // Force the initial turn to outbound heading when entering the hold
        }
      }
      else {  // holding over present position (currently only able to do so on present course)
        holdFixLocation = this.position; // make a/c hold over their present position
        var inboundHdg = this.heading;
        this.fms.insertLegHere({type:"fix", waypoints:[
          { // document the present position as the "fix" we're holding over
            navmode:"fix",
            fix: "[custom]",
            location: holdFixLocation,
            altitude: this.fms.currentWaypoint().altitude,
            speed: this.fms.currentWaypoint().speed
          },
          { // Force the initial turn to outbound heading when entering the hold
            navmode:"hold",
            speed: this.fms.currentWaypoint().speed,
            altitude: this.fms.currentWaypoint().altitude,
            fix: null,
            hold: {
              fixName: holdFix,
              fixPos: holdFixLocation,
              dirTurns: dirTurns,
              legLength: legLength,
              inboundHdg: inboundHdg,
              timer: null,
            }
          }
        ]});
      }

      var inboundDir = radio_cardinalDir_names[getCardinalDirection(fix_angle(inboundHdg + Math.PI)).toLowerCase()];
      if(holdFix) return ["ok", "proceed direct " + holdFix + " and hold inbound, " + dirTurns + " turns, " + legLength + " legs"];
      else return ["ok", "hold " + inboundDir + " of present position, " + dirTurns + " turns, " + legLength + " legs"];
    },
    runDirect: function(data) {
      var fixname = data[0].toUpperCase();
      var fix = airport_get().getFix(fixname);
      if (!fix) return ["fail", "unable to find fix called " + fixname];

      if(this.mode == "takeoff") {  // remove intermediate fixes
        this.fms.skipToFix(fixname);
      }
      else {
        if (!this.fms.skipToFix(fixname))
          return ["fail", fixname + ' is not in our flightplan'];
      }

      return ["ok", "proceed direct " + fixname];
    },
    runFix: function(data) {
      var last_fix, fail;
      var fixes = $.map(data[0], function(fixname) {
            var fix = airport_get().getFix(fixname);
            if(!fix) {
              fail = ["fail", "unable to find fix called " + fixname];
              return;
            }

            // to avoid repetition, compare name with the previous fix
            if (fixname == last_fix) return;
            last_fix = fixname;
            return fixname;
      });

      if (fail) return fail;

      for(var i=fixes.length-1; i>=0; i--) {
        this.fms.insertLegHere({type:"fix", route:fixes[i]})
      }

      if (this.mode != "waiting" && this.mode != "takeoff" && this.mode != "apron" && this.mode != "taxi"){
        this.cancelLanding();
      }
      return ["ok", "proceed direct " + fixes.join(', ')];
    },
    runFlyPresentHeading: function(data) {
      this.cancelFix();
      this.runHeading([null, degrees(this.heading)]);
      return ["ok", "fly present heading"];
    },
    runSayRoute: function(data) {
      return ['ok', {log:'route: ' + this.fms.fp.route.join(' '), say:"here's our route"}];
    },
    runSID: function(data) {
      var apt = airport_get();
      var sid_id = data[0].toUpperCase();
      if(!apt.sids.hasOwnProperty(sid_id)) return;
      var sid_name = apt.sids[sid_id].name;
      var exit = apt.getSIDExitPoint(sid_id);
      var route = apt.icao + '.' + sid_id + '.' + exit;

      if(this.category != "departure") {
        return ["fail", "unable to fly SID, we are an inbound"];
      }
      if(data[0].length == 0) {
        return ["fail", "SID name not understood"];
      }
      if(!apt.sids.hasOwnProperty(sid_id)) {
        return ["fail", "SID name not understood"];
      }
      if(!this.rwy_dep) this.setDepartureRunway(airport_get().runway);
      if(!apt.sids[sid_id].rwy.hasOwnProperty(this.rwy_dep)) {
        return ['fail', "unable, the "+sid_name+" departure not valid from Runway "+this.rwy_dep];
      }


      this.fms.followSID(route);

      return ["ok", {log:"cleared to destination via the " + sid_id + " departure, then as filed",
                  say:"cleared to destination via the " + sid_name + " departure, then as filed"}];
    },
    runSTAR: function(data) {
      var entry = data[0].split('.')[0].toUpperCase();
      var star_id = data[0].split('.')[1].toUpperCase();
      var apt = airport_get();
      var star_name = apt.stars[star_id].name;
      var route = entry + '.' + star_id + '.' + apt.icao;

      if(this.category != "arrival") {
        return ["fail", "unable to fly STAR, we are a departure!"];
      }
      if(data[0].length == 0) {
        return ["fail", "STAR name not understood"];
      }
      if(!apt.stars.hasOwnProperty(star_id)) {
        return ["fail", "STAR name not understood"];
      }

      this.fms.followSTAR(route);

      return ["ok", {log:"cleared to the " + apt.name + " via the " + star_id + " arrival",
                  say:"cleared to the " + apt.name + " via the " + star_name + " arrival"}];
    },
    runMoveDataBlock: function(dir) {
      var positions = {8:360,9:45,6:90,3:135,2:180,1:225,4:270,7:315,5:"ctr"};
      if(!positions.hasOwnProperty(dir[0])) return;
      else this.datablockDir = positions[dir[0]];
    },
    /** Adds a new Leg to fms with a user specified route
     ** Note: See notes on 'runReroute' for how to format input for this command
     */
    runRoute: function(data) {
      data = data[0].toUpperCase();  // capitalize everything
      var worked = true;
      var route = this.fms.formatRoute(data);
      if(worked && route) worked = this.fms.customRoute(route, false);  // Add to fms
      if(!route || !data || data.indexOf(" ") > -1) worked = false;

      // Build the response
      if(worked) return ['ok', {log:'rerouting to :' + this.fms.fp.route.join(' '),say:"rerouting as requested"}];
      else return ['fail', {log:'your route "' + data + '" is invalid!', say:'that route is invalid!'}];
    },
    /** Removes all legs, and replaces them with the specified route
     ** Note: Input data needs to be provided with single dots connecting all
     ** procedurally-linked points (eg KSFO.OFFSH9.SXC or SGD.V87.MOVER), and
     ** all other points that will be simply a fix direct to another fix need
     ** to be connected with double-dots (eg HLI..SQS..BERRA..JAN..KJAN)
     */
    runReroute: function(data) {
      data = data[0].toUpperCase();  // capitalize everything
      var worked = true;
      var route = this.fms.formatRoute(data);
      if(worked && route) worked = this.fms.customRoute(route, true);  // Reset fms
      if(!route || !data || data.indexOf(" ") > -1) worked = false;

      // Build the response
      if(worked) return ['ok', {log:'rerouting to: ' + this.fms.fp.route.join(' '),say:"rerouting as requested"}];
      else return ['fail', {log:'your route "' + data + '" is invalid!', say:'that route is invalid!'}];
    },
    runTaxi: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];
      if(this.mode == "taxi") return ["fail", "already taxiing to " + radio_runway(this.rwy_dep)];
      if(this.mode == "waiting") return ["fail", "already waiting"];
      if(this.mode != "apron") return ["fail", "wrong mode"];

      // Set the runway to taxi to
      if(data[0]) {
        if(airport_get().getRunway(data[0].toUpperCase())) this.setDepartureRunway(data[0].toUpperCase());
        else return ["fail", "no runway " + data[0].toUpperCase()];
      }

      // Start the taxi
      this.taxi_start = game_time();
      var runway = airport_get().getRunway(this.rwy_dep);
      runway.addQueue(this);
      this.mode = "taxi";

      var readback = {
        log: "taxi to runway " + runway.name,
        say: "taxi to runway " + radio_runway(runway.name)
      };
      return ["ok", readback];
    },
    runTakeoff: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];

      if(!this.isLanded()) return ["fail", "already airborne"];
      if(this.mode =="apron") return ["fail", "unable, we're still in the parking area"];
      if(this.mode == "taxi") return ["fail", "taxi to runway " + radio_runway(this.rwy_dep) + " not yet complete"];
      if(this.mode == "takeoff") return ["fail", "already taking off"];

      if(this.fms.currentWaypoint().altitude <= 0) return ["fail", "no altitude assigned"];

      var runway = airport_get().getRunway(this.rwy_dep);

      if(runway.removeQueue(this)) {
        this.mode = "takeoff";
        prop.game.score.windy_takeoff += this.scoreWind('taking off');
        this.takeoffTime = game_time();

        if(this.fms.currentWaypoint().speed == null)
          this.fms.setCurrent({speed: this.model.speed.cruise});

        var wind = airport_get().getWind();
        var wind_dir = round(degrees(wind.angle));
        var readback = {
          log: "wind " + round(wind_dir/10)*10 + " at " + round(wind.speed) + ", runway " + this.rwy_dep + ", cleared for takeoff",
          say: "wynd " + radio_spellOut(round(wind_dir/10)*10) + " at " + radio_spellOut(round(wind.speed)) + ", run way " + radio_runway(this.rwy_dep) + ", cleared for take off",
        };
        return ["ok", readback];
      } else {
        var waiting = runway.inQueue(this);
        return ["fail", "number "+waiting+" behind "+runway.queue[waiting-1].getRadioCallsign(), ""];
      }
    },
    runLanding: function(data) {
      var variant = data[0];
      var runway = airport_get().getRunway(data[1]);

      if(!runway) return ["fail", "there is no runway " + radio_runway(data[1])];
      else this.setArrivalRunway(data[1].toUpperCase());

      this.fms.followApproach("ils", this.rwy_arr, variant); // tell fms to follow ILS approach

      var readback = {log:"cleared ILS runway " + this.rwy_arr + " approach",
                      say:"cleared ILS runway " + radio_runway(this.rwy_arr) + " approach"};
      return ["ok", readback];
    },
    runAbort: function(data) {
      if(this.mode == "taxi") {
        this.mode = "apron";
        this.taxi_start = 0;
        console.log("aborted taxi to runway");
        ui_log(true, this.getCallsign() + " aborted taxi to runway");
        prop.game.score.abort.taxi += 1;
        return ["ok", "taxiing back to terminal"];
      } else if(this.mode == "waiting") {
        return ["fail", "unable to return to the terminal"];
      } else if(this.mode == "landing") {
        this.cancelLanding();
        var readback = {
          log: "go around, fly present heading, maintain " + this.fms.currentWaypoint().altitude,
          say: "go around, fly present heading, maintain " + radio_altitude(this.fms.currentWaypoint().altitude)
        };
        return ["ok", readback];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "rwy") {
        this.cancelLanding();
        var readback = {
          log: "cancel approach clearance, fly present heading, maintain " + this.fms.currentWaypoint().altitude,
          say: "cancel approach clearance, fly present heading, maintain " + radio_altitude(this.fms.currentWaypoint().altitude),
        };
        return ["ok", readback];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "fix") {
        this.cancelFix();
        if(this.category == "arrival") return ["ok", "fly present heading, vector to final approach course"];
        else if(this.category == "departure") return ["ok", "fly present heading, vector for entrail spacing"];
      } else { //modes "apron", "takeoff", ("cruise" for some navmodes)
        return ["fail", "unable to abort"];
      }
    },
    runDebug: function() {
      window.aircraft = this;
      return ["ok", {log:"in the console, look at the variable &lsquo;aircraft&rsquo;", say:""}];
    },
    runDelete: function() {
      aircraft_remove(this);
    },
    cancelFix: function() {
      if(this.fms.currentWaypoint().navmode == "fix") {
        var curr = this.fms.currentWaypoint();
        this.fms.appendLeg({
          altitude: curr.altitude,
          navmode: 'heading',
          heading: this.heading,
          speed: curr.speed
        });
        this.fms.nextLeg();
        this.updateStrip();
        return true;
      }
      return false;
    },
    cancelLanding: function() {
      if(this.fms.currentWaypoint().navmode == "rwy") {
        var runway = airport_get().getRunway(this.rwy_arr);
        if(this.mode == "landing") {
          this.fms.setCurrent({
            altitude: Math.max(2000, round((this.altitude / 1000)) * 1000),
            heading: runway.angle,
          });
        }

        this.fms.setCurrent({
          navmode: "heading",
          runway: null,
        });
        this.mode = "cruise";
        this.updateStrip();
        return true;
      } else {
        this.fms.setCurrent({runway: null});
        return false;
      }
    },
    parse: function(data) {
      var keys = 'position model airline callsign category heading altitude speed'.split(' ');
      for (var i in keys) {
        if (data[keys[i]]) this[keys[i]] = data[keys[i]];
      }
      if(this.category == "arrival") {
        if(data.waypoints.length > 0)
          this.setArrivalWaypoints(data.waypoints);
        this.destination = data.destination;
        this.setArrivalRunway(airport_get(this.destination).runway);
      }
      else if(this.category == "departure" && this.isLanded()) {
        this.speed = 0;
        this.mode = "apron";
        this.setDepartureRunway(airport_get().runway);
        this.destination = data.destination;
      }

      if(data.heading)  this.fms.setCurrent({heading: data.heading});
      if(data.altitude) this.fms.setCurrent({altitude: data.altitude});
      this.fms.setCurrent({speed: data.speed || this.model.speed.cruise});
      if(data.route) {
        this.fms.customRoute(this.fms.formatRoute(data.route), true);
        this.fms.descendViaSTAR();
      }
      if(data.nextFix) {
        this.fms.skipToFix(data.nextFix);
      }
    },
    pushHistory: function() {
      this.history.push([this.position[0], this.position[1]]);
      if(this.history.length > 10) {
        this.history.splice(0, this.history.length-10);
      }
    },
    moveForward: function() {
      this.mode = "taxi";
      this.taxi_next  = true;
    },

    /**
     ** Aircraft is established on FINAL APPROACH COURSE
     */
    isEstablished: function() {
      if (this.mode != "landing")
        return false;
      return (this.approachOffset <= 0.048); // 160 feet or 48 meters
    },

    /**
     ** Aircraft is on the ground (can be a departure OR arrival)
     */
    isLanded: function() {
      var runway  = airport_get().getRunway(this.rwy_arr);
      if (runway == null) {
        runway  = airport_get().getRunway(this.rwy_dep);
      }

      if (runway == null) {
        return false;
      }
      if((this.altitude - runway.elevation) < 5)
        return true;
      return false;
    },

    /**
     ** Aircraft is actively following an instrument approach
     */
    isPrecisionGuided: function() {
      // Whether this aircraft is elegible for reduced separation
      //
      // If the game ever distinguishes between ILS/MLS/LAAS
      // approaches and visual/localizer/VOR/etc. this should
      // distinguish between them.  Until then, presume landing is via
      // ILS with appropriate procedures in place.
      return (this.mode == "landing");
    },
    isStopped: function() {
      if(this.isLanded() && this.speed < 5) return true;
    },
    isTaxiing: function() {
      if(this.mode == "apron"   ||
         this.mode == "taxi"    ||
         this.mode == "waiting") {
        return true;
      }
      return false;
    },
    isTakeoff: function() {
      if(this.isTaxiing() ||
         this.mode == "takeoff") {
        return true;
      }
      return false;
    },
    isVisible: function() {
      if(this.mode == "apron" || this.mode == "taxi") return false; // hide aircraft on twys
      else if(this.isTaxiing()) { // show only the first aircraft in the takeoff queue
        var runway = airport_get().getRunway(this.rwy_dep);
        var waiting = runway.inQueue(this);
        if(this.mode == "waiting" && waiting == 0) return true;
        else return false;
      }
      else return true;
    },
    getWind: function() {
      if (!this.rwy_dep) return {cross: 0, head: 0};
      var airport = airport_get();
      var wind    = airport.wind;
      var runway  = airport.getRunway(this.rwy_dep);

      var angle   =  abs(angle_offset(runway.angle, wind.angle));

      return {
        cross: Math.sin(angle) * wind.speed,
        head: Math.cos(angle) * wind.speed
      };
    },
    radioCall: function(msg, sectorType, alert) {
      if (this.projected) return;
      var call = "",
        callsign_L = this.getCallsign(),
        callsign_S = this.getRadioCallsign();
      if(sectorType) call += airport_get().radio[sectorType];
      // call += ", " + this.getCallsign() + " " + msg;
      if (alert)
        ui_log(true, airport_get().radio[sectorType] + ", " + callsign_L + " " + msg);
      else
        ui_log(airport_get().radio[sectorType] + ", " + callsign_L + " " + msg);
      speech_say([{type:"text", content:(airport_get().radio[sectorType] + ", " + callsign_S + " " + msg)}]);
    },
    callUp: function() {
      if(this.category == "arrival") {
        var altdiff = this.altitude - this.fms.currentWaypoint().altitude;
        var alt = digits_decimal(this.altitude, -2);
        if(Math.abs(altdiff) > 200) {
          if(altdiff > 0) {
            var alt_log = "descending through " + alt + " for " + this.target.altitude;
            var alt_say = "descending through " + radio_altitude(alt) + " for " + radio_altitude(this.target.altitude);
          }
          else if(altdiff < 0) {
            var alt_log = " climbing through " + alt + " for " + this.target.altitude;
            var alt_say = " climbing through " + radio_altitude(alt) + " for " + radio_altitude(this.target.altitude);
          }
        }
        else {
          var alt_log = "at " + alt;
          var alt_say = "at " + radio_altitude(alt);
        }
        ui_log(airport_get().radio.app + ", " + this.getCallsign() + " with you " + alt_log);
        speech_say([ {type:"text", content:airport_get().radio.app+", "}, {type:"callsign", content:this}, {type:"text", content:"with you " + alt_say} ]);
      }
      if(this.category == "departure") {
        ui_log(airport_get().radio.twr + ', ' + this.getCallsign() + ", ready to taxi");
        speech_say( [{type:"text", content: airport_get().radio.twr}, {type:"callsign", content:this}, {type:"text", content:", ready to taxi"}] );
      }
    },
    scoreWind: function(action) {
      var score = 0;
      var components = this.getWind();
      if (components.cross >= 20) {
        score += 2;
        ui_log(true, this.getCallsign()+' '+action+' with major crosswind');
      }
      else if (components.cross >= 10) {
        score += 1;
        ui_log(true, this.getCallsign()+' '+action+' with crosswind');
      }

      if (components.head <= -10) {
        score += 2;
        ui_log(true, this.getCallsign()+' '+action+' with major tailwind');
      }
      else if (components.head <= -1) {
        score += 1;
        ui_log(true, this.getCallsign()+' '+action+' with tailwind');
      }
      return score;
    },
    showStrip: function() {
      this.html.detach();
      // var scrollPos = $("#strips")[0].scrollHeight - $("#strips").scrollTop();
      var scrollPos = $("#strips").scrollTop();
      $("#strips").prepend(this.html);
      this.html.show();
      $("#strips").scrollTop(scrollPos + 45);  // shift scroll down one strip's height
    },
    updateTarget: function() {
      var airport = airport_get();
      var runway  = null;
      var offset = null;
      var offset_angle = null;
      var glideslope_altitude = null;
      var glideslope_window   = null;
      var angle = null;
      var runway_elevation = 0;

      if (this.rwy_arr != null)
        runway_elevation = airport.getRunway(this.rwy_arr).elevation;

      if(this.fms.currentWaypoint().altitude > 0)
        this.fms.setCurrent({altitude: Math.max(1000,
                                                this.fms.currentWaypoint().altitude)});
      if(this.fms.currentWaypoint().navmode == "rwy") {
        airport = airport_get();
        runway  = airport.getRunway(this.rwy_arr);
        offset = getOffset(this, runway.position, runway.angle);
        offset_angle = vradial(offset);
        this.offset_angle = offset_angle;
        this.approachOffset = abs(offset[0]);
        this.approachDistance = offset[1];
        angle = runway.angle;
        if (angle > (2*Math.PI)) angle -= 2*Math.PI;

        glideslope_altitude = clamp(0, runway.getGlideslopeAltitude(offset[1]), this.altitude);
        glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1], radians(1)));

        if(this.mode == "landing")
          this.target.altitude = glideslope_altitude;

        var ils = runway.ils.loc_maxDist;
        if(!runway.ils.enabled || !ils) ils = 40;

        // lock  ILS if at the right angle and altitude
        if ((abs(this.altitude - glideslope_altitude) < glideslope_window)
            && (abs(offset_angle) < radians(10))
            && (offset[1] < ils)) {
          if(abs(offset[0]) < 0.05 && this.mode != "landing") {
            this.mode = "landing";
            if (!this.projected && (abs(angle_offset(this.fms.currentWaypoint().heading,
                  radians(parseInt(this.rwy_arr.substr(0,2))*10))) > radians(30))) {
              ui_log(true, this.getRadioCallsign() +
                      " approach course intercept angle was greater than 30 degrees");
              prop.game.score.violation += 1;
            }
            this.updateStrip();
            this.target.turn = null;
          }

          // Intercept localizer and glideslope and follow them inbound
          var angle_diff = angle_offset(angle, this.heading);
          var turning_time = Math.abs(degrees(angle_diff)) / 3;  // time to turn angle_diff degrees at 3 deg/s
          var turning_radius = km(this.speed) / 3600 * turning_time;  // dist covered in the turn, km
          var dist_to_localizer = offset[0]/Math.sin(angle_diff);  // dist from the localizer intercept point, km
          if(dist_to_localizer <= turning_radius || dist_to_localizer < 0.5) {
            // Steer to within 3m of the centerline while at least 200m out
            if(offset[1] > 0.2 && abs(offset[0]) > 0.003 )
              this.target.heading = clamp(radians(-30), -12 * offset_angle, radians(30)) + angle;
            else this.target.heading = angle;

            // Follow the glideslope
            this.target.altitude = glideslope_altitude;
          }

          // Speed control on final approach
          if(this.fms.currentWaypoint().speed > 0)
            this.fms.setCurrent({start_speed: this.fms.currentWaypoint().speed});
          this.target.speed        = crange(3, offset[1], 10, this.model.speed.landing, this.fms.currentWaypoint().start_speed);
        } else if((this.altitude - runway_elevation) >= 300 && this.mode == "landing") {
          this.updateStrip();
          this.cancelLanding();
          if (!this.projected)
          {
            ui_log(true, this.getRadioCallsign() + " aborting landing, lost ILS");
            speech_say([ {type:"callsign", content:this}, {type:"text", content:" going around"} ])
            prop.game.score.abort.landing += 1;
          }
        } else if(this.altitude >= 300) {
          this.target.heading = this.fms.currentWaypoint().heading;
          this.target.turn = this.fms.currentWaypoint().turn;
        }

        //this has to be outside of the glide slope if, as the plane is no
        //longer on the glide slope once it is on the runway (as the runway is
        //behind the ILS marker)
        if(this.isLanded()) {
          this.target.speed = 0;
        }
      } else if(this.fms.currentWaypoint().navmode == "fix") {
        var fix = this.fms.currentWaypoint().location;
        if(!fix) {
          console.error(this.getCallsign()+" using 'fix' navmode, but no fix location!");
          console.log(this.fms);
          console.log(this.fms.currentWaypoint());
        }
        var vector_to_fix = vsub(this.position, fix);
        var distance_to_fix = distance2d(this.position, fix);
        if((distance_to_fix < 1) ||
          ((distance_to_fix < 10) && (distance_to_fix < aircraft_turn_initiation_distance(this, fix)))) {
          if(!this.fms.atLastWaypoint()) { // if there are more waypoints available
            this.fms.nextWaypoint();  // move to the next waypoint
          }
          else {
            this.cancelFix();
          }
          this.updateStrip();
        } else {
          this.target.heading = vradial(vector_to_fix) - Math.PI;
          this.target.turn = null;
        }
      } else if(this.fms.currentWaypoint().navmode == "hold") {

        var hold = this.fms.currentWaypoint().hold;
        var angle_off_of_leg_hdg = abs(angle_offset(this.heading, this.target.heading));
        if(angle_off_of_leg_hdg < 0.035) { // within ~2° of upwd/dnwd
          var offset = getOffset(this, hold.fixPos);
          if(hold.timer == null && offset[1] < 0 && offset[2] < 2) {  // entering hold, just passed the fix
            hold.timer = -999; // Force aircraft to enter the hold immediately
          }
          // Holding Logic
          if(hold.timer && hold.legLength.includes("min")) {  // time-based hold legs
            if(hold.timer == -1) hold.timer = prop.game.time; // save the time
            else if(prop.game.time >= hold.timer + parseInt(hold.legLength.replace("min",""))*60) { // time to turn
              this.target.heading += Math.PI;   // turn to other leg
              this.target.turn = hold.dirTurns;
              hold.timer = -1; // reset the timer
            }
          else if(hold.legLength.includes("nm")) {  // distance-based hold legs
            // not yet implemented
          }
        }
      }

      } else {
        this.target.heading = this.fms.currentWaypoint().heading;
        this.target.turn = this.fms.currentWaypoint().turn;
      }

      if(this.mode != "landing") {
        this.target.altitude = this.fms.currentWaypoint().altitude;
        this.target.expedite = this.fms.currentWaypoint().expedite;

        this.target.altitude = Math.max(1000, this.target.altitude);

        this.target.speed = this.fms.currentWaypoint().speed;
        this.target.speed = clamp(this.model.speed.min, this.target.speed, this.model.speed.max);
      }

      // If stalling, make like a meteorite and fall to the earth!
      if(this.speed < this.model.speed.min) this.target.altitude = 0;

      //finally, taxi overrides everything
      var was_taxi = false;
      if(this.mode == "taxi") {
        var elapsed = game_time() - this.taxi_start;
        if(elapsed > this.taxi_time) {
          this.mode = "waiting";
          was_taxi = true;
          this.updateStrip();
        }
      }
      else if(this.mode == "waiting") {
        var runway = airport_get().getRunway(this.rwy_dep);
        var position = runway.position;

        this.position[0] = position[0];
        this.position[1] = position[1];
        this.heading     = runway.angle;
        this.altitude    = runway.elevation;
        if (!this.projected &&
            (runway.inQueue(this) == 0) &&
            (was_taxi == true))
        {
          ui_log(this.getCallsign(), " holding short of runway "+this.rwy_dep);
          speech_say([ {type:"callsign", content:this}, {type:"text", content:"holding short of runway "+radio_runway(this.rwy_dep)} ]);
          this.updateStrip();
        }
      }
      else if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.rwy_dep);
        // Altitude Control
        if(this.speed < this.model.speed.min) this.target.altitude = runway.elevation;
        else this.target.altitude = this.fms.currentWaypoint().altitude;

        // Heading Control
        var rwyHdg = airport_get().getRunway(this.rwy_dep).angle;
        if((this.altitude - runway.elevation)<400) this.target.heading = rwyHdg;
        else {
          if(!this.fms.followCheck().sid && this.fms.currentWaypoint().heading == null) { // if no directional instructions available after takeoff
            this.fms.setCurrent({heading:rwyHdg});  // fly runway heading
          }
          this.mode = "cruise";
          this.updateStrip();
        }

        // Speed Control
        this.target.speed = this.model.speed.cruise;  // go fast!
      }

      // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
      if(this.altitude < 10000) {
        if(this.isPrecisionGuided()) this.target.speed = Math.min(this.target.speed, 250);  // btwn 0 and 250
        else this.target.speed = Math.min(this.fms.currentWaypoint().speed, 250); // btwn scheduled speed and 250
      }
    },
    updatePhysics: function() {
      if(this.isTaxiing()) return;
      if(this.hit) {
        this.altitude -= 90 * game_delta(); // 90fps fall rate?...
        this.speed    *= 0.99;
        return;
      } else {

        // TURNING

        if(!this.isLanded() && this.heading != this.target.heading) {
          // Perform standard turns 3 deg/s or 25 deg bank, whichever
          // requires less bank angle.
          // Formula based on http://aviation.stackexchange.com/a/8013
          var turn_rate = clamp(0, 1 / (this.speed / 8.883031), 0.0523598776);
          var turn_amount = turn_rate * game_delta();
          var offset = angle_offset(this.target.heading, this.heading);
          if(abs(offset) < turn_amount) {
            this.heading = this.target.heading;
          } else if((offset < 0 && this.target.turn == null) || this.target.turn == "left") {
            this.heading -= turn_amount;
          } else if((offset > 0 && this.target.turn == null) || this.target.turn == "right") {
            this.heading += turn_amount;
          }
        }

        // ALTITUDE

        var distance = null;
        var expedite_factor = 1.5;
        this.trend = 0;
        if(this.target.altitude < this.altitude - 0.02) {
          distance = -this.model.rate.descent/60 * game_delta();
          if(this.mode == "landing") distance *= 3;
          this.trend -= 1;
        } else if(this.target.altitude > this.altitude + 0.02) {
          var climbrate = this.getClimbRate();
          distance = climbrate/60 * game_delta();
          if(this.mode == "landing") distance *= 1.5;
          this.trend = 1;
        }
        if(distance) {
          if(this.target.expedite) distance *= expedite_factor;
          var offset = this.altitude - this.target.altitude;

          if(abs(offset) < abs(distance)) this.altitude = this.target.altitude;
          else this.altitude += distance;
        }

        if(this.isLanded()) this.trend = 0;

        // SPEED

        var difference = null;
        if(this.target.speed < this.speed - 0.01) {
          difference = -this.model.rate.decelerate * game_delta() / 2;
          if(this.isLanded()) difference *= 3.5;
        } else if(this.target.speed > this.speed + 0.01) {
          difference  = this.model.rate.accelerate * game_delta() / 2;
          difference *= crange(0, this.speed, this.model.speed.min, 2, 1);
        }
        if(difference) {
          var offset = this.speed - this.target.speed;

          if(abs(offset) < abs(difference)) this.speed = this.target.speed;
          else this.speed += difference;
        }
      }

      if(!this.position) return;

      // Trailling
      if(this.position_history.length == 0) this.position_history.push([this.position[0], this.position[1], game_time()/game_speedup()]);
      else if(abs((game_time()/game_speedup()) - this.position_history[this.position_history.length-1][2]) > 4/game_speedup()) {
        this.position_history.push([this.position[0], this.position[1], game_time()/game_speedup()]);
      }

      var angle = this.heading;
      var scaleSpeed = this.speed * 0.000514444 * game_delta(); // knots to m/s
      if (prop.game.option.get('simplifySpeeds') == 'no') {
        // Calculate the true air speed as indicated airspeed * 1.6% per 1000'
        scaleSpeed *= 1 + (this.altitude * 0.000016);

        // Calculate movement including wind assuming wind speed
        // increases 2% per 1000'
        var wind = airport_get().wind;
        var vector;
        if (this.isLanded()) {
          vector = vscale([sin(angle), cos(angle)], scaleSpeed);
        }
        else {
          var crab_angle = 0;

          // Compensate for crosswind while tracking a fix or on ILS
          if (this.fms.currentWaypoint().navmode == "fix" || this.mode == "landing")
          {
            var offset = angle_offset(this.heading, wind.angle + Math.PI);
            crab_angle = Math.asin((wind.speed * Math.sin(offset)) /
                                   this.speed);
          }
          vector = vadd(vscale(vturn(wind.angle + Math.PI),
                               wind.speed * 0.000514444 * game_delta()),
                        vscale(vturn(angle + crab_angle),
                               scaleSpeed));
        }
        this.ds = vlen(vector);
        this.groundSpeed = this.ds / 0.000514444 / game_delta();
        this.groundTrack = vradial(vector);
        this.position = vadd(this.position, vector);
      }
      else {
        this.ds = scaleSpeed;
        this.groundSpeed = this.speed;
        this.groundTrack = this.heading;
        this.position = vadd(this.position, vscale([sin(angle), cos(angle)], scaleSpeed));
      }
      this.distance = vlen(this.position);
      this.radial = vradial(this.position);
      if (this.radial < 0) this.radial += Math.PI*2;

      if(airport_get().perimeter) { // polygonal airspace boundary
        var inside = point_in_area(this.position, airport_get().perimeter);
        if (inside != this.inside_ctr) this.crossBoundary(inside);
      }
      else {  // simple circular airspace boundary
        var inside = (this.distance <= airport_get().ctr_radius &&
                      this.altitude <= airport_get().ctr_ceiling);
        if (inside != this.inside_ctr) this.crossBoundary(inside);
      }
    },
    updateWarning: function() {
      // Ignore other aircraft while taxiing
      if (this.isTaxiing()) return;

      var warning = false;

      // restricted areas
      // players are penalized for each area entry
      if (this.position) {
        for (i in this.restricted.list) {
          /*
          Polygon matching procedure:

          1. Filter polygons by aircraft altitude
          2. For other polygons, measure distance to it (distance_to_poly), then
          substract travelled distance every turn
              If distance is about less than 10 seconds of flight,
              assign distance equal to 10 seconds of flight,
              otherwise planes flying along the border of entering at shallow angle
              will cause too many checks.
          3. if distance has reached 0, check if the aircraft is within the poly.
              If not, redo #2.
          */
          var area = this.restricted.list[i];

          // filter only those relevant by height
          if (area.data.height < this.altitude) {
            area.range = null;
            area.inside = false;
            continue;
          }

          // count distance untill the next check
          if (area.range) {
            area.range -= this.ds;
          }

          // recalculate for new areas or those that should be checked
          if (!area.range || area.range <= 0) {
            var new_inside = point_in_poly(this.position, area.data.coordinates);
            // ac has just entered the area: .inside is still false, but st is true
            if (new_inside && !area.inside) {
              prop.game.score.restrictions += 1;
              area.range = this.speed * 1.85 / 3.6 * 50 / 1000; // check in 50 seconds
              // speed is kts, range is km.
              // if a plane got into restricted area, don't check it too often
            }
            else {
              // don't calculate more often than every 10 seconds
              area.range = Math.max(
                this.speed * 1.85 / 36 / 1000 * 10,
                distance_to_poly(this.position, area.data.coordinates));
            }
            area.inside = new_inside;
          }
        }
        // raise warning if in at least one restricted area
        $.each(this.restricted.list, function(k, v) {
          warning = warning || v.inside;
        })
      }

      if (this.terrain_ranges && !this.isLanded()) {
        var terrain = prop.airport.current.terrain,
            prev_level = this.terrain_ranges[this.terrain_level],

            ele = ceil(this.altitude, 1000),
            curr_ranges = this.terrain_ranges[ele];

        if (ele != this.terrain_level) {
          for (var lev in prev_level) {
            prev_level[lev] = Infinity;
          }
          this.terrain_level = ele;
        }

        for (var id in curr_ranges) {
          curr_ranges[id] -= this.ds;
          //console.log(curr_ranges[id]);

          if (curr_ranges[id] < 0 || curr_ranges[id] == Infinity) {
            var area = terrain[ele][id],
                status = point_to_mpoly(this.position, area, id);
            if (status.inside) {
              this.altitude = 0;
              if (!this.hit) {
                this.hit = true;
                console.log("hit terrain");
                ui_log(true, this.getCallsign() + " collided with terrain in controlled flight");
                speech_say([ {type:"callsign", content:this}, {type:"text", content:", we're going down!"} ]);
                prop.game.score.hit += 1;
              }
            } else {
              curr_ranges[id] = Math.max(.2, status.distance);
              // console.log(this.getCallsign(), 'in', curr_ranges[id], 'km from', id, area[0].length);
            }
          }
        }
      }

      this.warning = warning;
    },
    updateStrip: function() {
      if (this.projected) return;
      var heading  = this.html.find(".heading");
      var altitude = this.html.find(".altitude");
      var destination = this.html.find(".destination");
      var speed    = this.html.find(".speed");
      var wp = this.fms.currentWaypoint();

      // Update fms.following
      this.fms.followCheck();

      // Remove all old styling
      heading.removeClass("runway hold waiting taxi lookingGood allSet");
      altitude.removeClass("runway hold waiting taxi lookingGood allSet");
      destination.removeClass("runway hold waiting taxi lookingGood allSet");
      speed.removeClass("runway hold waiting taxi lookingGood allSet");

      // Populate strip fields with default values
      heading.text(heading_to_string(wp.heading));
      (wp.altitude) ? altitude.text(wp.altitude) : altitude.text("-");
      destination.text(this.destination || airport_get().icao);
      speed.text(wp.speed);

      // When at the apron...
      if(this.mode == "apron") {
        heading.addClass("runway");
        heading.text("apron");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
      }

      // When taxiing...
      else if(this.mode == "taxi") {
        heading.addClass("runway");
        heading.text("taxi");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
        if(this.taxi_next) altitude.text("ready");
      }

      // When waiting in the takeoff queue
      else if(this.mode == "waiting") {
        heading.addClass("runway");
        heading.text("ready");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
      }

      // When taking off...
      else if(this.mode == "takeoff") {
        heading.text("takeoff");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("lookingGood");
        }
      }

      // When in normal flight...
      else if(this.mode == "cruise") {
        if(wp.navmode == "fix") {
          heading.text((wp.fix[0]=='_') ? "[RNAV]" : wp.fix);
          if(this.fms.following.sid) {
            heading.addClass("allSet");
            altitude.addClass("allSet");
            destination.addClass("allSet");
            speed.addClass("allSet");
          }
          if(this.fms.following.star) {
            heading.addClass("followingSTAR");
            if(this.fms.currentWaypoint().fixRestrictions.altitude)
              altitude.addClass("followingSTAR");
            destination.text(this.fms.following.star + '.' + airport_get().icao);
            destination.addClass("followingSTAR");
            if(this.fms.currentWaypoint().fixRestrictions.speed)
              speed.addClass("followingSTAR");
          }
        }
        else if(wp.navmode == "hold") {
          heading.text("holding");
          heading.addClass("hold");
        }
        else if(wp.navmode == "rwy") {  // attempting ILS intercept
          heading.addClass("lookingGood");
          heading.text("intercept");
          altitude.addClass("lookingGood");
          destination.addClass("lookingGood");
          destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
          speed.addClass("lookingGood");
        }
      }

      // When established on the ILS...
      else if(this.mode == "landing") {
        heading.addClass("allSet");
        heading.text("on ILS");
        altitude.addClass("allSet");
        altitude.text("GS");
        destination.addClass("allSet");
        destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
        speed.addClass("allSet");
      }
    },
    updateAuto: function() {
    },
    update: function() {
      if(prop.aircraft.auto.enabled) {
        this.updateAuto();
      }
      this.updateTarget();
      this.updatePhysics();
    },
    addConflict: function(conflict, other) {
      this.conflicts[other.getCallsign()] = conflict;
    },
    checkConflict: function(other) {
      if (this.conflicts[other.getCallsign()]) {
        this.conflicts[other.getCallsign()].update();
        return true;
      }
      return false;
    },
    hasAlerts: function() {
      var a = [false, false];
      var c = null;
      for (var i in this.conflicts) {
        c = this.conflicts[i].hasAlerts();
        a[0] = (a[0] || c[0]);
        a[1] = (a[1] || c[1]);
      }
      return a;
    },
    removeConflict: function(other) {
      delete this.conflicts[other.getCallsign()];
    },
  };
});

window.aircraft_init_pre = function aircraft_init_pre() {
    prop.aircraft = {};
    prop.aircraft.models = {};
    prop.aircraft.callsigns = [];
    prop.aircraft.list = [];
    prop.aircraft.current  = null;

    prop.aircraft.auto = {
        enabled: false,
    };
}

window.aircraft_init = function aircraft_init() {};

window.aircraft_auto_toggle = function aircraft_auto_toggle() {
  prop.aircraft.auto.enabled = !prop.aircraft.auto.enabled;
}

window.aircraft_generate_callsign = function aircraft_generate_callsign(airline_name) {
  var airline = airline_get(airline_name);
  if(!airline) {
    console.warn("Airline not found:" + airline_name);
    return 'airline-' + airline_name + '-not-found';
  }
  return airline.generateFlightNumber();
}

window.aircraft_callsign_new = function aircraft_callsign_new(airline) {
  var callsign = null;
  var hit = false;
  while(true) {
    callsign = aircraft_generate_callsign(airline);
    if (prop.aircraft.callsigns.indexOf(callsign) == -1)
      break;
  }
  prop.aircraft.callsigns.push(callsign);
  return callsign;
}

window.aircraft_new = function aircraft_new(options) {
  var airline = airline_get(options.airline);
  return airline.generateAircraft(options);
}

window.aircraft_get_nearest = function aircraft_get_nearest(position) {
  var nearest  = null;
  var distance = Infinity;
  for(var i=0;i<prop.aircraft.list.length;i++) {
    var d = distance2d(prop.aircraft.list[i].position, position);
    if(d < distance && prop.aircraft.list[i].isVisible() && !prop.aircraft.list[i].hit) {
      distance = d;
      nearest = i;
    }
  }
  return [prop.aircraft.list[nearest], distance];
}

window.aircraft_add = function aircraft_add(model) {
  prop.aircraft.models[model.icao.toLowerCase()] = model;
}

window.aircraft_visible = function aircraft_visible(aircraft, factor) {
  if(!factor) factor=1;
  return (vlen(aircraft.position) < airport_get().ctr_radius * factor);
}

window.aircraft_remove_all = function aircraft_remove_all() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].cleanup();
  }
  prop.aircraft.list = [];
}

window.aircraft_update = function aircraft_update() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].update();
  }
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].updateWarning();

    InnerLoop: for (var j=i+1;j<prop.aircraft.list.length;j++) {
      var that = prop.aircraft.list[i];
      var other = prop.aircraft.list[j];

      if (that.checkConflict(other)) {
        continue InnerLoop;
      }

      // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
      // no violation can occur in this case.
      // Variation of:
      // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
      var dx = Math.abs(that.position[0] - other.position[0]);
      var dy = Math.abs(that.position[1] - other.position[1]);
      if ((dx > 14.816) || (dy > 14.816)) {
        continue InnerLoop;
      }
      else {
        new zlsa.atc.Conflict(that, other);
      }
    }
  }
  for(var i=prop.aircraft.list.length-1;i>=0;i--) {
    var remove = false;
    var aircraft = prop.aircraft.list[i];
    var is_visible = aircraft_visible(aircraft);
    if(aircraft.isStopped() && aircraft.category == "arrival") {
      prop.game.score.windy_landing += aircraft.scoreWind('landed');
      ui_log(aircraft.getCallsign() + " switching to ground, good day");
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", switching to ground, good day"} ]);
      prop.game.score.arrival += 1;
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", radar contact lost"} ]);
      remove = true;
    }
    // Clean up the screen from aircraft that are too far
    if((!aircraft_visible(aircraft,2) && !aircraft.inside_ctr) && aircraft.fms.currentWaypoint().navmode == 'heading'){
      if(aircraft.category == "arrival") {
        remove = true;
      }
      else if(aircraft.category == "departure") {
        remove = true;
      }
    }
    if(remove) {
      aircraft_remove(aircraft);
      i-=1;
    }
  }
}

// Calculate the turn initiation distance for an aircraft to navigate between two fixes.
// References:
// - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
// - The Avionics Handbook, ch 15
window.aircraft_turn_initiation_distance = function aircraft_turn_initiation_distance(a, fix) {
  var index = a.fms.indexOfCurrentWaypoint().wp;
  if(index >= a.fms.waypoints().length-1) return 0; // if there are no subsequent fixes, fly over 'fix'
  var speed = a.speed * (463/900); // convert knots to m/s
  var bank_angle = radians(25); // assume nominal bank angle of 25 degrees for all aircraft
  var g = 9.81;                 // acceleration due to gravity, m/s*s
  var nextfix = a.fms.waypoint(a.fms.indexOfCurrentWaypoint().wp+1).location;
  if(!nextfix) return 0;
  var nominal_new_course = vradial(vsub(nextfix, fix));
  if( nominal_new_course < 0 ) nominal_new_course += Math.PI * 2;
  var current_heading = a.heading;
  if (current_heading < 0) current_heading += Math.PI * 2;
  var course_change = Math.abs(degrees(current_heading) - degrees(nominal_new_course));
  if (course_change > 180) course_change = 360 - course_change;
  course_change = radians(course_change);
  var turn_radius = speed*speed / (g * Math.tan(bank_angle));  // meters
  var l2 = speed; // meters, bank establishment in 1s
  var turn_initiation_distance = turn_radius * Math.tan(course_change/2) + l2;
  return turn_initiation_distance / 1000; // convert m to km
}

// Get aircraft by entity id
window.aircraft_get = function aircraft_get(eid) {
  if(eid == null) return null;
  if(prop.aircraft.list.length > eid && eid >= 0) // prevent out-of-range error
    return prop.aircraft.list[eid];
  return null;
}

// Get aircraft by callsign
window.aircraft_get_by_callsign = function aircraft_get_by_callsign(callsign) {
  callsign = String(callsign);
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i];
  return null;
}

// Get aircraft's eid by callsign
window.aircraft_get_eid_by_callsign = function aircraft_get_eid_by_callsign(callsign) {
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i].eid;
  return null;
}

window.aircraft_model_get = function aircraft_model_get(icao) {
  if (!(icao in prop.aircraft.models)) {
    var model = new Model({
      icao: icao,
      url: "assets/aircraft/"+icao+".json",
    });
    prop.aircraft.models[icao] = model;
  }
  return prop.aircraft.models[icao];
}

},{}],4:[function(require,module,exports){
window.airline_init_pre = function airline_init_pre() {
    prop.airline = {};
    prop.airline.airlines = {};
};

/**
 * An aircrcraft operating agency
 *
 * @class Airline
 */
zlsa.atc.Airline = Fiber.extend(function() {
  return {
    /**
     * Create new airline
     */
    init: function (icao, options) {
      /** ICAO airline designation */
      this.icao = icao;

      /** Agency name */
      this.name = "Default airline";

      /** Radio callsign */
      this.callsign = 'Default';

      /** Parameters for flight number generation */
      this.flightNumberGeneration = {
        /** How many characters in the flight number */
        length: 3,
        /** Whether to use alphabetical characters */
        alpha: false,
      };

      /** Named weighted sets of aircraft */
      this.fleets = {
        default: [],
      };

      this.loading = true;
      this.loaded = false;
      this.priorityLoad = false;
      this._pendingAircraft = [];
      this.parse(options);

      if (options.url) {
          this.load(options.url);
      }
    },

    /**
     * Initialize object from data
     */
    parse: function (data) {
        if (data.icao) {
              this.icao = data.icao;
        }

        if (data.name) {
            this.name = data.name;
        }

        if (data.callsign) {
            this.callsign = data.callsign.name;

            if (data.callsign.length) {
                this.flightNumberGeneration.length = data.callsign.length;
            }

            this.flightNumberGeneration.alpha = (data.callsign.alpha === true);
        }

        if (data.fleets) {
            this.fleets = data.fleets;
        } else if (data.aircraft) {
            this.fleets.default = data.aircraft;
        }

        for (var f in this.fleets) {
            for (var j = 0; j < this.fleets[f].length; j++) {
                this.fleets[f][j][0] = this.fleets[f][j][0].toLowerCase();
            }
        }
    },

    /**
     * Load the data for this airline
     */
    load: function(url) {
      this._url = url;
      if (this.loaded)
        return;
      zlsa.atc.loadAsset({url: url,
                          immediate: this.priorityLoad})
        .done(function (data) {
          this.parse(data);
          this.loading = false;
          this.loaded = true;
          this.validateFleets();
          this._generatePendingAircraft();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          this._pendingAircraft = [];
          console.error("Unable to load airline/" + this.icao
                        + ": " + textStatus);
        }.bind(this));
    },

    /**
     * Return a random ICAO aircraft designator from the given fleet
     *
     * If no fleet is specified the default fleet is used
     */
    chooseAircraft: function (fleet) {
      if (!fleet)
        fleet = 'default';

      try {
        return choose_weight(this.fleets[fleet.toLowerCase()]);
      }
      catch (e) {
        console.log("Unable to find fleet " + fleet
                    + " for airline " + this.icao);
        throw e;
      }
    },

    /**
     * Create an aircraft
     */
    generateAircraft: function(options) {
      if (!this.loaded) {
        if (this.loading) {
          this._pendingAircraft.push(options);
          if (!this.priorityLoad) {
            zlsa.atc.loadAsset({url: this._url,
                                immediate: true});
            this.priorityLoad = true;
          }
          return true;
        }
        else {
          console.warn("Unable to spawn aircraft for airline/" + this.icao
                       + " as loading failed");
          return false;
        }
      }
      return this._generateAircraft(options);
    },

    /**
     * Create a flight number/identifier
     */
    generateFlightNumber: function () {
      var flightNumberLength = this.flightNumberGeneration.length;
      var flightNumber = "";

      var list = "0123456789";

      // Start with a number other than zero
      flightNumber += choose(list.substr(1));

      if (this.flightNumberGeneration.alpha) {
        for (var i=0; i<flightNumberLength - 3; i++)
          flightNumber += choose(list);
        list = "abcdefghijklmnopqrstuvwxyz";
        for (var i=0; i<2; i++)
          flightNumber += choose(list);
      } else {
        for (var i=1; i<flightNumberLength;i++)
          flightNumber += choose(list);
      }
      return flightNumber;
    },

    /**
     * Checks all fleets for valid aircraft identifiers and log errors
     */
    validateFleets: function () {
      for (var f in this.fleets) {
        for (var j=0;j<this.fleets[f].length;j++) {
          // Preload the aircraft model
          aircraft_model_get(this.fleets[f][j][0]);

          if (typeof this.fleets[f][j][1] != "number") {
            console.warn("Airline " + this.icao.toUpperCase()
                         + " uses non numeric weight for aircraft " +
                         this.fleets[f][j][0] + ", expect errors");
          }
        }
      }
    },

    _generateAircraft: function(options) {
      if(!options.callsign) options.callsign = aircraft_callsign_new(options.airline);

      if(!options.icao) {
        options.icao = this.chooseAircraft(options.fleet);
      }
      var model = aircraft_model_get(options.icao.toLowerCase());
      return model.generateAircraft(options);
      var icao = options.icao.toLowerCase();
    },

    /**
     * Generate aircraft which were queued while the model loaded
     */
    _generatePendingAircraft: function() {
      $.each(this._pendingAircraft, function (idx, options) {
        this._generateAircraft(options);
      }.bind(this));
      this._pendingAircraft = null;
    },
  };
});

window.airline_get = function airline_get(icao) {
  icao = icao.toLowerCase();
  if (!(icao in prop.airline.airlines)) {
    var airline = new zlsa.atc.Airline(icao,
                                       {url: "assets/airlines/"+icao+".json",});
    prop.airline.airlines[icao] = airline;
  }
  return prop.airline.airlines[icao];
};

},{}],5:[function(require,module,exports){
/**************************** AIRCRAFT GENERATION ****************************/
/**
 * Calls constructor of the appropriate arrival type
 */
zlsa.atc.ArrivalFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.ArrivalBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.ArrivalCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.ArrivalWave(airport, options);
    if (options.type == 'surge')
      return new zlsa.atc.ArrivalSurge(airport, options);
    log(airport.icao + ' using unsupported arrival type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " arrival stream not given type!", LOG_WARNING);
};

/** Generate arrivals at random, averaging the specified arrival rate
 */
zlsa.atc.ArrivalBase = Fiber.extend(function(base) {
  return {
    init: function(airport, options) {
      this.airlines = [];
      this.airport = airport;
      this.altitude = [1000, 1000];
      this.frequency = 0;
      this.heading = null;
      this.radial = 0;
      this.speed = 250;
      this.timeout = null;
      this.fixes = [];
      this.route = "";

      this.parse(options);
    },
    /** Arrival Stream Settings
     ** airlines: {array of array} List of airlines with weight for each
     ** altitude: {array or integer} Altitude in feet or range of altitudes
     ** frequency: {integer} Arrival rate along this stream, in aircraft per hour (acph)
     ** heading: {integer} Heading to fly when spawned, in degrees (don't use w/ fixes)
     ** fixes: {array} Set of fixes to traverse (eg. for STARs). Spawns at first listed.
     ** radial: {integer} bearing from airspace center to spawn point (don't use w/ fixes)
     ** speed: {integer} Speed in knots of spawned aircraft
     */
    parse: function(options) {
      var params = ['airlines', 'altitude', 'frequency', 'speed'];
      for(var i in params) {  // Populate the data
        if(options[params[i]]) this[params[i]] = options[params[i]];
      }

      // Make corrections to data
      if(options.radial) this.radial = radians(options.radial);
      if(options.heading) this.heading = radians(options.heading);
      if(typeof this.altitude == "number") this.altitude = [this.altitude, this.altitude];
      if(options.route) this.route = options.route;
      else if(options.fixes) {
        for (var i=0; i<options.fixes.length; i++)
          this.fixes.push({fix: options.fixes[i]});
      }

      // Pre-load the airlines
      $.each(this.airlines, function (i, data) {
        airline_get(data[0].split('/')[0]);
      });
    },
    /** Backfill STAR routes with arrivals closer than the spawn point
     ** Aircraft spawn at the first point defined in the route of the entry in
     ** "arrivals" in the airport json file. When that spawn point is very far
     ** from the airspace boundary, it obviously takes quite a while for them
     ** to reach the airspace. This function spawns (all at once) arrivals along
     ** the route, between the spawn point and the airspace boundary, in order to
     ** ensure the player is not kept waiting for their first arrival aircraft.
     */
    preSpawn: function() {
      var star, entry;
      var runway = this.airport.runway;

      //Find STAR & entry point
      var pieces = array_clean(this.route.split('.'));
      for(var i in pieces) {
        if(this.airport.stars.hasOwnProperty(pieces[i])) {
          star = pieces[i];
          if(i>0) entry = pieces[i-1];
        }
      }

      // Find the last fix that's outside the airspace boundary
      var fixes = this.airport.getSTAR(star, entry, runway);
      var lastFix = fixes[0][0];
      var extra = 0;  // dist btwn closest fix outside a/s and a/s border, nm
      for(var i in fixes) {
        var fix = fixes[i][0];
        var pos = this.airport.fixes[fix].position;
        var fix_prev = (i>0) ? fixes[i-1][0] : fix;
        var pos_prev = (i>0) ? this.airport.fixes[fix_prev].position : pos;
        if(inAirspace(pos)) {
          if(i>=1) extra = nm(dist_to_boundary(pos_prev));
          break;
        }
        else fixes[i][2] = nm(distance2d(pos_prev, pos));  // calculate distance between fixes
      }

      // Determine spawn offsets
      var spawn_offsets = [];
      var entrail_dist = this.speed / this.frequency;   // distance between succ. arrivals, nm
      var dist_total = array_sum($.map(fixes,function(v){return v[2]})) + extra;
      for(var i=entrail_dist; i<dist_total; i+=entrail_dist) {
        spawn_offsets.push(i);
      }

      // Determine spawn points
      var spawn_positions = [];
      for(var i in spawn_offsets) { // for each new aircraft
        for(var j=1; j<fixes.length; j++) { // for each fix ahead
          if(spawn_offsets[i] > fixes[j][2]) {  // if point beyond next fix
            spawn_offsets[i] -= fixes[j][2];
            continue;
          }
          else {  // if point before next fix
            var next = airport_get().fixes[fixes[j][0]];
            var prev = airport_get().fixes[fixes[j-1][0]];
            var brng = bearing(prev.gps, next.gps);
            spawn_positions.push({
              pos: fixRadialDist(prev.gps, brng, spawn_offsets[i]),
              nextFix: fixes[j][0],
              heading: brng
            });
            break;
          }
        }
      }

      // Spawn aircraft along the route, ahead of the standard spawn point
      for(var i in spawn_positions) {
        var airline = choose_weight(this.airlines);
        var fleet = "";
        if(airline.indexOf('/') > -1) {
          fleet = airline.split('/')[1];
          airline   = airline.split('/')[0];
        }

        aircraft_new({
          category:  "arrival",
          destination:airport_get().icao,
          airline:   airline,
          fleet:     fleet,
          altitude:  10000, // should eventually look up altitude restrictions and try to spawn in an appropriate range
          heading:   spawn_positions[i].heading || this.heading,
          waypoints: this.fixes,
          route:     this.route,
          position:  new Position(spawn_positions[i].pos, airport_get().position, airport_get().magnetic_north, 'GPS').position,
          speed:     this.speed,
          nextFix:   spawn_positions[i].nextFix
        });
      }
    },
    /** Stop this arrival stream
     */
    stop: function() {
      if(this.timeout) game_clear_timeout(this.timeout);
    },
    /** Start this arrival stream
     */
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
      if(this.route) this.preSpawn();
    },
    /** Spawn a new aircraft
     */
    spawnAircraft: function(args) {
      var start_flag   = args[0];
      var timeout_flag = args[1] || false;
      var altitude = round(random(this.altitude[0], this.altitude[1])/1000)*1000;
      var message = !(game_time() - this.airport.start < 2);
      if(this.fixes.length > 1) {  // spawn at first fix
        var position = airport_get().getFix(this.fixes[0].fix); // spawn at first fix
        var heading = vradial(vsub(airport_get().getFix(this.fixes[1].fix), position));
      }
      else if(this.route) { // STAR data is present
        var star = airport_get().getSTAR(this.route.split('.')[1],this.route.split('.')[0],airport_get().runway);
        var position = airport_get().getFix(star[0][0]);
        var heading = vradial(vsub(airport_get().getFix(star[1][0]), position));
      }
      else {  // spawn outside the airspace along 'this.radial'
        var distance = 2 * this.airport.ctr_radius;
        var position = [sin(this.radial) * distance, cos(this.radial) * distance];
        var heading = this.heading || this.radial + Math.PI;
      }
      var airline = choose_weight(this.airlines);
      if(airline.indexOf('/') > -1) {
        var fleet = airline.split('/')[1];
        airline   = airline.split('/')[0];
      }

      aircraft_new({
        category:  "arrival",
        destination:airport_get().icao,
        airline:   airline,
        fleet:     fleet,
        altitude:  altitude,
        heading:   heading,
        waypoints: this.fixes,
        route:     this.route,
        message:   message,
        position:  position,
        speed:     this.speed
      });

      if(timeout_flag) {
        this.timeout = game_timeout(this.spawnAircraft,
          this.nextInterval(), this, [null, true]);
      }
    },
    /** Determine delay until next spawn
     */
    nextInterval: function() {
      var min_entrail = 5.5;  // nautical miles
      var min_interval = min_entrail * (3600/this.speed); // in seconds
      var tgt_interval = 3600/this.frequency;
      if(tgt_interval < min_interval) {
        tgt_interval = min_interval;
        log("Requested arrival rate of "+this.frequency+" acph overridden to " +
          "maintain minimum of "+min_entrail+" miles entrail on arrival stream " +
          "following route "+ $.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_INFO);
      }
      var max_interval = tgt_interval + (tgt_interval - min_interval);
      return random(min_interval, max_interval);
    }
  };
});

/** Generate arrivals in cyclic pattern
 ** Arrival rate varies as pictured below. Rate at which the arrival rate
 ** increases or decreases remains constant throughout the cycle.
 ** |---o---------------o---------------o---------------o-----------| < - - - - - - max arrival rate
 ** | o   o           o   o           o   o           o   o         |   +variation
 ** o-------o-------o-------o-------o-------o-------o-------o-------o < - - - - - - avg arrival rate
 ** |         o   o |         o   o           o   o           o   o |   -variation
 ** |-----------o---|-----------o---------------o---------------o---| < - - - - - - min arrival rate
 ** |<---period---->|           |<---period---->|
 */
zlsa.atc.ArrivalCyclic = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;  // game time
      this.offset = 0;      // Start at the average, and increasing
      this.period = 1800;   // 30 minute cycle
      this.variation = 0;   // amount to deviate from the prescribed frequency

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
    },
    /** Arrival Stream Settings
     ** @param {integer} period - (optional) length of a cycle, in minutes
     ** @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.variation) this.variation = options.variation;
    },
    start: function() {
      this.cycleStart = prop.game.time - this.offset;
      var delay = random(0, 3600 / this.frequency);
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / (this.period/4); // progress in current quarter-period
      if(done >= 4) {
        this.cycleStart += this.period;
        return 3600/(this.frequency + (done-4)*this.variation);
      }
      else if(done <= 1)
        return 3600/(this.frequency + done*this.variation);
      else if(done <= 2)
        return 3600/(this.frequency + (2*(this.period - 2*t)/this.period)*this.variation);
      else if(done <= 3)
        return 3600/(this.frequency - (done-2)*this.variation);
      else if(done <  4)
        return 3600/(this.frequency - (4*(this.period - t) / this.period)*this.variation);
    }
  };
});

/** Generate arrivals in a repeating wave
 ** Arrival rate varies as pictured below. Arrival rate will increase
 ** and decrease faster when changing between the lower/higher rates.
 ** ------------o-o-o---------------------------------------+-----------o-o < - - - - - max arrival rate
 **        o             o                                  |      o      |       ^
 **    o                     o                              |  o          |  +variation
 **  o                         o                            |o            |       v
 ** o-------------------------- o---------------------------o-------------+ < - - - - - avg arrival rate
 ** |                            o                         o|             |       ^
 ** |                              o                     o  |             |  -variation
 ** |                                  o             o      |             |       v
 ** +---------------------------------------o-o-o-----------+-------------+ < - - - - - min arrival rate
 ** |                                                       |
 ** |<  -  -  -  -  -  -  -  - period -  -  -  -  -  -  -  >|
 */
zlsa.atc.ArrivalWave = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;  // game time
      this.offset = 0;      // Start at the average, and increasing
      this.period = 1800;   // 30 minute cycle
      this.variation = 0;   // amount to deviate from the prescribed frequency

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
      this.clampSpawnRate(5.5); // minimum of 5.5nm entrail
    },
    /** Arrival Stream Settings
     ** @param {integer} period - (optional) length of a cycle, in minutes
     ** @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.variation) this.variation = options.variation;
    },
    /** Ensures the spawn rate will be at least the required entrail distance
     ** @param {number} entrail_dist - minimum distance between successive arrivals, in nm
     */
    clampSpawnRate: function(entrail_dist) {
      var entrail_interval = entrail_dist * (3600/this.speed);
      var min_interval = 3600 / (this.frequency + this.variation);

      if(min_interval < entrail_interval) {
        var diff = entrail_interval - min_interval;
        if(diff <= 3600/this.variation) {  // can reduce variation to achieve acceptable spawn rate
          log("Requested arrival rate variation of +/-"+this.variation+" acph reduced to " +
            "maintain minimum of "+entrail_dist+" miles entrail on arrival stream following " +
            "route "+$.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_WARNING);
          this.variation = this.variation - 3600/diff; // reduce the variation
        }
        else {  // need to reduce frequency to achieve acceptable spawn rate
          log("Requested arrival rate of "+this.frequency+" acph overridden to " +
            "maintain minimum of "+entrail_dist+" miles entrail on arrival stream " +
            "following route "+ $.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_WARNING);
          this.variation = 0; // make spawn at constant interval
          this.frequency = 3600/entrail_interval; // reduce the frequency
        }
      }
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / this.period; // progress in period
      if(done >= 1) this.cycleStart += this.period;
      var rate = this.frequency + this.variation*Math.sin(done*Math.PI*2);
      return 3600/rate;
    },
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.cycleStart = prop.game.time - this.offset + delay;
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
  };
});

/** Generate arrivals in a repeating surge
 ** Arrival rate goes from very low and steeply increases to a
 ** sustained "arrival surge" of densely packed aircraft.
 ** o o o o o o o o o o - - - - - - - - - - - o o o o o o o o o o-----+ < - - - max arrival rate (n*this.factor)
 ** o                 o                       o                 o     |
 ** o                 o                       o                 o     |   x(this.factor)
 ** o                 o                       o                 o     |
 ** o - - - - - - - - o o o o o o o o o o o o o - - - - - - - - o o o-+ < - - - min arrival rate (n)
 ** |<--- up time --->|<----- down time ----->|<--- up time --->|
 */
zlsa.atc.ArrivalSurge = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;      // game time
      this.offset = 0;          // Start at the beginning of the surge
      this.period = 1800;       // 30 minute cycle
      this.entrail = [5.5, 10]; // miles entrail during the surge [fast,slow]

      // Calculated
      this.uptime = 0;      // time length of surge, in minutes
      this.acph_up = 0;     // arrival rate when "in the surge"
      this.acph_dn = 0;     // arrival rate when not "in the surge"

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
      this.shapeTheSurge();
    },
    /** Arrival Stream Settings
     ** @param {integer} period - Optionally specify the length of a cycle in minutes
     ** @param {integer} offset - Optionally specify the center of the wave in minutes
     ** @param {array} entrail - 2-element array with [fast,slow] nm between each
     **                          successive arrival. Note that the entrail distance on
     **                          the larger gap ("slow") will be adjusted slightly in
     **                          order to maintain the requested frequency. This is
     **                          simply due to the fact that we can't divide perfectly
     **                          across each period, so we squish the gap a tiny bit to
     **                          help us hit the mark on the aircraft-per-hour rate.
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.entrail) this.entrail = options.entrail;
    },
    /** Determines the time spent at elevated and slow spawn rates
     */
    shapeTheSurge: function() {
      this.acph_up = this.speed / this.entrail[0];
      this.acph_dn = this.speed / this.entrail[1];  // to help the uptime calculation
      this.uptime = (this.period*this.frequency - this.period*this.acph_dn) /
                    (this.acph_up - this.acph_dn);
      this.uptime -= this.uptime%(3600/this.acph_up);
      this.acph_dn = Math.floor(this.frequency*this.period/3600 -
          Math.round(this.acph_up*this.uptime/3600)) * 3600/(this.period-this.uptime);      // adjust to maintain correct acph rate

      // Verify we can comply with the requested arrival rate based on entrail spacing
      if(this.frequency > this.acph_up) {
        log(this.airport.icao+": TOO MANY ARRIVALS IN SURGE! Requested: "
          +this.frequency+"acph | Acceptable Range for requested entrail distance: "
          +Math.ceil(this.acph_dn)+"acph - "+Math.floor(this.acph_up)+"acph", LOG_WARNING);
        this.frequency = this.acph_up;
        this.acph_dn = this.acph_up;
      }
      else if(this.frequency < this.acph_dn) {
        log(this.airport.icao+": TOO FEW ARRIVALS IN SURGE! Requested: "
          +this.frequency+"acph | Acceptable Range for requested entrail distance: "
          +Math.ceil(this.acph_dn)+"acph - "+Math.floor(this.acph_up)+"acph", LOG_WARNING);
        this.frequency = this.acph_dn;
        this.acph_up = this.acph_dn;
      }
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / this.period; // progress in period
      var interval_up = 3600/this.acph_up;
      var interval_dn = 3600/this.acph_dn;
      if(done >= 1) {
        this.cycleStart += this.period;
        return interval_up;
      }
      if(t <= this.uptime) {  // elevated spawn rate
        return interval_up;
      }
      else {  // reduced spawn rate
        var timeleft = this.period - t;
        if(timeleft > interval_dn + interval_up) { // plenty of time until new period
          return interval_dn;
        }
        else if(timeleft > interval_dn) {  // next plane will delay the first arrival of the next period
          return interval_dn - (t+interval_dn+interval_up - this.period);
        }
        else {  // next plane is first of elevated spawn rate
          this.cycleStart += this.period;
          return interval_up;
        }
      }
    },
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.cycleStart = prop.game.time - this.offset + delay;
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
  };
});

/** Calls constructor of the appropriate arrival type
 */
zlsa.atc.DepartureFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.DepartureBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.DepartureCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.DepartureWave(airport, options);
    log(airport.icao + ' using unsupported departure type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " departure stream not given type!", LOG_WARNING);
};

/** Generate departures at random, averaging the specified spawn rate
 */
zlsa.atc.DepartureBase = Fiber.extend(function(base) {
  return {
    /** Initialize member variables with default values
     */
    init: function(airport, options) {
      this.airlines = [];
      this.airport = airport;
      this.destinations = [0];
      this.frequency = 0;
      this.timeout = null;

      this.parse(options);
    },
    /** Departure Stream Settings
     ** @param {array of array} airlines - List of airlines with weight for each
     ** @param {integer} frequency - Spawn rate, in aircraft per hour (acph)
     ** @param {array of string} destinations - List of SIDs or departure fixes for departures
     */
    parse: function(options) {
      var params = ['airlines', 'destinations', 'frequency'];
      for(var i in params) {
        if(options[params[i]]) this[params[i]] = options[params[i]];
      }
      // Pre-load the airlines
      $.each(this.airlines, function (i, data) {
        airline_get(data[0].split('/')[0]);
      });
    },
    /** Stop this departure stream
     */
    stop: function() {
      if(this.timeout) game_clear_timeout(this.timeout);
    },
    /** Start this departure stream
     */
    start: function() {
      var r = Math.floor(random(2, 5.99));
      for(var i=1;i<=r;i++) this.spawnAircraft(false); // spawn 2-5 departures to start with
      this.timeout = game_timeout(this.spawnAircraft, random(this.frequency*.5 , // start spawning loop
        this.frequency*1.5), this, true);
    },
    /** Spawn a new aircraft
     */
    spawnAircraft: function(timeout) {
      var message = (game_time() - this.start >= 2);
      var airline = choose_weight(this.airlines);
      if (airline.indexOf('/') > -1) {
        var fleet = airline.split('/', 2)[1];
        airline = airline.split('/', 2)[0];
      }

      aircraft_new({
        category:  "departure",
        destination: choose(this.destinations),
        airline:   airline,
        fleet:     fleet,
        message:   message
      });

      if(timeout) {
        this.timeout = game_timeout(this.spawnAircraft,
          this.nextInterval(), this, true);
      }
    },
    /** Determine delay until next spawn
     */
    nextInterval: function() {
      var min_interval = 5; // fastest possible between back-to-back departures, in seconds
      var tgt_interval = 3600 / this.frequency;
      var max_interval = tgt_interval + (tgt_interval - min_interval);
      return random(min_interval, max_interval);
    }
  };
});

/** Generate departures in cyclic pattern
 */
zlsa.atc.DepartureCyclic = zlsa.atc.DepartureBase.extend(function (base) {
  return {
    init: function(airport, options) {
      this.period = 60*60;
      this.offset = -15 * 60; // Start at the peak

      base.init.call(this, airport, options);

      this._amplitude = 3600 / this.frequency / 2;
      this._average = 3600/this.frequency;
    },
    /** Additional supported options
     ** period: {integer} Optionally specify the length of a cycle in minutes
     ** offset: {integer} Optionally specify when the cycle peaks in minutes
     */
    parse: function(options) {
      base.parse.call(this, options);
      if(options.period) this.period = options.period * 60;
      if(options.offset) this.offset = -this.period/4 + options.offset * 60;
    },
    nextInterval: function() {
      return (this._amplitude *
        Math.sin(Math.PI*2 * ((game_time() + this.offset)/this.period))
        + this._average) / prop.game.frequency;
    },
  };
});

/** Generate departures in a repeating wave
 */
zlsa.atc.DepartureWave = zlsa.atc.DepartureCyclic.extend(function(base) {
  return {
    init: function(airport, options) {
      base.init.call(this, airport, options);

      // Time between aircraft in the wave
      this._separation = 10;

      // Aircraft per wave
      this._count = Math.floor(this._average/3600 * this.period);

      if ((this.period / this._separation) < this._count) {
        console.log("Reducing average departure frequency from " +
                    this._average +
                    "/hour to maintain minimum interval");
        this._count = Math.floor(3600 / this._separation);
      }

      // length of a wave in seconds
      this._waveLength = this._separation * this._count - 1;

      // Offset to have center of wave at 0 time
      this._offset = (this._waveLength - this._separation)/2 + this.offset;
    },
    nextInterval: function() {
      var position = (game_time() + this._offset) % this.period;
      if (position >= this._waveLength)
        return this.period - position;
      return this._separation / prop.game.frequency;
    },
  };
});


/***************************** AIRPORT STRUCTURE *****************************/


var Runway=Fiber.extend(function(base) {
  return {
    init: function(options, end, airport) {
      if(!options) options={};
      options.airport     = airport;
      this.angle          = null;
      this.elevation      = 0;
      this.delay          = 2;
      this.gps            = [];
      this.ils            = { enabled : true,
                              loc_maxDist : km(25),
                              gs_maxHeight : 9999,
                              gs_gradient : radians(3)
                            };
      this.labelPos       = [];
      this.length         = null;
      this.midfield       = [];
      this.name           = "";
      this.position       = [];
      this.queue          = [];
      this.sepFromAdjacent= km(3);

      this.parse(options, end);
    },
    addQueue: function(aircraft) {
      this.queue.push(aircraft);
    },
    removeQueue: function(aircraft, force) {
      if(this.queue[0] == aircraft || force) {
        this.queue.shift(aircraft);
        if(this.queue.length >= 1) {
          this.queue[0].moveForward();
        }
        return true;
      }
      return false;
    },
    inQueue: function(aircraft) {
      return this.queue.indexOf(aircraft);
    },
    taxiDelay: function(aircraft) {
      return this.delay + Math.random() * 3;
    },
    getGlideslopeAltitude: function(distance, /*optional*/ gs_gradient) {
      if(!gs_gradient) gs_gradient = this.ils.gs_gradient;
      distance = Math.max(0, distance);
      var rise = tan(abs(gs_gradient));
      return this.elevation + (rise * distance * 3280);
    },
    parse: function(data, end) {
      this.airport = data.airport;
      if(data.delay) this.delay = data.delay[end];
      if(data.end) {
        var thisSide  = new Position(data.end[end], data.reference_position, data.magnetic_north);
        var farSide   = new Position(data.end[(end==0)?1:0], data.reference_position, data.magnetic_north);
        this.gps      = [thisSide.latitude, thisSide.longitude];       // GPS latitude and longitude position
        if (thisSide.elevation != null)
          this.elevation = thisSide.elevation;
        if ((this.elevation == 0) && (this.airport.elevation != 0)) {
          this.elevation = this.airport.elevation;
        }
        this.position = thisSide.position; // relative position, based on center of map
        this.length   = vlen(vsub(farSide.position, thisSide.position));
        this.midfield = vscale(vadd(thisSide.position, farSide.position), 0.5);
        this.angle    = vradial(vsub(farSide.position, thisSide.position));
      }
      if(data.ils) this.ils.enabled = data.ils[end];
      if(data.ils_distance) this.ils.loc_maxDist = km(data.ils_distance[end]);
      if(data.ils_gs_maxHeight) this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
      if(data.glideslope) this.ils.gs_gradient = radians(data.glideslope[end]);
      if(data.name_offset) this.labelPos = data.name_offset[end];
      if(data.name) this.name = data.name[end];
      if(data.sepFromAdjacent) this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
    },
  };
});

var Airport=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.loaded   = false;
      this.loading  = false;
      this.name     = null;
      this.icao     = null;
      this.radio    = null;
      this.level    = null;
      this.elevation = 0;
      this.runways  = [];
      this.runway   = null;
      this.fixes    = {};
      this.real_fixes = {};
      this.sids     = {};
      this.stars    = {};
      this.maps     = {};
      this.airways  = {};
      this.restricted_areas = [];
      this.metadata = {
        rwy: {}
      };
      this.airspace = null; // array of areas under this sector's control. If null, draws circle with diameter of 'ctr_radius'
      this.perimeter= null; // area outlining the outermost lateral airspace boundary. Comes from this.airspace[0]

      this.timeout  = {
        runway: null,
        departure: null
      };

      this.departures = null;
      this.arrivals   = [];

      this.wind     = {
        speed: 10,
        angle: 0
      };

      this.ctr_radius  = 80;
      this.ctr_ceiling = 10000;
      this.initial_alt = 5000;

      this.parse(options);
    },
    getWind: function() {
      var wind = clone(this.wind);
      var s = 1;
      var angle_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      var s = 100;
      var speed_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      wind.angle += crange(-1, angle_factor, 1, radians(-4), radians(4));
      wind.speed *= crange(-1, speed_factor, 1, 0.9, 1.05);
      return wind;
    },
    parse: function(data) {
      if(data.position) this.position = new Position(data.position);
      if (this.position && (this.position.elevation != null))
        this.elevation = this.position.elevation;
      if(data.magnetic_north) this.magnetic_north = radians(data.magnetic_north);
        else this.magnetic_north = 0;
      if(data.name) this.name   = data.name;
      if(data.icao) this.icao   = data.icao;
      if(data.radio) this.radio = data.radio;
      if(data.ctr_radius) this.ctr_radius = data.ctr_radius;
      if(data.ctr_ceiling) this.ctr_ceiling = data.ctr_ceiling;
      if(data.initial_alt) this.initial_alt = data.initial_alt;
      if(data.rr_radius_nm) this.rr_radius_nm = data.rr_radius_nm;
      if(data.rr_center) this.rr_center = data.rr_center;
      if(data.level) this.level = data.level;
      this.has_terrain = false || data.has_terrain;

      if (this.has_terrain) {
        this.loadTerrain();
      }

      if(data.airspace) { // create 3d polygonal airspace
        var areas = [];
        for(var i=0; i<data.airspace.length; i++) { // for each area
          var positions = [];
          for(var j=0; j<data.airspace[i].poly.length; j++) {  // for each point
            positions.push(new Position(data.airspace[i].poly[j],
                                        this.position, this.magnetic_north));
          }
          areas.push(new Area(positions, data.airspace[i].floor*100,
            data.airspace[i].ceiling*100, data.airspace[i].airspace_class));
        }
        this.airspace = areas;

        // airspace perimeter (assumed to be first entry in data.airspace)
        this.perimeter = areas[0];

        // change ctr_radius to point along perimeter that's farthest from rr_center
        var pos = new Position(this.perimeter.poly[0].position, this.position, this.magnetic_north);
        var len = nm(vlen(vsub(pos.position, this.position.position)));
        var apt = this;
        this.ctr_radius = Math.max.apply(Math, $.map(this.perimeter.poly, function(v) {return vlen(vsub(v.position,new Position(apt.rr_center, apt.position, apt.magnetic_north).position));}));
      }

      if(data.runways) {
        for(var i in data.runways) {
          data.runways[i].reference_position = this.position;
          data.runways[i].magnetic_north = this.magnetic_north;
          this.runways.push( [new Runway(data.runways[i], 0, this),
                              new Runway(data.runways[i], 1, this)]);
        }
      }

      if(data.fixes) {
        for(var i in data.fixes) {
          var name = i.toUpperCase();
          this.fixes[name] = new Position(data.fixes[i], this.position, this.magnetic_north);
          if(i.indexOf('_') != 0) this.real_fixes[name] = this.fixes[name];
        }
      }

      if(data.sids) {
        this.sids = data.sids;  // import the sids
        for(var s in this.sids) { // Check each SID fix and log if not found in the airport fix list
          if(this.sids.hasOwnProperty(s)) {
            var fixList = this.sids[s];
            for(var i=0; i<fixList.length; i++) {
              var fixname = fixList[i];
              if(!this.airport.fixes[fixname])
                log("SID " + s + " fix not found: " + fixname, LOG_WARNING);
            }
          }
        }
      }

      if(data.stars) this.stars = data.stars;
      if(data.airways) this.airways = data.airways;

      if(data.maps) {
        for(var m in data.maps) {
          this.maps[m] = [];
          var lines = data.maps[m];
          for(var i in lines) { // convert GPS coordinates to km-based position rel to airport
            var start = new Position([lines[i][0],lines[i][1]], this.position, this.magnetic_north).position;
            var end   = new Position([lines[i][2],lines[i][3]], this.position, this.magnetic_north).position;
            this.maps[m].push([start[0], start[1], end[0], end[1]]);
          }
        }
      }

      if(data.restricted) {
        var r = data.restricted,
          self = this;
        for(var i in r) {
          var obj = {};
          if (r[i].name) obj.name = r[i].name;
          obj.height = parseElevation(r[i].height);
          obj.coordinates = $.map(r[i].coordinates, function(v) {
            return [(new Position(v, self.position, self.magnetic_north)).position];
          });

          var coords = obj.coordinates,
              coords_max = coords[0],
              coords_min = coords[0];

          for (var i in coords) {
            var v = coords[i];
            coords_max = [Math.max(v[0], coords_max[0]), Math.max(v[1], coords_max[1])];
            coords_min = [Math.min(v[0], coords_min[0]), Math.min(v[1], coords_min[1])];
          };

          obj.center = vscale(vadd(coords_max, coords_min), 0.5);
          self.restricted_areas.push(obj);
        }
      }

      if(data.wind) {
        this.wind = data.wind;
        this.wind.angle = radians(this.wind.angle);
      }

      if(data.departures) {
        this.departures = zlsa.atc.DepartureFactory(this, data.departures);
      }

      if(data.arrivals) {
        for(var i=0;i<data.arrivals.length;i++) {
          if(!data.arrivals[i].hasOwnProperty("type"))
            log(this.icao + " arrival stream #" + i + " not given type!", LOG_WARNING);
          else this.arrivals.push(zlsa.atc.ArrivalFactory(this, data.arrivals[i]));
        }
      }

      this.checkFixes();  // verify we know where all the fixes are


      // ***** Generate Airport Metadata *****

      // Runway Metadata
      for(var rwy1 in this.runways) {
        for(var rwy1end in this.runways[rwy1]) {
          // setup primary runway object
          this.metadata.rwy[this.runways[rwy1][rwy1end].name] = {};

          for(var rwy2 in this.runways) {
            if(rwy1 == rwy2) continue;
            for(var rwy2end in this.runways[rwy2]) {
              //setup secondary runway subobject
              var r1  = this.runways[rwy1][rwy1end];
              var r2  = this.runways[rwy2][rwy2end];
              var offset = getOffset(r1, r2.position, r1.angle);
              this.metadata.rwy[r1.name][r2.name] = {};

              // generate this runway pair's relationship data
              this.metadata.rwy[r1.name][r2.name].lateral_dist = abs(offset[0]);
              this.metadata.rwy[r1.name][r2.name].straight_dist = abs(offset[2]);
              this.metadata.rwy[r1.name][r2.name].converging =
                raysIntersect(r1.position, r1.angle, r2.position, r2.angle);
              this.metadata.rwy[r1.name][r2.name].parallel =
                ( abs(angle_offset(r1.angle,r2.angle)) < radians(10) );
            }
          }
        }
      }
    },
    set: function() {
      if (!this.loaded) {
        this.load();
        return;
      }

      localStorage['atc-last-airport'] = this.icao;

      prop.airport.current = this;

      $('#airport')
        .text(this.icao.toUpperCase())
        .attr("title", this.name);

      prop.canvas.draw_labels = true;
      $('.toggle-labels').toggle(
        !$.isEmptyObject(this.maps));

      $('.toggle-restricted-areas').toggle(
        (this.restricted_areas || []).length > 0);

      $('.toggle-sids').toggle(
        !$.isEmptyObject(this.sids));

      prop.canvas.dirty = true;

      $('.toggle-terrain').toggle(
        !$.isEmptyObject(this.terrain));

      game_reset_score();
      this.start = game_time();
      this.updateRunway();
      this.addAircraft();
      update_run(true);
    },
    unset: function() {
      for(var i=0;i<this.arrivals.length;i++) {
        this.arrivals[i].stop();
      }
      this.departures.stop();
      if(this.timeout.runway) game_clear_timeout(this.timeout.runway);
    },
    addAircraft: function() {
      if(this.departures) {
        this.departures.start();
      }

      if(this.arrivals) {
        for(var i=0;i<this.arrivals.length;i++) {
          this.arrivals[i].start();
        }
      }
    },
    updateRunway: function(length) {
      if(!length) length = 0;
      var wind = this.getWind();
      var headwind = {};
      function ra(n) {
        var deviation = radians(10);
        return n + crange(0, Math.random(), 1, -deviation, deviation);
      }
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        headwind[runway[0].name] = Math.cos(runway[0].angle - ra(wind.angle)) * wind.speed;
        headwind[runway[1].name] = Math.cos(runway[1].angle - ra(wind.angle)) * wind.speed;
      }
      var best_runway = "";
      var best_runway_headwind = -Infinity;
      for(var i in headwind) {
        if(headwind[i] > best_runway_headwind && this.getRunway(i).length > length) {
          best_runway = i;
          best_runway_headwind = headwind[i];
        }
      }
      this.runway = best_runway;
      this.timeout.runway = game_timeout(this.updateRunway, Math.random() * 30, this);
    },
    selectRunway: function(length) {
      return this.runway;
    },
    parseTerrain: function(data) {
      // terrain must be in geojson format
      var apt = this;
      apt.terrain = {};
      for (var i in data.features) {
        var f = data.features[i],
            ele = round(f.properties.elevation / .3048, 1000); // m => ft, rounded to 1K (but not divided)

        if (!apt.terrain[ele]) {
          apt.terrain[ele] = [];
        }

        var multipoly = f.geometry.coordinates;
        if (f.geometry.type == 'LineString') {
          multipoly = [[multipoly]];
        }
        if (f.geometry.type == 'Polygon') {
          multipoly = [multipoly];
        }

        $.each(multipoly, function(i, poly) {
          // multipoly contains several polys
          // each poly has 1st outer ring and other rings are holes
          apt.terrain[ele].push($.map(poly, function(line_string) {
            return [
              $.map(line_string,
                function(pt) {
                  var pos = new Position(pt, apt.position, apt.magnetic_north);
                  pos.parse4326();
                  return [pos.position];
                }
              )
            ];
          }));
        });
      }
    },
    loadTerrain: function() {
      zlsa.atc.loadAsset({url: 'assets/airports/terrain/' + this.icao.toLowerCase() + '.geojson',
                         immediate: true})
        .done(function (data) {
          try {
            log('Parsing terrain');
            this.parseTerrain(data);
          }
          catch (e) {
            log(e.message);
          }
          this.loading = false;
          this.loaded = true;
          this.set();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          console.error("Unable to load airport/terrain/" + this.icao
                        + ": " + textStatus);
          prop.airport.current.set();
        }.bind(this));
    },
    load: function() {
      if (this.loaded)
        return;

      update_run(false);
      this.loading = true;
      zlsa.atc.loadAsset({url: "assets/airports/"+this.icao.toLowerCase()+".json",
                          immediate: true})
        .done(function (data) {
          this.parse(data);
          if (this.has_terrain)
            return;
          this.loading = false;
          this.loaded = true;
          this.set();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          console.error("Unable to load airport/" + this.icao
                        + ": " + textStatus);
          prop.airport.current.set();
        }.bind(this));
    },
    getRestrictedAreas: function() {
      return this.restricted_areas || null;
    },
    getFix: function(name) {
      if(!name) return null;
      if(Object.keys(airport_get().fixes).indexOf(name.toUpperCase()) == -1) return;
      else return airport_get().fixes[name.toUpperCase()].position;
    },
    getSID: function(id, exit, rwy) {
      if(!(id && exit && rwy)) return null;
      if(Object.keys(this.sids).indexOf(id) == -1) return;
      var fixes = [];
      var sid = this.sids[id];

      // runway portion
      if(sid.rwy.hasOwnProperty(rwy))
        for(var i=0; i<sid.rwy[rwy].length; i++) {
          if(typeof sid.rwy[rwy][i] == "string")
            fixes.push([sid.rwy[rwy][i], null]);
          else fixes.push(sid.rwy[rwy][i]);
        }

      // body portion
      if(sid.hasOwnProperty("body"))
        for(var i=0; i<sid.body.length; i++) {
          if(typeof sid.body[i] == "string")
            fixes.push([sid.body[i], null]);
          else fixes.push(sid.body[i]);
        }

      // exit portion
      if(sid.hasOwnProperty("exitPoints"))
        for(var i=0; i<sid.exitPoints[exit].length; i++) {
          if(typeof sid.exitPoints[exit][i] == "string")
            fixes.push([sid.exitPoints[exit][i], null]);
          else fixes.push(sid.exitPoints[exit][i]);
        }

      return fixes;
    },
    getSIDExitPoint: function(id) {
      // if ends at fix for which the SID is named, return end fix
      if(!this.sids[id].hasOwnProperty("exitPoints"))
        return this.sids[id].icao;

      // if has exitPoints, return a randomly selected one
      var exits = Object.keys(this.sids[id].exitPoints);
      return exits[Math.floor(Math.random() * exits.length)];
    },
    getSIDName: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].name + " " + this.sids[id].suffix[rwy];
      else return this.sids[id].name;
    },
    getSIDid: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].icao + this.sids[id].suffix[rwy];
      else return this.sids[id].icao;
    },
    /** Return an array of [Waypoint, fixRestrictions] for a given STAR
     ** @param {string} id - the identifier for the STAR (eg 'LENDY6')
     ** @param {string} entry - the entryPoint from which to join the STAR
     ** @param {string} rwy - (optional) the planned arrival runway
     ** Note: Passing a value for 'rwy' will help the fms distinguish between
     **       different branches of a STAR, when it splits into different paths
     **       for landing on different runways (eg 'HAWKZ4, landing south' vs
     **       'HAWKZ4, landing north'). Not strictly required, but not passing
     **       it will cause an incomplete route in many cases (depends on the
     **       design of the actual STAR in the airport's json file).
     */
    getSTAR: function(id, entry, /*optional*/ rwy) {
      if(!(id && entry) || Object.keys(this.stars).indexOf(id) == -1) return null;
      var fixes = [];
      var star = this.stars[id];

      // entry portion
      if(star.hasOwnProperty("entryPoints"))
        for(var i=0; i<star.entryPoints[entry].length; i++) {
          if(typeof star.entryPoints[entry][i] == "string")
            fixes.push([star.entryPoints[entry][i], null]);
          else fixes.push(star.entryPoints[entry][i]);
        }

      // body portion
      if(star.hasOwnProperty("body"))
        for(var i=0; i<star.body.length; i++) {
          if(typeof star.body[i] == "string")
            fixes.push([star.body[i], null]);
          else fixes.push(star.body[i]);
        }

      // runway portion
      if(star.rwy && star.rwy.hasOwnProperty(rwy))
        for(var i=0; i<star.rwy[rwy].length; i++) {
          if(typeof star.rwy[rwy][i] == "string")
            fixes.push([star.rwy[rwy][i], null]);
          else fixes.push(star.rwy[rwy][i]);
        }

      return fixes;
    },
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i][0].name.toLowerCase() == name) return this.runways[i][0];
        if(this.runways[i][1].name.toLowerCase() == name) return this.runways[i][1];
      }
      return null;
    },
    /** Verifies all fixes used in the airport also have defined positions
     */
    checkFixes: function() {
      var fixes = [];

      // Gather fixes used by SIDs
      if(this.hasOwnProperty("sids")) {
        for(var s in this.sids) {
          if(this.sids[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.sids[s].rwy)
              for(var i in this.sids[s].rwy[r]) {
                if(typeof this.sids[s].rwy[r][i] == "string")
                  fixes.push(this.sids[s].rwy[r][i]);
                else fixes.push(this.sids[s].rwy[r][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("body")) { // body portion
            for(var i in this.sids[s].body) {
              if(typeof this.sids[s].body[i] == "string")
                fixes.push(this.sids[s].body[i]);
              else fixes.push(this.sids[s].body[i][0]);
            }
          }
          if(this.sids[s].hasOwnProperty("exitPoints")) { // exitPoints portion
            for(var t in this.sids[s].exitPoints)
              for(var i in this.sids[s].exitPoints[t]) {
                if(typeof this.sids[s].exitPoints[t][i] == "string")
                  fixes.push(this.sids[s].exitPoints[t][i]);
                else fixes.push(this.sids[s].exitPoints[t][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.sids[s].draw)
              for(var j=0; j<this.sids[s].draw[i].length; j++)
                fixes.push(this.sids[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by STARs
      if(this.hasOwnProperty("stars")) {
        for(var s in this.stars) {
          if(this.stars[s].hasOwnProperty("entryPoints")) { // entryPoints portion
            for(var t in this.stars[s].entryPoints)
              for(var i in this.stars[s].entryPoints[t]) {
                if(typeof this.stars[s].entryPoints[t][i] == "string")
                  fixes.push(this.stars[s].entryPoints[t][i]);
                else fixes.push(this.stars[s].entryPoints[t][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("body")) { // body portion
            for(var i in this.stars[s].body) {
              if(typeof this.stars[s].body[i] == "string")
                fixes.push(this.stars[s].body[i]);
              else fixes.push(this.stars[s].body[i][0]);
            }
          }
          if(this.stars[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.stars[s].rwy)
              for(var i in this.stars[s].rwy[r]) {
                if(typeof this.stars[s].rwy[r][i] == "string")
                  fixes.push(this.stars[s].rwy[r][i]);
                else fixes.push(this.stars[s].rwy[r][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.stars[s].draw)
              for(var j in this.stars[s].draw[i])
                fixes.push(this.stars[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by airways
      if(this.hasOwnProperty("airways")) {
        for(var a in this.airways)
          for(var i in this.airways[a])
            fixes.push(this.airways[a][i]);
      }

      // Get (unique) list of fixes used that are not in 'this.fixes'
      var apt = this;
      var missing = fixes.filter(function(f){return !apt.fixes.hasOwnProperty(f);}).sort();
      for(var i=0; i<missing.length-1; i++)
        if(missing[i] == missing[i+1]) missing.splice(i,1); // remove duplicates
      if(missing.length > 0) {  // there are some... yell at the airport designer!!! :)
        log(this.icao + " uses the following fixes which are not listed in " +
          "airport.fixes: " +missing.join(' '), LOG_WARNING);
      }
    }
  };
});

window.airport_init_pre = function airport_init_pre() {
    prop.airport = {};
    prop.airport.airports = {};
    prop.airport.current  = null;
};

window.airport_init = function airport_init() {
  airport_load('ebbr', "easy", "Brussels-National &#9983");
  airport_load('eddf', "medium", "Frankfurt Airport");
  airport_load('eddh', "easy", "Hamburg Airport");
  airport_load('eddm', "beginner", "Franz Josef Strauß International Airport");
  airport_load('eddt', "medium", "Berlin Tegel Airport");
  airport_load('egcc', "hard", "Manchester Airport");
  airport_load('eggw', "medium", "London Luton Airport")
  airport_load('egkk', "easy", "London Gatwick Airport");
  airport_load('eglc', "medium", "London City Airport");
  airport_load('egll', "hard", "London Heathrow Airport");
  airport_load('egnm', "beginner", "Leeds Bradford International Airport");
  airport_load('eham', "medium", "Amsterdam Airport Schiphol");
  airport_load('eidw', "easy", "Dublin Airport");
  airport_load('einn', "easy", "Shannon Airport");
  airport_load('ekch', "medium", "Copenhagen Kastrup Airport");
  airport_load('engm', "easy", "Oslo Gardermoen International Airport");
  airport_load('espa', "easy", "Luleå Airport");
  airport_load('gcrr', "easy", "Lanzarote Airport");
  airport_load('kbos', "medium", "Boston Logan International Airport");
  airport_load('kdca', "medium", "Reagan National Airport");
  airport_load('kiad', "hard", "Washington-Dulles International Airport");
  airport_load('kjfk', "hard", "John F Kennedy International Airport &#9983");
  airport_load('klas', "medium", "McCarran International Airport");
  airport_load('klax90', "medium", "Los Angeles International Airport 1990");
  airport_load('klax', "medium", "Los Angeles International Airport");
  airport_load('kmia', "hard", "Miami International Airport &#9983");
  airport_load('kmsp', "hard", "Minneapolis/St. Paul International Airport &#9983");
  airport_load('kord', "hard", "Chicago O'Hare International Airport");
  airport_load('kpdx', "easy", "Portland International Airport");
  airport_load('kphx', "easy", "Phoenix Sky Harbor International Airport");
  airport_load('ksan', "easy", "San Diego International Airport");
  airport_load('ksea', "medium", "Seattle-Tacoma International Airport &#9983");
  airport_load('ksfo', "medium", "San Francisco International Airport &#9983");
  airport_load('lkpr', "easy", "Vaclav Havel International Airport");
  airport_load('loww', "medium", "Vienna International Airport");
  airport_load('ltba', "hard", "Atatürk International Airport &#9983");
  airport_load('omaa', "medium", "Abu Dhabi International Airport");
  airport_load('omdb', "hard", "Dubai International Airport");
  airport_load('osdi', "easy",  "Damascus International Airport");
  airport_load('othh', "hard", "Doha Hamad International Airport");
  airport_load('rjtt', "hard", "Tokyo Haneda International Airport");
  airport_load('rksi', "hard", "Incheon International Airport");
  airport_load('saez', "medium", "Aeropuerto Internacional Ministro Pistarini");
  airport_load('same', "medium", "Aeropuerto Internacional El Plumerillo");
  airport_load('sawh', "beginner", "Aeropuerto Internacional Malvinas Argentinas");
  airport_load('sbgl', "beginner", "Aeroporto Internacional Tom Jobim");
  airport_load('sbgr', "beginner", "Aeroporto Internacional de São Paulo/Guarulhos");
  airport_load('tjsj', "easy", "Luis Muñoz Marín International Airport");
  airport_load('tncm', "easy", "Princess Juliana International Airport");
  airport_load('uudd', "easy", "Moscow Domodedovo Airport");
  airport_load('vabb', "hard", "Chhatrapati Shivaji International Airport")
  airport_load('vecc', "medium", "Kolkata Netaji Subhas Chandra Bose Int'l");
  airport_load('vhhh', "medium", "Hong Kong Chep Lap Kok International Airport");
  airport_load('vidp', "hard", "Indira Gandhi International Airport");
  airport_load('wiii', "medium", "Soekarno-Hatta International Airport");
  airport_load('wimm', "easy", "Kuala Namu International Airport");
  airport_load('wmkp', "medium", "Pulau Pinang International Airport");
  airport_load('wmkk', "hard", "Kuala Lumpur International Airport (KLIA)")
  airport_load('wsss', "hard", "Singapore Changi International Airport");
  airport_load('zspd', "hard", "Shanghai Pudong International Airport");
};

window.airport_ready = function airport_ready() {
    if (!('atc-last-airport' in localStorage) ||
        !(localStorage['atc-last-airport'] in prop.airport.airports
    )) {
        airport_set('ksfo');
    } else {
        airport_set();
    }
};

window.airport_load = function airport_load(icao,level,name) {
    icao = icao.toLowerCase();

    if (icao in prop.airport.airports) {
        console.log(icao + ": already loaded");
        return;
    }

    var airport= new Airport({
        icao: icao,
        level: level,
        name: name
    });

    airport_add(airport);

    return airport;
};

window.airport_add = function airport_add(airport) {
    prop.airport.airports[airport.icao.toLowerCase()] = airport;
};

window.airport_set = function airport_set(icao) {
  if(!icao) {
    if(!('atc-last-airport' in localStorage)) return;
    else icao = localStorage['atc-last-airport'];
  }
  icao = icao.toLowerCase();

  if(!(icao in prop.airport.airports)) {
    console.log(icao + ": no such airport");
    return;
  }

  if(prop.airport.current) {
    prop.airport.current.unset();
    aircraft_remove_all();
  }

  var newAirport = prop.airport.airports[icao];
  newAirport.set();
};

window.airport_get = function airport_get(icao) {
    if (!icao) {
        return prop.airport.current
    };

    return prop.airport.airports[icao.toLowerCase()];
};

},{}],6:[function(require,module,exports){
var Animation = function(options) {
    this.value = 0;
    this.start_value = 0;
    this.end_value = 1;
    this.progress = 0;
    this.easing = "smooth";
    this.duration = 0;
    this.start = 0;
    this.animating = false;

    if(options) {
        if("value" in options) this.value = options.value;
        if("start_value" in options) this.start_value = options.start_value;
        if("end_value" in options) this.end_value = options.end_value;
        if("easing" in options) this.easing = options.easing;
        if("duration" in options) this.duration = options.duration;
    }

    this.set = function(value) {
        this.animate(value);
    };

    this.get = function(progress) {
        return this.step(time());
    };

    this.animate = function(value) {
        this.animating = true;
        this.progress = 0;
        this.start = time();
        this.start_value = this.value+0;
        this.end_value = value;
    };

    this.ease = function() {
        if(this.easing == "linear") {
            this.value = crange(0,this.progress,1,this.start_value,this.end_value);
        } else if(this.easing == "smooth") {
            this.value = srange(0,this.progress,1,this.start_value,this.end_value);
        } else {
            console.log("Unknown easing '"+this.easing+"'");
        }
    };

  this.step = function(t) {
    this.progress = crange(this.start,t,this.start+this.duration,0,1);
    if(!this.animating)
      this.progress = 0;
    this.ease();
    return this.value;
  };

  this.step(game_time());
};

window.Animation = Animation;

},{}],7:[function(require,module,exports){
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
var Position = Fiber.extend(function() {
  return {
    // coordinates - Array containing offset pair or latitude/longitude pair
    // reference - Position to use for calculating offsets when lat/long given
    // mode - optional. Set to "GPS" to indicate you are inputting lat/lon that should be converted to positions
    //
    // coordinates may contain an optional elevation as a third
    // element.  It must be suffixed by either 'ft' or 'm' to indicate
    // the units.
    // Latitude and Longitude numbers may be one of the following forms:
    //   Decimal degrees - 'N47.112388112'
    //   Decimal minutes - 'N38d38.109808'
    //   Decimal seconds - 'N58d27m12.138'
    init: function(coordinates, reference, magnetic_north, /*optional*/ mode) {
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
      this.gps = [0,0];

      this.parse(coordinates, mode);
    },
    parse: function(coordinates, mode) {
      if (! /^[NESW]/.test(coordinates[0])) {
        this.x = coordinates[0];
        this.y = coordinates[1];
        this.position = [this.x, this.y];
        if(mode === 'GPS') this.parse4326();
        return;
      }

      this.latitude = this.parseCoordinate(coordinates[0]);
      this.longitude = this.parseCoordinate(coordinates[1]);
      this.gps = [this.longitude, this.latitude]; // GPS coordinates in [x,y] order

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

/** An enclosed region defined by a series of Position objects and an altitude range
 ** @param {array} poly - series of Position objects that outline the shape
 **                Note: DO NOT repeat the origin to 'close' the shape. Unnecessary.
 ** @param {number} floor - (optional) altitude of bottom of area, in hundreds of feet
 ** @param {number} ceiling - (optional) altitude of top of area, in hundreds of feet
 ** @param {string} airspace_class - (optional) FAA airspace classification (A,B,C,D,E,G)
 */
var Area = Fiber.extend(function() {
  return {
    init: function(positions, /*optional*/ floor, ceiling, airspace_class) {
      if(!positions) return;
      this.poly     = [];
      this.floor    = null;
      this.ceiling  = null;
      this.airspace_class = null;

      if(floor != null) this.floor = floor;
      if(ceiling != null) this.ceiling = ceiling;
      if(airspace_class) this.airspace_class = airspace_class;

      this.parse(positions);
    },
    parse: function(positions) {
      for(var i=0; i<positions.length; i++) this.poly.push(positions[i]);
      if(this.poly[0] == this.poly[this.poly.length-1])
        this.poly.pop();  // shape shouldn't fully close; will draw with 'cc.closepath()'
    }
  };
});

window.Position = Position;
window.Area = Area;

},{}],8:[function(require,module,exports){
// jshint latedef:nofunc, undef:true, eqnull:true, eqeqeq:true, browser:true, jquery:true, devel:true
/*global prop:true, km:false, crange:false, clamp:false, lpad:false, airport_get:false, game_time:false, game_paused:false, time:false, round:false, distance2d:false, radians:false  */

window.canvas_init_pre = function canvas_init_pre() {
  "use strict";
  prop.canvas={};

  prop.canvas.contexts={};

  prop.canvas.panY=0;
  prop.canvas.panX=0;

  // resize canvas to fit window?
  prop.canvas.resize=true;
  prop.canvas.size={ // all canvases are the same size
    height:480,
    width:640
  };

  prop.canvas.last = time();
  prop.canvas.dirty = true;
  prop.canvas.draw_labels = true;
  prop.canvas.draw_restricted = true;
  prop.canvas.draw_sids = true;
  prop.canvas.draw_terrain = true;
}

window.canvas_init = function canvas_init() {
  "use strict";
  canvas_add("navaids");
}

function canvas_adjust_hidpi() {
  "use strict";
  var dpr = window.devicePixelRatio || 1;
  log("devicePixelRatio:"+dpr);
  if(dpr > 1) {
    var hidefCanvas = $("#navaids-canvas").get(0);
    var w = prop.canvas.size.width;
    var h = prop.canvas.size.height;
    $(hidefCanvas).attr('width', w * dpr);
    $(hidefCanvas).attr('height', h * dpr);
    $(hidefCanvas).css('width', w );
    $(hidefCanvas).css('height', h );
    var ctx = hidefCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    prop.canvas.contexts.navaids = ctx;
  }
}

window.canvas_complete = function canvas_complete() {
  "use strict";
  setTimeout(function() {
    prop.canvas.dirty = true;
  }, 500);
  prop.canvas.last = time();
}

window.canvas_resize = function canvas_resize() {
  "use strict";
  if(prop.canvas.resize) {
    prop.canvas.size.width  = $(window).width();
    prop.canvas.size.height = $(window).height();
  }
  prop.canvas.size.width  -= 250;
  prop.canvas.size.height -= 36;
  for(var i in prop.canvas.contexts) {
    prop.canvas.contexts[i].canvas.height=prop.canvas.size.height;
    prop.canvas.contexts[i].canvas.width=prop.canvas.size.width;
  }
  prop.canvas.dirty = true;
  canvas_adjust_hidpi();
}

function canvas_add(name) {
  "use strict";
  $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
  prop.canvas.contexts[name]=$("#"+name+"-canvas").get(0).getContext("2d");
}

function canvas_get(name) {
  "use strict";
  return(prop.canvas.contexts[name]);
}

function canvas_clear(cc) {
  "use strict";
  cc.clearRect(0,0,prop.canvas.size.width,prop.canvas.size.height);
}

function canvas_should_draw() {
  "use strict";
  var elapsed = time() - prop.canvas.last;
  if(elapsed > (1/prop.game.speedup)) {
    prop.canvas.last = time();
    return true;
  }
  return false;
}

// DRAW

function canvas_draw_runway(cc, runway, mode) {
  "use strict";
  var length2 = round(km_to_px(runway.length / 2));
  var angle   = runway.angle;

  cc.translate(round(km_to_px(runway.position[0])) + prop.canvas.panX,
              -round(km_to_px(runway.position[1])) + prop.canvas.panY);
  cc.rotate(angle);

  if(!mode) { // runway body
    cc.strokeStyle = "#899";
    cc.lineWidth = 2.8;
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(0, -2*length2);
    cc.stroke();
  }
  else {  // extended centerlines
    if(!runway.ils.enabled) return;
    cc.strokeStyle = "#465";
    cc.lineWidth = 1;
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(0, km_to_px(runway.ils.loc_maxDist));
    cc.stroke();
  }
}

function canvas_draw_runway_label(cc, runway) {
  "use strict";
  var length2 = round(km_to_px(runway.length / 2)) + 0.5;
  var angle   = runway.angle;

  cc.translate(round(km_to_px(runway.position[0])) + prop.canvas.panX, -round(km_to_px(runway.position[1])) + prop.canvas.panY);

  cc.rotate(angle);

  var text_height = 14;
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  cc.save();
  cc.translate(0,  length2 + text_height);
  cc.rotate(-angle);
  cc.translate(round(km_to_px(runway.labelPos[0])), -round(km_to_px(runway.labelPos[1])));
  cc.fillText(runway.name, 0, 0);
  cc.restore();
}

function canvas_draw_runways(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.strokeStyle = "rgba(255, 255, 255, 0.4)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.4)";
  cc.lineWidth   = 4;
  var airport=airport_get();
  var i;
  //Extended Centerlines
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][0], true);
    cc.restore();
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][1], true);
    cc.restore();
  }
  // Runways
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][0], false);
    cc.restore();
  }
}

function canvas_draw_runway_labels(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  var airport=airport_get();
  for(var i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway_label(cc, airport.runways[i][0]);
    cc.restore();
    cc.save();
    canvas_draw_runway_label(cc, airport.runways[i][1]);
    cc.restore();
  }
}

function canvas_draw_scale(cc) {
  "use strict";
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  cc.strokeStyle = "rgba(255, 255, 255, 0.8)";

  var offset = 10;
  var height = 5;

  var length = round(1 / prop.ui.scale * 50);
  var px_length = round(km_to_px(length));

  cc.translate(0.5, 0.5);

  cc.lineWidth = 1;
  cc.moveTo(prop.canvas.size.width - offset, offset);
  cc.lineTo(prop.canvas.size.width - offset, offset + height);
  cc.lineTo(prop.canvas.size.width - offset - px_length, offset + height);
  cc.lineTo(prop.canvas.size.width - offset - px_length, offset);
  cc.stroke();

  cc.translate(-0.5, -0.5);

  cc.textAlign = 'center';
  cc.fillText(length + ' km', prop.canvas.size.width - offset - px_length * 0.5, offset + height + 17);
}

function canvas_draw_fix(cc, name, fix) {
  "use strict";
  cc.beginPath();
  cc.moveTo( 0, -5);
  cc.lineTo( 4,  3);
  cc.lineTo(-4,  3);
  cc.closePath();
  cc.fill();
  cc.stroke();

  cc.textAlign    = "center";
  cc.textBaseline = "top";
  cc.strokeText(name, 0, 6);
  cc.fillText(name, 0, 6);
}

function canvas_draw_fixes(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";
  var airport=airport_get();
  for(var i in airport.real_fixes) {
    cc.save();
    cc.translate(round(km_to_px(airport.fixes[i].position[0])) + prop.canvas.panX, -round(km_to_px(airport.fixes[i].position[1])) + prop.canvas.panY);

    // draw outline (draw with eraser)
    cc.strokeStyle = "rgba(0, 0, 0, 0.67)";
    cc.fillStyle   = "rgba(0, 0, 0, 0.67)";
    cc.globalCompositeOperation = 'destination-out';
    cc.lineWidth   = 4;

    canvas_draw_fix(cc, i, airport.fixes[i].position);

    cc.strokeStyle = "rgba(255, 255, 255, 0)";
    cc.fillStyle   = "rgba(255, 255, 255, 0.5)";
    cc.globalCompositeOperation = 'source-over';
    cc.lineWidth   = 1;

    canvas_draw_fix(cc, i, airport.fixes[i].position);
    cc.restore();
  }
}

function canvas_draw_sids(cc) {
  "use strict";
  if (!prop.canvas.draw_sids) return;
  var text_at_point = [] // Store the count of sid text drawn for a specific transition
  var departure_colour = "rgba(128, 255, 255, 0.6)";
  cc.strokeStyle = departure_colour;
  cc.fillStyle = departure_colour;
  cc.setLineDash([1,10]);
  cc.font = "italic 14px monoOne, monospace";
  var airport = airport_get();
  for(var s in airport.sids) {
    var write_sid_name = true;
    if(airport.sids[s].hasOwnProperty("draw")) {
      for(var i in airport.sids[s].draw) {
        var fixList = airport.sids[s].draw[i];
        var fx, fy, exit_name = null;
        for(var j=0; j<fixList.length; j++) {
          if(fixList[j].indexOf("*") != -1) { // write exitPoint name
            exit_name = fixList[j].replace("*","");
            write_sid_name = false;
          }
          var fix = airport.getFix(fixList[j].replace("*",""));
          if(!fix) log('Unable to draw line to "'+fixList[j]+'" because its position is not defined!', LOG_WARNING);
          fx = km_to_px(fix[0]) + prop.canvas.panX;
          fy = -km_to_px(fix[1]) + prop.canvas.panY;
          if(j === 0) {
            cc.beginPath();
            cc.moveTo(fx, fy);
          } else {
            cc.lineTo(fx, fy);
          }
        }
        cc.stroke();
        if(exit_name){
          if(isNaN(text_at_point[exit_name])){  // Initialize count for this transition
            text_at_point[exit_name] = 0;
          }
          var y_point = fy +(15*text_at_point[exit_name]);  // Move the y point for drawing depending on how many sids we have drawn text for at this point already
          cc.fillText(s + "." + exit_name, fx+10, y_point);
          text_at_point[exit_name] += 1;  // Increment the count for this transition
        }
      }
      if(write_sid_name) cc.fillText(s, fx+10, fy);
    }
  }
}

function canvas_draw_separation_indicator(cc, aircraft) {
  "use strict";
  // Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
  var rwy = airport_get().getRunway(aircraft.fms.currentWaypoint().runway);
  if(!rwy) return;
  var angle = rwy.angle + Math.PI;
  cc.strokeStyle = "rgba(224, 128, 128, 0.8)";
  cc.lineWidth = 3;
  cc.translate(km_to_px(aircraft.position[0]) + prop.canvas.panX, -km_to_px(aircraft.position[1]) + prop.canvas.panY);
  cc.rotate(angle);
  cc.beginPath();
  cc.moveTo(-5, -km_to_px(5.556));  // 5.556km = 3.0nm
  cc.lineTo(+5, -km_to_px(5.556));  // 5.556km = 3.0nm
  cc.stroke();
}

function canvas_draw_aircraft_rings(cc,aircraft) {
  cc.save();
  if(aircraft.hasAlerts()[0]) {
    if(aircraft.hasAlerts()[1]) cc.strokeStyle = "rgba(224, 128, 128, 1.0)";  //red violation circle
    else cc.strokeStyle = "rgba(255, 255, 255, 0.2)";   //white warning circle
  }
  else cc.strokeStyle = cc.fillStyle;
  cc.beginPath();
  cc.arc(0, 0, km_to_px(km(3)), 0, Math.PI * 2);  //3nm RADIUS
  cc.stroke();
  cc.restore();
}

function canvas_draw_aircraft_departure_window(cc, aircraft) {
  "use strict";
  cc.save();
  cc.strokeStyle = "rgba(128, 255, 255, 0.9)";
  cc.beginPath();
  var angle = aircraft.destination - Math.PI/2;
  cc.arc(prop.canvas.panX,
         prop.canvas.panY,
         km_to_px(airport_get().ctr_radius),
         angle - 0.08726,
         angle + 0.08726);
  cc.stroke();
  cc.restore();
}

function canvas_draw_aircraft(cc, aircraft) {
  "use strict";
  var almost_match = false;
  var match        = false;

  if ((prop.input.callsign.length > 1) &&
      (aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1))))
  {
    almost_match = true;
  }
  if((prop.input.callsign.length > 0) &&
     (aircraft.matchCallsign(prop.input.callsign)))
  {
    match = true;
  }

  if (match && (aircraft.destination != null)) {
    canvas_draw_aircraft_departure_window(cc, aircraft);
  }

  if(!aircraft.isVisible()) return;

  var size = 3;

  // Trailling
  var trailling_length = 12;
  var dpr = window.devicePixelRatio || 1;
  if (dpr > 1)
    trailling_length *= round(dpr);

  cc.save();
  if (!aircraft.inside_ctr)
    cc.fillStyle   = "rgb(224, 224, 224)";
  else
    cc.fillStyle = "rgb(255, 255, 255)";

  var length = aircraft.position_history.length;
  for (var i = 0; i < length; i++) {
    if (!aircraft.inside_ctr)
      cc.globalAlpha = 0.3 / (length - i);
    else
      cc.globalAlpha = 1 / (length - i);
    cc.fillRect(km_to_px(aircraft.position_history[i][0]) + prop.canvas.panX - 1, - km_to_px(aircraft.position_history[i][1]) + prop.canvas.panY - 1, 2, 2);
  }
  cc.restore();

  if(aircraft.position_history.length > trailling_length) aircraft.position_history = aircraft.position_history.slice(aircraft.position_history.length - trailling_length, aircraft.position_history.length);

  if(aircraft.isPrecisionGuided()) {
    cc.save();
    canvas_draw_separation_indicator(cc, aircraft);
    cc.restore();
  }

  // Aircraft
  // Draw the future path
  if ((prop.game.option.get('drawProjectedPaths') == 'always') ||
      ((prop.game.option.get('drawProjectedPaths') == 'selected') &&
       ((aircraft.warning || match) && !aircraft.isTaxiing())))
  {
    canvas_draw_future_track(cc, aircraft);
  }

  var alerts = aircraft.hasAlerts();

  if (!aircraft.inside_ctr)
    cc.fillStyle   = "rgba(224, 224, 224, 0.3)";
  else if (almost_match)
    cc.fillStyle = "rgba(224, 210, 180, 1.0)";
  else if (match)
    cc.fillStyle = "rgba(255, 255, 255, 1.0)";
  else if (aircraft.warning || alerts[1])
    cc.fillStyle = "rgba(224, 128, 128, 1.0)";
  else if (aircraft.hit)
    cc.fillStyle = "rgba(255, 64, 64, 1.0)";
  else
    cc.fillStyle   = "rgba(224, 224, 224, 1.0)";

  cc.strokeStyle = cc.fillStyle;

  if(match) {

    cc.save();

    if (!aircraft.inside_ctr)
      cc.fillStyle = "rgba(255, 255, 255, 0.3)";
    else
      cc.fillStyle = "rgba(255, 255, 255, 1.0)";

    var w = prop.canvas.size.width/2;
    var h = prop.canvas.size.height/2;

    cc.translate(clamp(-w, km_to_px(aircraft.position[0]) + prop.canvas.panX, w), clamp(-h, -km_to_px(aircraft.position[1]) + prop.canvas.panY, h));

    cc.beginPath();
    cc.arc(0, 0, round(size * 1.5), 0, Math.PI * 2);
    cc.fill();

    cc.restore();
  }

  cc.translate(km_to_px(aircraft.position[0]) + prop.canvas.panX, -km_to_px(aircraft.position[1]) + prop.canvas.panY);

  if(!aircraft.hit) {
    cc.save();

    var tail_length = aircraft.groundSpeed / 15;
    if(match) tail_length = 15;
    var angle       = aircraft.groundTrack;
    var end         = vscale(vturn(angle), tail_length);

    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(end[0], -end[1]);
    cc.stroke();
    cc.restore();
  }

  if(aircraft.notice || alerts[0]) {
    canvas_draw_aircraft_rings(cc,aircraft);
  }

  cc.beginPath();
  cc.arc(0, 0, size, 0, Math.PI * 2);
  cc.fill();
}

// Run physics updates into the future, draw future track
function canvas_draw_future_track(cc, aircraft) {
  "use strict";
  var fms_twin = $.extend(true, {}, aircraft.fms);
  var twin = $.extend(true, {}, aircraft);
  twin.fms = fms_twin;
  twin.fms.aircraft = twin;
  twin.projected = true;
  var save_delta = prop.game.delta;
  prop.game.delta = 5;
  var future_track = [];
  var ils_locked;
  for(var i = 0; i < 60; i++) {
    twin.update();
    ils_locked = twin.fms.currentWaypoint().runway && twin.category === "arrival" && twin.mode === "landing";
    future_track.push([twin.position[0], twin.position[1], ils_locked]);
    if( ils_locked && twin.altitude < 500)
      break;
  }
  prop.game.delta = save_delta;
  cc.save();

  var lockedStroke;
  if(aircraft.category === "departure") {
    cc.strokeStyle = "rgba(128, 255, 255, 0.6)";
  } else {
    cc.strokeStyle = "rgba(224, 128, 128, 0.6)";
    lockedStroke   = "rgba(224, 128, 128, 1.0)";
  }
  cc.globalCompositeOperation = "screen";

  cc.lineWidth = 2;
  cc.beginPath();
  var was_locked = false;
  var length = future_track.length;
  for (i = 0; i < length; i++) {
      ils_locked = future_track[i][2];
      var x = km_to_px(future_track[i][0]) + prop.canvas.panX ;
      var y = -km_to_px(future_track[i][1]) + prop.canvas.panY;
      if(ils_locked && !was_locked) {
        cc.lineTo(x, y);
        cc.stroke(); // end the current path, start a new path with lockedStroke
        cc.strokeStyle = lockedStroke;
        cc.lineWidth = 3;
        cc.beginPath();
        cc.moveTo(x, y);
        was_locked = true;
        continue;
      }
      if( i === 0 )
        cc.moveTo(x, y);
      else
        cc.lineTo(x, y);
  }
  cc.stroke();
  canvas_draw_future_track_fixes(cc, twin, future_track);
  cc.restore();
}

// Draw dashed line from last coordinate of future track through
// any later requested fixes.
function canvas_draw_future_track_fixes( cc, aircraft, future_track) {
  "use strict";
  if (aircraft.fms.waypoints.length < 1) return;
  var start = future_track.length - 1;
  var x = km_to_px(future_track[start][0]) + prop.canvas.panX;
  var y = -km_to_px(future_track[start][1]) + prop.canvas.panY;
  cc.beginPath();
  cc.moveTo(x, y);
  cc.setLineDash([3,10]);
  for(var i=0; i<aircraft.fms.waypoints.length; i++) {
    if (!aircraft.fms.waypoints[i].location)
      break;
    var fix = aircraft.fms.waypoints[i].location;
    var fx = km_to_px(fix[0]) + prop.canvas.panX;
    var fy = -km_to_px(fix[1]) + prop.canvas.panY;
    cc.lineTo(fx, fy);
  }
  cc.stroke();
}

function canvas_draw_all_aircraft(cc) {
  "use strict";
  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  cc.strokeStyle = "rgba(224, 224, 224, 1.0)";
  cc.lineWidth   = 2;
  // console.time('canvas_draw_all_aircraft')
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_aircraft(cc, prop.aircraft.list[i]);
    cc.restore();
  }
  // console.timeEnd('canvas_draw_all_aircraft')
}

/** Draw an aircraft's data block
 ** (box that contains callsign, altitude, speed)
 */
function canvas_draw_info(cc, aircraft) {
  "use strict";
  if(!aircraft.isVisible()) return;
  if(!aircraft.hit) {

    // Initial Setup
    cc.save();
    var cs = aircraft.getCallsign();
    var paddingLR = 5;
    var width  = clamp(1, 5.8*cs.length) + (paddingLR*2); // width of datablock (scales to fit callsign)
    var width2 = width / 2;
    var height  = 31;               // height of datablock
    var height2 = height / 2;
    var bar_width = width / 18;     // width of colored bar
    var bar_width2 = bar_width / 2;
    var ILS_enabled = aircraft.fms.currentWaypoint().runway && aircraft.category === "arrival";
    var lock_size = height / 3;
    var lock_offset = lock_size / 8;
    var pi = Math.PI;
    var point1 = lock_size - bar_width2;
    var alt_trend_char = "";
    var a = point1 - lock_offset;
    var b = bar_width2;
    var clipping_mask_angle = Math.atan(b / a);
    var pi_slice = pi / 24;         // describes how far around to arc the arms of the ils lock case

    // Callsign Matching
    if(prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1)))
      var almost_match = true;
    if(prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign))
      var match = true;

    // set color, intensity, and style elements
    if (match) var alpha = 0.9;
    // else if(almost_match) var alpha = 0.75;
    else if (aircraft.inside_ctr) var alpha = 0.5;
    else var alpha = 0.2;
    var red   = "rgba(224, 128, 128, " + alpha + ")";
    var green = "rgba( 76, 118,  97, " + alpha + ")";
    var blue  = "rgba(128, 255, 255, " + alpha + ")";
    var white = "rgba(255, 255, 255, " + alpha + ")";
    cc.textBaseline = "middle";

    // Move to center of where the data block is to be drawn
    var ac_pos = [round(km_to_px(aircraft.position[0])) + prop.canvas.panX,
                 -round(km_to_px(aircraft.position[1])) + prop.canvas.panY];
    if(aircraft.datablockDir == -1) { // game will move FDB to the appropriate position
      if(-km_to_px(aircraft.position[1]) + prop.canvas.size.height/2 < height * 1.5)
        cc.translate(ac_pos[0], ac_pos[1] + height2 + 12);
      else cc.translate(ac_pos[0], ac_pos[1] -height2 - 12);
    }
    else {  // user wants to specify FDB position
      var displacements = {
        "ctr": [0,0],
        360  : [0, -height2 - 12],
        45   : [width2 + 8.5, -height2 - 8.5],
        90   : [width2 + bar_width2 + 12, 0],
        135  : [width2 + 8.5, height2 + 8.5],
        180  : [0, height2 + 12],
        225  : [-width2 - 8.5, height2 + 8.5],
        270  : [-width2 - bar_width2 - 12, 0],
        315  : [-width2 - 8.5, -height2 - 8.5]
      };
      cc.translate(ac_pos[0] + displacements[aircraft.datablockDir][0],
        ac_pos[1] + displacements[aircraft.datablockDir][1]);
    }

    // Draw datablock shapes
    if(!ILS_enabled) {  // Standard Box
      cc.fillStyle = green;
      cc.fillRect(-width2, -height2, width, height); // Draw box
      cc.fillStyle = (aircraft.category == "departure") ? blue : red;
      cc.fillRect(-width2 - bar_width, -height2, bar_width, height);  // Draw colored bar
    }
    else {  // Box with ILS Lock Indicator
      cc.save();

      // Draw green part of box (excludes space where ILS Clearance Indicator juts in)
      cc.fillStyle = green;
      cc.beginPath();
      cc.moveTo(-width2, height2);  // bottom-left corner
      cc.lineTo(width2, height2);   // bottom-right corner
      cc.lineTo(width2, -height2);  // top-right corner
      cc.lineTo(-width2, -height2); // top-left corner
      cc.lineTo(-width2, -point1);  // begin side cutout
      cc.arc(-width2 - bar_width2, -lock_offset, lock_size / 2 + bar_width2, clipping_mask_angle - pi / 2, 0);
      cc.lineTo(-width2 + lock_size / 2, lock_offset);
      cc.arc(-width2 - bar_width2, lock_offset, lock_size / 2 + bar_width2, 0, pi / 2 - clipping_mask_angle);
      cc.closePath();
      cc.fill();

      // Draw ILS Clearance Indicator
      cc.translate(-width2 - bar_width2, 0);
      cc.lineWidth = bar_width;
      cc.strokeStyle = red;
      cc.beginPath(); // top arc start
      cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, pi + pi_slice, true);
      cc.moveTo(0, -lock_size / 2);
      cc.lineTo(0, -height2);
      cc.stroke();    // top arc end
      cc.beginPath(); //bottom arc start
      cc.arc(0, lock_offset, lock_size / 2, pi_slice, pi - pi_slice);
      cc.moveTo(0, lock_size - bar_width);
      cc.lineTo(0, height2);
      cc.stroke();  //bottom arc end
      if (aircraft.mode === "landing") {  // Localizer Capture Indicator
        cc.fillStyle = white;
        cc.beginPath();
        cc.arc(0, 0, lock_size / 5, 0, pi * 2);
        cc.fill();  // Draw Localizer Capture Dot
      }
      cc.translate(width2 + bar_width2, 0);
      // unclear how this works...
      cc.beginPath(); // if removed, white lines appear on top of bottom half of lock case
      cc.stroke();    // if removed, white lines appear on top of bottom half of lock case

      cc.restore();
    }

    // Text
    var gap = 3;          // height of TOTAL vertical space between the rows (0 for touching)
    var lineheight = 4.5; // height of text row (used for spacing basis)
    var row1text = cs;
    var row2text = lpad(round(aircraft.altitude * 0.01), 3) + " " + lpad(round(aircraft.groundSpeed * 0.1), 2);
    if (aircraft.inside_ctr) cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
    else cc.fillStyle   = "rgba(255, 255, 255, 0.2)";
    if(aircraft.trend == 0)     alt_trend_char = String.fromCodePoint(0x2011);  // small dash (symbola font)
    else if(aircraft.trend > 0) alt_trend_char = String.fromCodePoint(0x1F851); // up arrow (symbola font)
    else if(aircraft.trend < 0) alt_trend_char = String.fromCodePoint(0x1F853); // down arrow (symbola font)
    // Draw full datablock text
    cc.textAlign = "left";
    cc.fillText(row1text, -width2 + paddingLR, -gap/2 - lineheight);
    cc.fillText(row2text, -width2 + paddingLR, gap/2 + lineheight);
    // Draw climb/level/descend symbol
    cc.font = "10px symbola"; // change font to the one with extended unicode characters
    cc.textAlign = "center";
    cc.fillText(alt_trend_char, -width2 + paddingLR + 20.2, gap/2 + lineheight - 0.25);
    cc.font = "10px monoOne, monospace";  // change back to normal font

    cc.restore();
  }
}

function canvas_draw_all_info(cc) {
  "use strict";
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_info(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_draw_compass(cc) {
  "use strict";
  cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
  var size    = 80;
  var size2   = size / 2;
  var padding = 16;
  var dot     = 16;

  // Shift compass location
  cc.translate(-size2-padding, -size2-padding);
  cc.lineWidth = 4;

  // Outer circle
  cc.fillStyle = "rgba(0, 0, 0, 0.7)";
  cc.beginPath();
  cc.arc(0, 0, size2, 0, Math.PI*2);
  cc.fill();

  // Inner circle
  cc.lineWidth = 1;
  cc.beginPath();
  cc.arc(0, 0, dot/2, 0, Math.PI*2);
  cc.strokeStyle = "rgba(255, 255, 255, 0.7)";
  cc.stroke();

  // Wind Value
  cc.fillStyle = "rgba(255, 255, 255, 0.7)";
  cc.textAlign = "center";
  cc.textBaseline = "center";
  cc.font = "9px monoOne, monospace";
  cc.fillText(airport_get().wind.speed, 0, 3.8);
  cc.font = "bold 10px monoOne, monospace";

  // Wind line
  var windspeed_line, highwind;
  if(airport_get().wind.speed > 8) {
    windspeed_line = airport_get().wind.speed/2;
    highwind = true;
  } else {
    windspeed_line = airport_get().wind.speed;
    highwind = false;
  }
  cc.save();
  cc.translate(-dot/2 * Math.sin(airport_get().wind.angle), dot/2 * Math.cos(airport_get().wind.angle));
  cc.beginPath();
  cc.moveTo(0, 0);
  cc.rotate(airport_get().wind.angle);
  cc.lineTo(0, crange(0, windspeed_line, 15, 0, size2-dot));
  // Color wind line red for high-wind
  if(highwind) cc.strokeStyle = "rgba(255, 0, 0, 0.7)";
  else cc.strokeStyle = "rgba(255, 255, 255, 0.7)";
  cc.lineWidth = 2;
  cc.stroke();
  cc.restore();

  cc.fillStyle = "rgba(255, 255, 255, 0.7)";

  cc.textAlign = "center";
  cc.textBaseline = "top";
  for(var i=90;i<=360;i+=90) {
    cc.rotate(radians(90));
    if (i==90) var angle = "0" + i;
    else var angle = i;
    cc.save();
    cc.fillText(angle, 0, -size2+4);
    cc.restore();
  }
}

/** Draw circular airspace border
 */
function canvas_draw_ctr(cc) {
  "use strict";

  //Draw a gentle fill color with border within the bounds of the airport's ctr_radius
  cc.fillStyle = "rgba(200, 255, 200, 0.02)";
	cc.strokeStyle = "rgba(200, 255, 200, 0.25)";
  cc.beginPath();
  cc.arc(0, 0, airport_get().ctr_radius*prop.ui.scale, 0, Math.PI*2);
  cc.fill();
	cc.stroke();
}

/** Draw polygonal airspace border
 */
function canvas_draw_airspace_border(cc) {
  if(!airport_get().airspace) canvas_draw_ctr(cc);

  // style
  cc.strokeStyle = "rgba(200, 255, 200, 0.25)";
  cc.fillStyle   = "rgba(200, 255, 200, 0.02)";

  // draw airspace
  for(var i=0; i<airport_get().airspace.length; i++) {
    canvas_draw_poly(cc, $.map(airport_get().perimeter.poly, function(v){return [v.position];}));
    cc.clip();
  }
}

// Draw range rings for ENGM airport to assist in point merge
function canvas_draw_engm_range_rings(cc) {
  "use strict";
  cc.strokeStyle = "rgba(200, 255, 200, 0.3)";
  cc.setLineDash([3,6]);
  canvas_draw_fancy_rings(cc, "BAVAD","GM428","GM432");
  canvas_draw_fancy_rings(cc, "TITLA","GM418","GM422");
  canvas_draw_fancy_rings(cc, "INSUV","GM403","GM416");
  canvas_draw_fancy_rings(cc, "VALPU","GM410","GM402");
}

function canvas_draw_fancy_rings(cc, fix_origin, fix1, fix2) {
  "use strict";
  var arpt = airport_get();
  var origin = arpt.getFix(fix_origin);
  var f1 = arpt.getFix(fix1);
  var f2 = arpt.getFix(fix2);
  var minDist = Math.min( distance2d(origin, f1), distance2d(origin, f2));
  var halfPI = Math.PI / 2;
  var extend_ring = radians(10);
  var start_angle = Math.atan2(f1[0] - origin[0], f1[1] - origin[1]) - halfPI - extend_ring;
  var end_angle = Math.atan2(f2[0] - origin[0], f2[1] - origin[1]) - halfPI + extend_ring;
  var x = round(km_to_px(origin[0])) + prop.canvas.panX;
  var y = -round(km_to_px(origin[1])) + prop.canvas.panY;
  // 5NM = 9.27km
  var radius = 9.27;
  for( var i=0; i<4; i++) {
    cc.beginPath();
    cc.arc(x, y, km_to_px(minDist - (i*radius)), start_angle, end_angle);
    cc.stroke();
  }
}

function canvas_draw_range_rings(cc) {
  var rangeRingRadius = km(airport_get().rr_radius_nm); //convert input param from nm to km

  //Fill up airport's ctr_radius with rings of the specified radius
  for(var i=1; i*rangeRingRadius < airport_get().ctr_radius; i++) {
    cc.beginPath();
    cc.linewidth = 1;
    cc.arc(0, 0, rangeRingRadius*prop.ui.scale*i, 0, Math.PI*2);
    cc.strokeStyle = "rgba(200, 255, 200, 0.1)";
    cc.stroke();
  }
}

function canvas_draw_poly(cc, poly) {
  cc.beginPath();

  for (var v in poly) {
    cc.lineTo(km_to_px(poly[v][0]), -km_to_px(poly[v][1]));
  }

  cc.closePath();
  cc.stroke();
  cc.fill();
}

function canvas_draw_terrain(cc) {
  "use strict";
  if (!prop.canvas.draw_terrain) return;

  cc.strokeStyle = 'rgba(255,255,255,.4)';
  cc.fillStyle = 'rgba(255,255,255,.2)';
  cc.lineWidth = clamp(.5, (prop.ui.scale / 10), 2);
  cc.lineJoin = 'round';

  var airport = airport_get(),
      max_elevation = 0;
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);

  $.each(airport.terrain || [], function(ele, terrain_level) {
    max_elevation = Math.max(max_elevation, ele);
    var color = 'rgba('
      + prop.ui.terrain.colors[ele] + ', ';

    cc.strokeStyle = color + prop.ui.terrain.border_opacity + ')';
    cc.fillStyle = color + prop.ui.terrain.fill_opacity + ')';

    $.each(terrain_level, function(k, v) {
      cc.beginPath();
      $.each(v, function(j, v2) {
        for (var v in v2) {
          if (v == 0)
            cc.moveTo(km_to_px(v2[v][0]), -km_to_px(v2[v][1]));
          else
            cc.lineTo(km_to_px(v2[v][0]), -km_to_px(v2[v][1]));
        }
        cc.closePath();
      });
      cc.fill();
      cc.stroke();
    });
  });

  cc.restore();

  if (max_elevation == 0) return;
  var offset = 10,
      width = prop.canvas.size.width,
      height = prop.canvas.size.height,
      box_width = 30,
      box_height = 5;

  cc.font = "10px monoOne, monospace";
  cc.lineWidth = 1;

  for (var i = 1000; i <= max_elevation; i += 1000) {
    cc.save();
    // translate coordinates for every block to not use these X & Y twice in rect and text
    // .5 in X and Y coordinates are used to make 1px rectangle fit exactly into 1 px
    // and not be blurred
    cc.translate(width / 2 - 140.5 - (max_elevation - i) / 1000 * (box_width + 1), -height/2+offset+.5);
    cc.beginPath();
    cc.rect(0, 0, box_width - 1, box_height);
    cc.closePath();

    // in the map, terrain of higher levels has fill of all the lower levels
    // so we need to fill it below exactly as in the map
    for (var j = 0; j <= i; j += 1000) {
      cc.fillStyle = 'rgba('
          + prop.ui.terrain.colors[j] + ', '
          + prop.ui.terrain.fill_opacity + ')';
      cc.fill();
    }

    cc.strokeStyle = 'rgba('
      + prop.ui.terrain.colors[i] + ', '
      + prop.ui.terrain.border_opacity + ')';

    cc.stroke();

    // write elevation signs only for the outer elevations
    if (i == max_elevation || i == 1000) {
      cc.fillStyle = '#fff';
      cc.textAlign    = "center";
      cc.textBaseline = "top";
      cc.fillText(i + "'", box_width / 2 + .5, offset + 2);
    }

    cc.restore();
  }
}

function canvas_draw_restricted(cc) {
  "use strict";
  if (!prop.canvas.draw_restricted) return;

  cc.strokeStyle = "rgba(150, 200, 255, 0.3)";
  cc.lineWidth   = Math.max(prop.ui.scale / 3, 2);
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";

  var airport=airport_get();
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);
  for(var i in airport.restricted_areas) {
    var area = airport.restricted_areas[i];
    cc.fillStyle   = "transparent";
    canvas_draw_poly(cc, area.coordinates);
    cc.fillStyle   = "rgba(150, 200, 255, .4)";

    cc.textAlign    = "center";
    cc.textBaseline = "top";
    var height = (area.height == Infinity ? 'UNL' : 'FL' + Math.ceil(area.height / 1000)*10);

    var height_shift = 0;
    if (area.name) {
      height_shift = -12;
      cc.fillText(area.name, round(km_to_px(area.center[0])), - round(km_to_px(area.center[1])));
    }

    cc.fillText(height, round(km_to_px(area.center[0])), height_shift - round(km_to_px(area.center[1])));
  }
  cc.restore();
}

function canvas_draw_videoMap(cc) {
  "use strict";
  if(!airport_get().hasOwnProperty("maps")) return;

  cc.strokeStyle = "#c1dacd";
  cc.lineWidth   = prop.ui.scale / 15;
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";

  var airport=airport_get();
  var map = airport.maps.base;
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);
  for(var i in map) {
    cc.moveTo(km_to_px(map[i][0]), -km_to_px(map[i][1]));
    // cc.beginPath();
    cc.lineTo(km_to_px(map[i][2]), -km_to_px(map[i][3]));
  }
    cc.stroke();
  cc.restore();
}

/** Draws crosshairs that point to the currently translated location
 */
function canvas_draw_crosshairs(cc) {
  cc.save();
  cc.strokeStyle = "#899";
  cc.lineWidth = 3;
  cc.beginPath();
  cc.moveTo(-10, 0);
  cc.lineTo( 10, 0);
  cc.stroke();
  cc.beginPath();
  cc.moveTo(0, -10);
  cc.lineTo(0,  10);
  cc.stroke();
  cc.restore();
}

window.canvas_update_post = function canvas_update_post() {
  "use strict";
  var elapsed = game_time() - airport_get().start;
  var alpha   = crange(0.1, elapsed, 0.4, 0, 1);

  var framestep = Math.round(crange(1, prop.game.speedup, 10, 30, 1));

  if(prop.canvas.dirty || (!game_paused() && prop.time.frames % framestep === 0) || elapsed < 1) {
    var cc=canvas_get("navaids");
    var fading  = (elapsed < 1);

    cc.font = "11px monoOne, monospace";

    if(prop.canvas.dirty || fading || true) {
      cc.save();

      canvas_clear(cc);
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_videoMap(cc);
      canvas_draw_terrain(cc);
      canvas_draw_restricted(cc);
      canvas_draw_runways(cc);
      cc.restore();

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_fixes(cc);
      canvas_draw_sids(cc);
      cc.restore();


      cc.restore();
    }

    // Controlled traffic region - (CTR)
    cc.save();
    cc.translate(round(prop.canvas.size.width/2 + prop.canvas.panX), round(prop.canvas.size.height/2 + prop.canvas.panY));   // translate to airport center
    airport_get().airspace ? canvas_draw_airspace_border(cc) : canvas_draw_ctr(cc); // draw airspace border
    canvas_draw_range_rings(cc);
    cc.restore();

    // Special markings for ENGM point merge
    if( airport_get().icao === "ENGM" ) {
      cc.save();
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_engm_range_rings(cc);
      cc.restore();
    }

    // Compass

    cc.font = "bold 10px monoOne, monospace";

    if(prop.canvas.dirty || fading || true) {
      cc.save();
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_compass(cc);
      cc.restore();
    }

    cc.font = "10px monoOne, monospace";

    if(prop.canvas.dirty || canvas_should_draw() || true) {
      cc.save();
      cc.globalAlpha = alpha;
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_all_aircraft(cc);
      cc.restore();
    }

    cc.save();
    cc.globalAlpha = alpha;
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_all_info(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_runway_labels(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    canvas_draw_scale(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    canvas_draw_directions(cc);
    cc.restore();

    prop.canvas.dirty = false;
  }
}

function canvas_draw_directions(cc) {
  if (game_paused())
    return;

  var callsign = prop.input.callsign.toUpperCase();
  if (callsign.length === 0) {
    return;
  }

  // Get the selected aircraft.
  var aircraft = prop.aircraft.list.filter(function(p) {
    return p.isVisible() && p.getCallsign().toUpperCase() === callsign;
  })[0];
  if (!aircraft) {
    return;
  }

  var pos = to_canvas_pos(aircraft.position);
  var rectPos = [0, 0];
  var rectSize = [prop.canvas.size.width, prop.canvas.size.height];

  cc.save();
  cc.strokeStyle = "rgba(224, 224, 224, 0.7)";
  cc.fillStyle = "rgb(255, 255, 255)";
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  for (var alpha = 0; alpha < 360; alpha++) {
    var dir = [sin(radians(alpha)), -cos(radians(alpha))];
    var p = positive_intersection_with_rect(pos, dir, rectPos, rectSize);
    if (p) {
      var markLen = (alpha % 5 === 0 ?
                     (alpha % 10 === 0 ? 16 : 12) :
                     8);
      var markWeight = (alpha % 30 === 0 ?  2 : 1);

      var dx = - markLen * dir[0];
      var dy = - markLen * dir[1];

      cc.lineWidth = markWeight;
      cc.beginPath();
      cc.moveTo(p[0], p[1]);
      var markX = p[0] + dx;
      var markY = p[1] + dy;
      cc.lineTo(markX, markY);
      cc.stroke();

      if (alpha % 10 === 0) {
        cc.font = (alpha % 30 === 0 ?
                   "bold 10px monoOne, monospace" :
                   "10px monoOne, monospace");
        var text = "" + alpha;
        var textWidth = cc.measureText(text).width;
        cc.fillText(text,
                    markX - dir[0] * (textWidth / 2 + 4),
                    markY - dir[1] * 7);
      }
    }
  }
  cc.restore();
}

},{}],9:[function(require,module,exports){
window.zlsa = {atc: {}};

window.$ = require('jquery');
window.Fiber = require('fiber');
// window.peg = require('pegjs');

var util = require('./util');
var animation = require('./animation');
var parser = require('./parser');

var speech = require('./speech');
var get = require('./get');
var tutorial = require('./tutorial');
var base = require('./base');
var game = require('./game');
var input = require('./input');
var airline = require('./airline');
var aircraft = require('./aircraft');
var airport = require('./airport');
var canvas = require('./canvas');
var ui = require('./ui');
// FIXME: shame!
// this is declared here but not set until $(document).ready();
var load;

var Mediator = Fiber.extend(function (base) {
  return {
    init: function (options) {},

    trigger: function(event, data) {
      if (event == 'startLoading') {
        zlsa.atc.LoadUI.startLoad(data);
      }
      else if (event == 'stopLoading') {
        zlsa.atc.LoadUI.stopLoad();
      }
    },
  };
});

zlsa.atc.mediator = new Mediator();

//////////////////////////////////////////////////////////////////////////////////////////

// all modules, prefix with "-" to signify library; <name>_init etc. won't be called
var MODULES = [
  // "-util",
  // "-animation",
  // "-parser",
  // "speech",
  // "get",
  // "tutorial",
  // "base",
  // "game",
  // "input",
  // "airline",
  // "aircraft",
  // "airport",
  // "canvas",
  // "ui",
  // "load"
];

// saved as prop.version and prop.version_string
var VERSION = [2, 1, 8];

// are you using a main loop? (you must call update() afterward disable/reenable)
var UPDATE = true;

// the framerate is updated this often (seconds)
var FRAME_DELAY = 1;

// is this a release build?
var RELEASE = false;

// Usage of async() etc:

// async("image") // call async() once for every async_loaded() you'll call
// $.get(...,function() {async_loaded("image");}) // call async_loaded once for each
//                                                // image once it's loaded
// if async_loaded() is NOT called the same number of times as async() the page will
// NEVER load!

// === CALLBACKS (all optional and do not need to be defined) ===

// INIT:
// module_init_pre()
// module_init()
// module_init_post()

// module_done()
// -- wait until all async has finished (could take a long time) --
// module_ready()
// -- wait until first frame is ready (only triggered if UPDATE == true) --
// module_complete()

// UPDATE:
// module_update_pre()
// module_update()
// module_update_post()

// RESIZE (called at least once during init and whenever page changes size)
// module_resize()

//////////////////////////////////////////////////////////////////////////////////////////

/********* Various fixes for browser issues *********/
  /** Necessary for Internet Explorer 11 (IE11) to not die while using String.fromCodePoint()
   ** This function is not natively available in IE11, as noted on this MSDN page:
   ** https://msdn.microsoft.com/en-us/library/dn890630(v=vs.94).aspx
   ** Apparently, it is fine with pre-Win8.1 MS Edge 11, but never okay in IE.
   ** Here, the function is added to the String prototype to make later code usable.
   ** Solution from: http://xahlee.info/js/js_unicode_code_point.html
   */
  if (!String.fromCodePoint) {
    // ES6 Unicode Shims 0.1 , © 2012 Steven Levithan , MIT License
    String.fromCodePoint = function fromCodePoint () {
      var chars = [], point, offset, units, i;
      for (i = 0; i < arguments.length; ++i) {
        point = arguments[i];
        offset = point - 0x10000;
        units = point > 0xFFFF ? [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)] : [point];
        chars.push(String.fromCharCode.apply(null, units));
      }
      return chars.join("");
    }
  }


/******************* Module Setup *******************/
var async_modules = {};
var async_done_callback = null;

var LOG_DEBUG=0;
var LOG_INFO=1;
var LOG_WARNING=2;
var LOG_ERROR=3;
var LOG_FATAL=4;

var log_strings = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR',
    4: 'FATAL'
};

// PROP
window.prop_init = function prop_init() {
    window.prop = {};
    prop.complete = false;
    prop.temp = 'nothing here';
    prop.version = VERSION;
    prop.version_string = 'v' + VERSION.join('.');
    prop.time = {};
    prop.time.start = time();
    prop.time.frames = 0;
    prop.time.frame = {};
    prop.time.frame.start = time();
    prop.time.frame.delay = FRAME_DELAY;
    prop.time.frame.count = 0;
    prop.time.frame.last = time();
    prop.time.frame.delta = 0;
    prop.time.fps = 0;
    prop.log = LOG_DEBUG;
    prop.loaded = false;

    if (RELEASE) {
        prop.log = LOG_WARNING;
    }
}

// MISC
window.log = function log(message, level) {
    if (level == undefined) {
        level = LOG_INFO;
    }

    if (prop.log <= level) {
        var text = "[ " + log_strings[level] + " ]";

        if (level >= LOG_WARNING) {
            console.warn(text, message);
        } else {
            console.log(text, message);
        }
    }
}

// ASYNC (AJAX etc.)
function async(name) {
  if (name in async_modules)
    async_modules[name] += 1;
  else
    async_modules[name] = 1;
}

function async_loaded(name) {
  async_modules[name]-=1;
  async_check();
}

function async_wait(callback) {
  async_done_callback=callback;
  async_check();
}

function async_check() {
  for(var i in async_modules) {
    if(async_modules[i] != 0)
      return;
  }
  if(async_done_callback)
    async_done_callback();
}

// UTIL
window.time = function time() {
  return new Date().getTime()*0.001;
}

function s(number,single,multiple) {
  if(!single) single="";
  if(!multiple) multiple="s";
  if(single == 1) return single;
  return multiple;
}

// MODULES

function load_module(name) {
  var filename;
  if (name[0] == "-") {
    modules[name].library = true;
    filename = "assets/scripts/"+name.substr(1)+".js";
  } else {
    filename = "assets/scripts/"+name+".js";
  }
  var el = document.createElement("script");
  el.src = filename;
  document.head.appendChild(el);
  el.onload = function() {
    modules[name].script = true;
    //    if(modules[name].library)
    //      log("Loaded library "+name.substr(1));
    //    else
    //      log("Loaded module "+name);
    for(var i in modules) {
      var m = modules[i];
      if (!m.script)
        return;
    }

    call_module("*","init_pre");
    call_module("*","init");
    call_module("*","init_post");
    done();
  };
}

function load_modules() {
  // inserts each module's <script> into <head>
  for (var i in modules) {
    load_module(i);
  }
}

function call_module(name, func, args) {
    console.warn('-- call_module :: func:', func);

    if (!args) {
        args = [];
    };

    if (name == "*") {
        for (var i = 0; i < MODULES.length; i++) {
            call_module(MODULES[i],func,args);
        }

        return null;
    }

    if (name + "_" + func in window && name[0] != "-") {
        return window[name + "_" + func].apply(window, args);
    }

    return null;
}

$(document).ready(function() {
    modules = {};

    for (var i = 0; i < MODULES.length; i++) {
        modules[MODULES[i]] = {
            library: false,
            script: false,
        };
    }

    prop_init();
    log('Version ' + prop.version_string);
    // load_modules();

    // TODO: temp fix to get browserify working
    tutorial_init_pre();
    game_init_pre();
    input_init_pre();
    airline_init_pre();
    aircraft_init_pre();
    airport_init_pre();
    canvas_init_pre();
    ui_init_pre();

    // FIXME: shame!
    load = require('./load');

    speech_init();
    tutorial_init();
    input_init();
    aircraft_init();
    airport_init();
    canvas_init();
    ui_init();

    done();
});

function done() {
    var e = time() - prop.time.start;
    e = e.toPrecision(2);
    log('Finished loading ' + MODULES.length + ' module' + s(MODULES.length) + ' in ' + e + 's');

    $(window).resize(resize);
    resize();

    call_module('*','done');

    prop.loaded = true;
    call_module('*','ready');

    // TODO: temp fix to get browserify working
    airport_ready();

    if (UPDATE) {
        requestAnimationFrame(update);
    }
}

function resize() {
    call_module("*","resize");

    // TODO: temp fix to get browserify working
    canvas_resize();
}

function update() {
    if (!prop.complete) {
        call_module("*","complete");

        // TODO: temp fix to get browserify working
        game_complete();
        canvas_complete();
        ui_complete();

        zlsa.atc.LoadUI.complete();
        prop.complete = true;
    }

    if (UPDATE) {
        requestAnimationFrame(update);
    } else {
        return;
    }

    game_update_pre();
    aircraft_update();
    canvas_update_post();

    prop.time.frames += 1;
    prop.time.frame.count += 1;

    var elapsed = time() - prop.time.frame.start;
    if (elapsed > prop.time.frame.delay) {
        prop.time.fps = prop.time.frame.count / elapsed;
        prop.time.frame.count = 0;
        prop.time.frame.start = time();
    }

    prop.time.frame.delta = Math.min(time() - prop.time.frame.last, 1/20);
    prop.time.frame.last = time();
}

/**
 * Change whether updates should run
 */
window.update_run = function update_run(arg) {
  if ((!UPDATE) && arg)
    requestAnimationFrame(update);
  UPDATE = arg;
}

window.delta = function delta() {
  return prop.time.frame.delta;
}

},{"./aircraft":3,"./airline":4,"./airport":5,"./animation":6,"./base":7,"./canvas":8,"./game":10,"./get":11,"./input":12,"./load":13,"./parser":14,"./speech":15,"./tutorial":16,"./ui":17,"./util":18,"fiber":1,"jquery":2}],10:[function(require,module,exports){
zlsa.atc.Options = Fiber.extend(function (base) {
  return {
    init: function () {
      this._options = {};
      this.addOption({
        name: 'controlMethod',
        defaultValue: 'classic',
        description: 'Control Method',
        type: 'select',
        data: [['Classic', 'classic'],
               ['Arrow Keys', 'arrows']]
      });
      this.addOption({
        name: 'drawProjectedPaths',
        defaultValue: 'selected',
        description: 'Draw aircraft projected path',
        type: 'select',
        data: [['Always', 'always'],
               ['Selected', 'selected'],
               ['Never', 'never']]
      });
      this.addOption({
        name: 'simplifySpeeds',
        defaultValue: 'yes',
        description: 'Use simplified airspeeds',
        help: 'Controls use of a simplified calculation which results in'
          + ' aircraft always moving across the ground at the speed assigned.'
          + ' In reality aircraft will move faster as they increase altitude.',
        type: 'select',
        data: [['Yes', 'yes'],
               ['No', 'no']]
      });
      this.addOption({
        name: 'softCeiling',
        defaultValue: 'no',
        description: 'Allow departures via climb',
        help: 'Normally aircraft depart the airspace by flying beyond'
          + ' the horizontal bounds.  If set to yes, aircraft may also'
          + ' depart the airspace by climbing above it.',
        type: 'select',
        data: [['Yes', 'yes'],
               ['No', 'no']],
      });
    },
    addOption: function(data) {
      this._options[data.name] = data;
      if ('zlsa.atc.option.'+data.name in localStorage)
        this[data.name] = localStorage['zlsa.atc.option.'+data.name];
      else
        this[data.name] = data.defaultValue;
    },
    getDescriptions: function() {
      return this._options;
    },
    get: function(name) {
      return this[name];
    },
    set: function(name, value) {
      localStorage['zlsa.atc.option.'+name] = value;
      this[name] = value;
      return value;
    },
  };
});

window.game_init_pre = function game_init_pre() {
  prop.game={};

  prop.game.paused=true;
  prop.game.focused=true;

  prop.game.speedup=1;

  prop.game.frequency=1;

  prop.game.time=0;
  prop.game.delta=0;

  prop.game.timeouts=[];

  $(window).blur(function() {
    prop.game.focused=false;
  });

  $(window).focus(function() {
    prop.game.focused=true;
  });

  prop.game.last_score = 0;
  prop.game.score = {
    arrival: 0,
    departure: 0,

    windy_landing: 0,
    windy_takeoff: 0,

    failed_arrival: 0,
    failed_departure: 0,

    warning: 0,
    hit: 0,

    abort: {
      landing: 0,
      taxi: 0
    },

    violation: 0,
    restrictions: 0
  };

  prop.game.option = new zlsa.atc.Options();
}

window.game_get_score = function game_get_score() {
  var score = 0;
  score += prop.game.score.arrival * 10;
  score += prop.game.score.departure * 10;

  score -= prop.game.score.windy_landing * 0.5;
  score -= prop.game.score.windy_takeoff * 0.5;

  score -= prop.game.score.failed_arrival * 20;
  score -= prop.game.score.failed_departure * 2;

  score -= prop.game.score.warning * 5;
  score -= prop.game.score.hit * 50;

  score -= prop.game.score.abort.landing * 5;
  score -= prop.game.score.abort.taxi * 2;

  score -= prop.game.score.violation;
  score -= prop.game.score.restrictions * 10;

  return score;
}

window.game_get_weighted_score = function game_get_weighted_score() {
  var score = game_get_score();
  score     = score / (game_time() / 60);
  score    *= 500;
  return score;
}

window.game_reset_score = function game_reset_score() {
  prop.game.score.abort = {"landing": 0, "taxi": 0};
  prop.game.score.arrival = 0;
  prop.game.score.departure = 0;
  prop.game.score.failed_arrival = 0;
  prop.game.score.failed_departure = 0;
  prop.game.score.hit = 0;
  prop.game.score.restrictions = 0;
  prop.game.score.violation = 0;
  prop.game.score.warning = 0;
  prop.game.score.windy_landing = 0;
  prop.game.score.windy_takeoff = 0;
}

window.game_timewarp_toggle = function game_timewarp_toggle() {
  if(prop.game.speedup == 5) {
    prop.game.speedup = 1;
    $(".fast-forwards").removeClass("speed-5");
    $(".fast-forwards").prop("title", "Set time warp to 2");
  } else if(prop.game.speedup == 1){
    prop.game.speedup = 2;
    $(".fast-forwards").addClass("speed-2");
    $(".fast-forwards").prop("title", "Set time warp to 5");
  }else {
    prop.game.speedup = 5;
    $(".fast-forwards").removeClass("speed-2");
    $(".fast-forwards").addClass("speed-5");
    $(".fast-forwards").prop("title", "Reset time warp");
  }
}

window.game_pause = function game_pause() {
  prop.game.paused = true;
  $(".pause-toggle").addClass("active");
  $(".pause-toggle").attr("title", "Resume simulation");
  $("html").addClass("paused");
}

window.game_unpause = function game_unpause() {
  prop.game.paused = false;
  $(".pause-toggle").removeClass("active");
  $(".pause-toggle").attr("title", "Pause simulation");
  $("html").removeClass("paused");
}

window.game_pause_toggle = function game_pause_toggle() {
  if(prop.game.paused) {
    game_unpause();
  } else {
    game_pause();
  }
}

window.game_paused = function game_paused() {
  return !prop.game.focused || prop.game.paused;
}

window.game_time = function game_time() {
  return prop.game.time;
}

window.game_delta = function game_delta() {
  return prop.game.delta;
}

window.game_speedup = function game_speedup() {
  if(game_paused()) return 0;
  return prop.game.speedup;
}

window.game_timeout = function game_timeout(func, delay, that, data) {
  var to = [func, game_time()+delay, data, delay, false, that];
  prop.game.timeouts.push(to);
  return to;
}

window.game_interval = function game_interval(func, delay, that, data) {
  var to = [func, game_time()+delay, data, delay, true, that];
  prop.game.timeouts.push(to);
  return to;
}

window.game_clear_timeout = function game_clear_timeout(to) {
  prop.game.timeouts.splice(prop.game.timeouts.indexOf(to), 1);
}

window.game_update_pre = function game_update_pre() {
  var score = game_get_score();
  if (score != prop.game.last_score) {
    $("#score").text(round(score));
    if(score < -0.51)
      $("#score").addClass("negative");
    else
      $("#score").removeClass("negative");
    prop.game.last_score = score;
  }

  prop.game.delta=Math.min(delta()*prop.game.speedup, 100);
  if(game_paused()) {
    prop.game.delta=0;
  } else {
    $("html").removeClass("paused");
  }
  prop.game.time+=prop.game.delta;
  for(var i=prop.game.timeouts.length-1;i>=0;i--) {
    var remove  = false;
    var timeout = prop.game.timeouts[i];
    if(game_time() > timeout[1]) {
      timeout[0].call(timeout[5], timeout[2]);
      if(timeout[4]) {
        timeout[1] += timeout[3];
      } else {
        remove=true;
      }
    }
    if(remove) {
      prop.game.timeouts.splice(i, 1);
      i-=1;
    }
  }
}

window.game_complete = function game_complete() {
  prop.game.paused=false;
}

},{}],11:[function(require,module,exports){
/**
 * Asynchronous JSON asset loading framework.
 *
 * Allows queueing assets to be loaded, assets may queued at a higher
 * priority by specifying the `immediate` option.  All assets with the
 * `immediate` option will be loaded before other assets.
 *
 * Events:
 *   startLoading - When an asset start being loaded, asset url as data
 *   stopLoading - When the last asset in the queue is downloaded
 *
 * Example:
 *  var promise = zlsa.atc.loadAsset({url: 'assets/aircraft/b747.json'});
 *
 * @module zlsa.atc.loadAsset
 */
(function ($, zlsa, Fiber, mediator) {
  "use strict";

  /**
   * Simple container for a given piece of content
   */
  var Content = Fiber.extend(function (base) {
    return {
      init: function(options) {
        this.url = options.url;
        this.immediate = (options.immediate ? true : false);
        this.type = 'json';
        this.deferred = $.Deferred();
      },
    };
  });

  /**
   * Implementation of the queueing
   */
  var ContentQueueClass = Fiber.extend(function (base) {
    return {
      init: function(options) {
        this.loading = false;
        this.lowPriorityQueue = [];
        this.highPriorityQueue = [];
        this.queuedContent = {};
      },

      /**
       * Adds or updates a piece of content
       *
       * Supports a url becoming an `immediate` load
       */
      add: function(options) {
        var c = new Content(options);
        if (c.url in this.queuedContent) {
          c = this.queuedContent[c.url];
          if (c.immediate && (!this.queuedContent[c.url].immediate)) {
            var idx = $.inArray(c.url, this.lowPriorityQueue);
            if (idx > -1) {
              this.highPriorityQueue.push(
                this.lowPriorityQueue.splice(idx, 1)
              );
            }
          }
        }
        else {
          this.queuedContent[c.url] = c;
          if (c.immediate) {
            this.highPriorityQueue.push(c.url);
          }
          else {
            this.lowPriorityQueue.push(c.url);
          }
        }
        if (!this.loading) {
          this.startLoad();
        }

        return c.deferred.promise();
      },

      startLoad: function() {
        if (this.highPriorityQueue.length) {
          this.load(this.highPriorityQueue.shift());
          return true;
        }
        else if (this.lowPriorityQueue.length) {
          this.load(this.lowPriorityQueue.shift());
          return true;
        }
        else {
          return false;
        }
      },

      load: function(url) {
        var c = this.queuedContent[url];
        zlsa.atc.mediator.trigger('startLoading', c.url);

        $.getJSON(c.url)
          .done(function (data, textStatus, jqXHR) {
            c.deferred.resolve(data, textStatus, jqXHR);
          }.bind(this))
          .fail(function (jqXHR, textStatus, errorThrown) {
            c.deferred.reject(jqXHR, textStatus, errorThrown);
          }.bind(this))
          .always(function () {
            delete this.queuedContent[c.url];
            if (!this.startLoad()) {
              zlsa.atc.mediator.trigger('stopLoading');
            }
          }.bind(this));
      },
    };
  });

  var contentQueue = new ContentQueueClass();

  /*
    zlsa.atc.Loader.queue(
    {url: 'foo/bar',
    immediate: true,}
    );
    @return Promise
  */
  zlsa.atc.loadAsset = function(options) {
    return contentQueue.add(options);
  };
})($, zlsa, Fiber, zlsa.atc.mediator);

},{}],12:[function(require,module,exports){
window.input_init_pre = function input_init_pre() {
  prop.input = {};

  prop.input.command  = '';
  prop.input.callsign = '';
  prop.input.data     = '';

  prop.input.history      = [];
  prop.input.history_item = null;

  prop.input.click    = [0, 0];

  prop.input.positions = '';

  prop.input.tab_compl = {};

  prop.input.mouseDelta = [0, 0];
  prop.input.mouseDown = [0, 0];
  prop.input.isMouseDown = false;
};

window.input_init = function input_init() {
  // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  $(window).keydown(function(e) {
    if(e.which == 27) {
      if(prop.tutorial.open) tutorial_close();
      else if($("#airport-switch").hasClass("open")) ui_airport_close();
    }
    // Minus key to zoom out, plus to zoom in
    if(e.which == 189 || (is_firefox && e.which == 173)) {
      ui_zoom_out();
      return false;
    } else if(e.which == 187 || (is_firefox && e.which == 61)) {
      if(e.shiftKey) {
        ui_zoom_in();
      } else {
        ui_zoom_reset();
      }
      return false;
    }
    if(!prop.tutorial.open) return;
    if(e.which == 33) {
      tutorial_prev()
      e.preventDefault();
    } else if(e.which == 34) {
      tutorial_next()
      e.preventDefault();
    }
  });

  $("#canvases").bind("DOMMouseScroll mousewheel", function(e) {
    if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
      ui_zoom_in();
    } else {
      ui_zoom_out();
    }
  });

  $("#canvases").mousemove(function(e) {
    if(prop.input.isMouseDown){
      prop.input.mouseDelta = [e.pageX - prop.input.mouseDown[0], e.pageY - prop.input.mouseDown[1]];
      prop.canvas.panX = prop.input.mouseDelta[0];
      prop.canvas.panY = prop.input.mouseDelta[1];
      prop.canvas.dirty = true;
    }
  });

  $("#canvases").mouseup(function(e) {
    prop.input.isMouseDown = false;
  });

  $("#canvases").mousedown(function(e) {
    if(e.which  == 2) {
      e.preventDefault();
      ui_zoom_reset();
    } else if(e.which ==1){
      // Record mouse down position for panning
      prop.input.mouseDown = [e.pageX - prop.canvas.panX, e.pageY - prop.canvas.panY];
      prop.input.isMouseDown = true;

      // Aircraft label selection
      var position = [e.pageX, -e.pageY];
      position[0] -= prop.canvas.size.width / 2;
      position[1] += prop.canvas.size.height / 2;
      var nearest = aircraft_get_nearest([px_to_km(position[0] - prop.canvas.panX), px_to_km(position[1] + prop.canvas.panY)]);
      if(nearest[0]) {
        if(nearest[1] < px_to_km(80)) {
          input_select(nearest[0].getCallsign().toUpperCase());
        } else {
          input_select();
        }
      }
      position = [px_to_km(position[0]), px_to_km(position[1])];
      position[0] = parseFloat(position[0].toFixed(2));
      position[1] = parseFloat(position[1].toFixed(2));
      prop.input.positions += "["+position.join(",")+"]";
      e.preventDefault();
      return(false);
    }
  });

  $(window).keydown(function() {
    if(!game_paused())
      $("#command").focus();
  });

  $("#command").keydown(input_keydown);
  $("#command").on("input", input_change);
};

window.input_select = function input_select(callsign) {
  if(callsign) $("#command").val(callsign + " ");
  else $("#command").val('');
  $("#command").focus();
  input_change();
}

window.input_change = function input_change() {
  tab_completion_reset();
  prop.input.command = $("#command").val();
  input_parse();
}

window.input_parse = function input_parse() {
  $(".strip").removeClass("active");
  prop.input.callsign = '';
  prop.input.data     = '';

  if (prop.input.command.length == 0)
    return;

  var match = /^\s*(\w+)/.exec(prop.input.command);
  if (match) {
    prop.input.callsign = match[1];
  }
  else {
    return;
  }

  var number = 0;
  var match  = null;

  prop.canvas.dirty = true;

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(prop.input.callsign)) {
      number += 1;
      match = aircraft;
      aircraft.html.addClass("active");
    }
  }

  var sidebar = $('#sidebar');

  if ((number == 1) &&
      ((match.html.offset().top < 0) ||
       ((match.html.offset().top
         + match.html.height()
         - sidebar.offset().top)
        > sidebar.height())))
  {
    sidebar.scrollTop(sidebar.scrollTop()
                      + match.html.offset().top
                      - (sidebar.height() / 2));
  }
}

window.input_keydown = function input_keydown(e) {
  switch(e.which) {
    case 13:  // enter
      input_parse();
      if(input_run()) {
        prop.input.history.unshift(prop.input.callsign);
        $("#command").val('');
        prop.input.command = '';
        tab_completion_reset();
        input_parse();
      }
      prop.input.history_item = null;
      break;

    case 33:  // Page Up
      input_history_prev(); // recall previous callsign
      e.preventDefault();
      break;

    case 34:  // Page Down
      input_history_next(); // recall subsequent callsign
      e.preventDefault();
      break;

    case 37:  // left arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2BA2");
        e.preventDefault();
        input_change();
      }
      break;

    case 38:  // up arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2B61");
        e.preventDefault();
        input_change();
      }
      else {
        input_history_prev(); // recall previous callsign
        e.preventDefault();
      }
      break;

    case 39:  // right arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2BA3");
        e.preventDefault();
        input_change();
      }
      break;

    case 40:  //down arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2B63");
        e.preventDefault();
        input_change();
      }
      else {
        input_history_prev(); // recall previous callsign
        e.preventDefault();
      }
      break;

    case 106: //numpad *
      $("#command").val($("#command").val() + " \u2B50");
      e.preventDefault();
      input_change();
      break;

    case 107: //numpad +
      $("#command").val($("#command").val() + " +");
      e.preventDefault();
      input_change();
      break;

    case 109: //numpad -
      $("#command").val($("#command").val() + " -");
      e.preventDefault();
      input_change();
      break;

    case 111: //numpad /
      $("#command").val($("#command").val() + " takeoff");
      e.preventDefault();
      input_change();
      break;

    case 9: // tab
      if(!prop.input.tab_compl.matches) {
        tab_completion_match();
      }
      tab_completion_cycle({backwards: e.shiftKey});
      e.preventDefault();
      break;

    case 27:  // esc
      $("#command").val('');
      e.preventDefault();
      break;
  }
}

window.tab_completion_cycle = function tab_completion_cycle(opt) {
  var matches = prop.input.tab_compl.matches;
  if(!matches || matches.length === 0) {
    return;
  }
  var i = prop.input.tab_compl.cycle_item;
  if(opt.backwards) {
    i = (i <= 0) ? matches.length-1 : i-1;
  } else {
    i = (i >= matches.length-1) ? 0 : i+1;
  }
  $("#command").val(matches[i] + " ");
  prop.input.command = matches[i];
  prop.input.tab_compl.cycle_item = i;
  input_parse();
}

window.tab_completion_match = function tab_completion_match() {
  var val = $("#command").val();
  var matches;
  var aircrafts = prop.aircraft.list;
  if(prop.input.callsign) {
    aircrafts = aircrafts.filter(function(a) {
      return a.matchCallsign(prop.input.callsign);
    });
  }
  matches = aircrafts.map(function(a) {
    return a.getCallsign();
  });
  if(aircrafts.length === 1 && (prop.input.data || val[val.length-1] === ' ')){
    matches = aircrafts[0].COMMANDS.filter(function(c) {
      return c.toLowerCase().indexOf(prop.input.data.toLowerCase()) === 0;
    }).map(function(c) {
      return val.substring(0, prop.input.callsign.length+1) + c;
    });
  }
  tab_completion_reset();
  prop.input.tab_compl.matches = matches;
  prop.input.tab_compl.cycle_item = -1;
}

window.tab_completion_reset = function tab_completion_reset() {
  prop.input.tab_compl = {};
}

window.input_history_clamp = function input_history_clamp() {
  prop.input.history_item = clamp(0, prop.input.history_item, prop.input.history.length-1);
}

window.input_history_prev = function input_history_prev() {
  if(prop.input.history.length == 0) return;
  if(prop.input.history_item == null) {
    prop.input.history.unshift(prop.input.command);
    prop.input.history_item = 0;
  }

  prop.input.history_item += 1;
  input_history_clamp();

  var command = prop.input.history[prop.input.history_item] + ' ';
  $("#command").val(command.toUpperCase());
  input_change();
}

window.input_history_next = function input_history_next() {
  if(prop.input.history.length == 0) return;
  if(prop.input.history_item == null) return;

  prop.input.history_item -= 1;

  if(prop.input.history_item <= 0){
    $("#command").val(prop.input.history[0]);
    input_change();
    prop.input.history.splice(0, 1);
    prop.input.history_item = null;
    return;
  }

  input_history_clamp();

  var command = prop.input.history[prop.input.history_item] + ' ';
  $("#command").val(command.toUpperCase());
  input_change();
}

window.input_run = function input_run() {
  var result;
  try {
    result = zlsa.atc.Parser.parse(prop.input.command.trim().toLowerCase());
  }
  catch (e) {
    if (e.hasOwnProperty('name') && e.name == 'SyntaxError') {
      ui_log("Command not understood");
      return;
    }
    throw e;
  }

  if(result.command == "version") {
    ui_log("Air Traffic Control simulator version " + prop.version.join("."));
    return true;
  } else if(result.command == "tutorial") {
    tutorial_toggle();
    return true;
  } else if(result.command == "auto") {
    aircraft_toggle_auto();
    if(prop.aircraft.auto.enabled) {
      ui_log('automatic controller ENGAGED');
    } else {
      ui_log('automatic controller OFF');
    }
    return true;
  } else if(result.command == "pause") {
    game_pause_toggle();
    return true;
  } else if(result.command == "timewarp") {
    if (result.args) {
      prop.game.speedup = result.args;
    } else {
      game_timewarp_toggle();
    }
    return true;
  } else if(result.command == "clear") {
    localStorage.clear();
    location.reload();
  } else if(result.command == "airport") {
    if(result.args) {
      if(result.args.toLowerCase() in prop.airport.airports) {
        airport_set(result.args.toLowerCase());
      } else {
        ui_airport_toggle();
      }
    } else {
      ui_airport_toggle();
    }
    return true;
  } else if(result.command == "rate") {
    if (result.args && result.args > 0) {
      prop.game.frequency = result.args;
    }
    return true;
  } else if(result.command != 'transmit') {
    return true;
  }

  var matches = 0;
  var match   = -1;

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(result.callsign)) {
      matches += 1;
      match    = i;
    }
  }

  if(matches > 1) {
    ui_log("multiple aircraft match the callsign, say again");
    return true;
  }
  if(match == -1) {
    ui_log("no such aircraft, say again");
    return true;
  }

  var aircraft = prop.aircraft.list[match];
  return aircraft.runCommands(result.args);
}

},{}],13:[function(require,module,exports){
/**
 * Loading indicator elements for HTML interface
 */
(function ($, zlsa, Fiber, mediator, version_string) {
  'use strict';
  $('#loading').append('<div class="version">' + version_string + '</div>');

  var minimumDisplayTime = 2; //seconds

  var state = {
    loading: false,
    callback: null,
    start: null
  };

  zlsa.atc.LoadUI = {
    complete: function() {
      $('#loading').fadeOut(1000);
      $('#loading').css('pointerEvents','none');
    },

    startLoad: function(url) {
      var msg = url;
      if (url.length > 15)
        msg = '...' + url.substr(-12);
      $('#loadingIndicator .message').text(msg);

      if (!state.loading) {
        $('#loadingIndicator').show();
        state.start = new Date().getTime() * 0.001;
      }

      if (state.callback !== null) {
        clearTimeout(state.callback);
        state.callback = null;
      }
    },

    stopLoad: function() {
      var now = new Date().getTime() * 0.001;
      if ((now - state.start) > minimumDisplayTime) {
        $('#loadingIndicator').hide();
        state.start = null;
        state.loading = false;
      } else {
        if (state.callback !== null) {
          return;
        }

        state.callback = setTimeout(function () {
          $('#loadingIndicator').hide();
          state.start = null;
          state.loading = false;
          state.callback = null;
        }, (minimumDisplayTime - (now - state.start)) * 1000);
      }
    },
  };
})($, zlsa, Fiber, zlsa.atc.mediator, prop.version_string);

},{}],14:[function(require,module,exports){
zlsa.atc.Parser = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { InputParseGrammar: peg$parseInputParseGrammar },
        peg$startRuleFunction  = peg$parseInputParseGrammar,

        peg$c0 = "version",
        peg$c1 = { type: "literal", value: "version", description: "\"version\"" },
        peg$c2 = function() {return ['version', null] },
        peg$c3 = "tutorial",
        peg$c4 = { type: "literal", value: "tutorial", description: "\"tutorial\"" },
        peg$c5 = function() {return ['tutorial', null] },
        peg$c6 = "auto",
        peg$c7 = { type: "literal", value: "auto", description: "\"auto\"" },
        peg$c8 = function() {return ['auto', null] },
        peg$c9 = "pause",
        peg$c10 = { type: "literal", value: "pause", description: "\"pause\"" },
        peg$c11 = function() {return ['pause', null] },
        peg$c12 = "clear",
        peg$c13 = { type: "literal", value: "clear", description: "\"clear\"" },
        peg$c14 = function() {return ['clear', null] },
        peg$c15 = function(cmd) { return {command: cmd[0], args: cmd[1]}},
        peg$c16 = function(cmd) { return {command: 'transmit', callsign: cmd[0], args: cmd[1]}},
        peg$c17 = "timewarp",
        peg$c18 = { type: "literal", value: "timewarp", description: "\"timewarp\"" },
        peg$c19 = "speedup",
        peg$c20 = { type: "literal", value: "speedup", description: "\"speedup\"" },
        peg$c21 = "slowmo",
        peg$c22 = { type: "literal", value: "slowmo", description: "\"slowmo\"" },
        peg$c23 = "timescale",
        peg$c24 = { type: "literal", value: "timescale", description: "\"timescale\"" },
        peg$c25 = function(command) {return command},
        peg$c26 = "airport",
        peg$c27 = { type: "literal", value: "airport", description: "\"airport\"" },
        peg$c28 = "rate",
        peg$c29 = { type: "literal", value: "rate", description: "\"rate\"" },
        peg$c30 = "abort",
        peg$c31 = { type: "literal", value: "abort", description: "\"abort\"" },
        peg$c32 = function() {return ["abort"]},
        peg$c33 = "\u2B61",
        peg$c34 = { type: "literal", value: "\u2B61", description: "\"\\u2B61\"" },
        peg$c35 = "\u2B63",
        peg$c36 = { type: "literal", value: "\u2B63", description: "\"\\u2B63\"" },
        peg$c37 = function(arg) {return ["altitude", arg*100, null]},
        peg$c38 = "altitude",
        peg$c39 = { type: "literal", value: "altitude", description: "\"altitude\"" },
        peg$c40 = "climb",
        peg$c41 = { type: "literal", value: "climb", description: "\"climb\"" },
        peg$c42 = "descend",
        peg$c43 = { type: "literal", value: "descend", description: "\"descend\"" },
        peg$c44 = "a",
        peg$c45 = { type: "literal", value: "a", description: "\"a\"" },
        peg$c46 = "c",
        peg$c47 = { type: "literal", value: "c", description: "\"c\"" },
        peg$c48 = "d",
        peg$c49 = { type: "literal", value: "d", description: "\"d\"" },
        peg$c50 = function(arg) {return arg*100},
        peg$c51 = "expedite",
        peg$c52 = { type: "literal", value: "expedite", description: "\"expedite\"" },
        peg$c53 = "x",
        peg$c54 = { type: "literal", value: "x", description: "\"x\"" },
        peg$c55 = function(altitude) {return true},
        peg$c56 = function(altitude, expedite) { return ((altitude == null) && (expedite == null)) },
        peg$c57 = function(altitude, expedite) {return ["altitude", altitude, expedite]},
        peg$c58 = "clearedasfiled",
        peg$c59 = { type: "literal", value: "clearedasfiled", description: "\"clearedasfiled\"" },
        peg$c60 = "caf",
        peg$c61 = { type: "literal", value: "caf", description: "\"caf\"" },
        peg$c62 = function() { return ["clearedAsFiled"] },
        peg$c63 = "climbviasid",
        peg$c64 = { type: "literal", value: "climbviasid", description: "\"climbviasid\"" },
        peg$c65 = "cvs",
        peg$c66 = { type: "literal", value: "cvs", description: "\"cvs\"" },
        peg$c67 = function() {return ["climbViaSID"] },
        peg$c68 = "debug",
        peg$c69 = { type: "literal", value: "debug", description: "\"debug\"" },
        peg$c70 = "log",
        peg$c71 = { type: "literal", value: "log", description: "\"log\"" },
        peg$c72 = function() {return ["debug"]},
        peg$c73 = "delete",
        peg$c74 = { type: "literal", value: "delete", description: "\"delete\"" },
        peg$c75 = "del",
        peg$c76 = { type: "literal", value: "del", description: "\"del\"" },
        peg$c77 = "kill",
        peg$c78 = { type: "literal", value: "kill", description: "\"kill\"" },
        peg$c79 = function() {return ["delete"]},
        peg$c80 = "descendviastar",
        peg$c81 = { type: "literal", value: "descendviastar", description: "\"descendviastar\"" },
        peg$c82 = "dvs",
        peg$c83 = { type: "literal", value: "dvs", description: "\"dvs\"" },
        peg$c84 = function() {return ["descendViaSTAR"]},
        peg$c85 = "direct",
        peg$c86 = { type: "literal", value: "direct", description: "\"direct\"" },
        peg$c87 = "dct",
        peg$c88 = { type: "literal", value: "dct", description: "\"dct\"" },
        peg$c89 = "pd",
        peg$c90 = { type: "literal", value: "pd", description: "\"pd\"" },
        peg$c91 = function() {return "direct"},
        peg$c92 = "fix",
        peg$c93 = { type: "literal", value: "fix", description: "\"fix\"" },
        peg$c94 = "f",
        peg$c95 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c96 = "track",
        peg$c97 = { type: "literal", value: "track", description: "\"track\"" },
        peg$c98 = function() {return "fix"},
        peg$c99 = "fph",
        peg$c100 = { type: "literal", value: "fph", description: "\"fph\"" },
        peg$c101 = function() {return ['flyPresentHeading']},
        peg$c102 = function(cmd) { return [cmd[0], cmd[1], cmd[2][0], cmd[2][1]] },
        peg$c103 = "\u2BA2",
        peg$c104 = { type: "literal", value: "\u2BA2", description: "\"\\u2BA2\"" },
        peg$c105 = function() {return "left"},
        peg$c106 = "\u2BA3",
        peg$c107 = { type: "literal", value: "\u2BA3", description: "\"\\u2BA3\"" },
        peg$c108 = function() {return "right"},
        peg$c109 = "fh",
        peg$c110 = { type: "literal", value: "fh", description: "\"fh\"" },
        peg$c111 = function() {return null},
        peg$c112 = function(dir, arg) {return ['heading', dir, arg]},
        peg$c113 = "heading",
        peg$c114 = { type: "literal", value: "heading", description: "\"heading\"" },
        peg$c115 = "turn",
        peg$c116 = { type: "literal", value: "turn", description: "\"turn\"" },
        peg$c117 = "t",
        peg$c118 = { type: "literal", value: "t", description: "\"t\"" },
        peg$c119 = "h",
        peg$c120 = { type: "literal", value: "h", description: "\"h\"" },
        peg$c121 = function() {return "heading"},
        peg$c122 = function(arg) {return arg},
        peg$c123 = /^[0-9]/,
        peg$c124 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c125 = function() {return [parseInt(text()), false]},
        peg$c126 = function() {return [parseInt(text()), true]},
        peg$c127 = "hold",
        peg$c128 = { type: "literal", value: "hold", description: "\"hold\"" },
        peg$c129 = "min",
        peg$c130 = { type: "literal", value: "min", description: "\"min\"" },
        peg$c131 = "nm",
        peg$c132 = { type: "literal", value: "nm", description: "\"nm\"" },
        peg$c133 = function(dir, length, fix) {return ["hold",
                     dir,
                     length ? length[1] + length[2] : null,
                     fix ? fix[2] : null]},
        peg$c134 = function(cmd) {return [cmd[0], cmd[1], cmd[2]]},
        peg$c135 = "land",
        peg$c136 = { type: "literal", value: "land", description: "\"land\"" },
        peg$c137 = "l",
        peg$c138 = { type: "literal", value: "l", description: "\"l\"" },
        peg$c139 = "ils",
        peg$c140 = { type: "literal", value: "ils", description: "\"ils\"" },
        peg$c141 = function() {return "land"},
        peg$c142 = /^[a-z]/i,
        peg$c143 = { type: "class", value: "[a-z]i", description: "[a-z]i" },
        peg$c144 = function(cmd, variant, arg) {return [variant, arg]},
        peg$c145 = function(cmd, arg) { return [cmd, arg[0], arg[1]] },
        peg$c146 = "\u2B50",
        peg$c147 = { type: "literal", value: "\u2B50", description: "\"\\u2B50\"" },
        peg$c148 = "movedatablock",
        peg$c149 = { type: "literal", value: "movedatablock", description: "\"movedatablock\"" },
        peg$c150 = "`",
        peg$c151 = { type: "literal", value: "`", description: "\"`\"" },
        peg$c152 = function() {return "moveDataBlock"},
        peg$c153 = /^[1-9]/,
        peg$c154 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c155 = "route",
        peg$c156 = { type: "literal", value: "route", description: "\"route\"" },
        peg$c157 = function(arg) {return ["route", arg]},
        peg$c158 = "reroute",
        peg$c159 = { type: "literal", value: "reroute", description: "\"reroute\"" },
        peg$c160 = "rr",
        peg$c161 = { type: "literal", value: "rr", description: "\"rr\"" },
        peg$c162 = function(arg) {return ["reroute", arg]},
        peg$c163 = "sayroute",
        peg$c164 = { type: "literal", value: "sayroute", description: "\"sayroute\"" },
        peg$c165 = "sr",
        peg$c166 = { type: "literal", value: "sr", description: "\"sr\"" },
        peg$c167 = function() {return ["sayRoute"]},
        peg$c168 = "sid",
        peg$c169 = { type: "literal", value: "sid", description: "\"sid\"" },
        peg$c170 = function(arg) {return ["sid", arg]},
        peg$c171 = "+",
        peg$c172 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c173 = "-",
        peg$c174 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c175 = "speed",
        peg$c176 = { type: "literal", value: "speed", description: "\"speed\"" },
        peg$c177 = "slow",
        peg$c178 = { type: "literal", value: "slow", description: "\"slow\"" },
        peg$c179 = "sp",
        peg$c180 = { type: "literal", value: "sp", description: "\"sp\"" },
        peg$c181 = function() {return "speed"},
        peg$c182 = "star",
        peg$c183 = { type: "literal", value: "star", description: "\"star\"" },
        peg$c184 = function(arg) {return ["star", arg]},
        peg$c185 = "takeoff",
        peg$c186 = { type: "literal", value: "takeoff", description: "\"takeoff\"" },
        peg$c187 = "to",
        peg$c188 = { type: "literal", value: "to", description: "\"to\"" },
        peg$c189 = "cto",
        peg$c190 = { type: "literal", value: "cto", description: "\"cto\"" },
        peg$c191 = function() {return ["takeoff"]},
        peg$c192 = "taxi",
        peg$c193 = { type: "literal", value: "taxi", description: "\"taxi\"" },
        peg$c194 = "wait",
        peg$c195 = { type: "literal", value: "wait", description: "\"wait\"" },
        peg$c196 = "w",
        peg$c197 = { type: "literal", value: "w", description: "\"w\"" },
        peg$c198 = function(runway) {return ["taxi", runway]},
        peg$c199 = "left",
        peg$c200 = { type: "literal", value: "left", description: "\"left\"" },
        peg$c201 = "right",
        peg$c202 = { type: "literal", value: "right", description: "\"right\"" },
        peg$c203 = "r",
        peg$c204 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c205 = function(dir) {return dir},
        peg$c206 = function(fix) {return fix[2]},
        peg$c207 = /^[ \t]/,
        peg$c208 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
        peg$c209 = ".",
        peg$c210 = { type: "literal", value: ".", description: "\".\"" },
        peg$c211 = function() {
            return parseFloat(text());
          },
        peg$c212 = /^[a-zA-Z0-9.]/,
        peg$c213 = { type: "class", value: "[a-zA-Z0-9.]", description: "[a-zA-Z0-9.]" },
        peg$c214 = { type: "other", description: "whiteSpace" },
        peg$c215 = function(arg) {return parseInt(arg)},

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parseInputParseGrammar() {
      var s0;

      s0 = peg$parsesystemCommand();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetransmissionCommand();
      }

      return s0;
    }

    function peg$parsesystemCommand() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c0) {
        s2 = peg$c0;
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c1); }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c2();
      }
      s1 = s2;
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 8) === peg$c3) {
          s2 = peg$c3;
          peg$currPos += 8;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c5();
        }
        s1 = s2;
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.substr(peg$currPos, 4) === peg$c6) {
            s2 = peg$c6;
            peg$currPos += 4;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c7); }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s1;
            s2 = peg$c8();
          }
          s1 = s2;
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c9) {
              s2 = peg$c9;
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c10); }
            }
            if (s2 !== peg$FAILED) {
              peg$savedPos = s1;
              s2 = peg$c11();
            }
            s1 = s2;
            if (s1 === peg$FAILED) {
              s1 = peg$currPos;
              if (input.substr(peg$currPos, 5) === peg$c12) {
                s2 = peg$c12;
                peg$currPos += 5;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c13); }
              }
              if (s2 !== peg$FAILED) {
                peg$savedPos = s1;
                s2 = peg$c14();
              }
              s1 = s2;
              if (s1 === peg$FAILED) {
                s1 = peg$parseairportCommand();
                if (s1 === peg$FAILED) {
                  s1 = peg$parserateCommand();
                  if (s1 === peg$FAILED) {
                    s1 = peg$parsetimewarpCommand();
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c15(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsetransmissionCommand() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseaircraftCommand();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c16(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsetimewarpCommand() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c17) {
        s2 = peg$c17;
        peg$currPos += 8;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c18); }
      }
      if (s2 === peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c19) {
          s2 = peg$c19;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c20); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c21) {
            s2 = peg$c21;
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c22); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 9) === peg$c23) {
              s2 = peg$c23;
              peg$currPos += 9;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c24); }
            }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsewhiteSpace();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c25(s2);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinteger();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseairportCommand() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c26) {
        s2 = peg$c26;
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsewhiteSpace();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c25(s2);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestring();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parserateCommand() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c28) {
        s2 = peg$c28;
        peg$currPos += 4;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c29); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsewhiteSpace();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c25(s2);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefloat();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseaircraftCommand() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsestring();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseaircraftSubCommand();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseaircraftSubCommand() {
      var s0, s1, s2, s3;

      s0 = [];
      s1 = peg$currPos;
      s2 = peg$parsewhiteSpace();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsecmdAbort();
        if (s3 === peg$FAILED) {
          s3 = peg$parsecmdDirect();
          if (s3 === peg$FAILED) {
            s3 = peg$parsecmdAltitude();
            if (s3 === peg$FAILED) {
              s3 = peg$parsecmdClearedAsFiled();
              if (s3 === peg$FAILED) {
                s3 = peg$parsecmdClimbViaSID();
                if (s3 === peg$FAILED) {
                  s3 = peg$parsecmdDebug();
                  if (s3 === peg$FAILED) {
                    s3 = peg$parsecmdDelete();
                    if (s3 === peg$FAILED) {
                      s3 = peg$parsecmdDescendViaSTAR();
                      if (s3 === peg$FAILED) {
                        s3 = peg$parsecmdFix();
                        if (s3 === peg$FAILED) {
                          s3 = peg$parsecmdFlyPresentHeading();
                          if (s3 === peg$FAILED) {
                            s3 = peg$parsecmdHeading();
                            if (s3 === peg$FAILED) {
                              s3 = peg$parsecmdHold();
                              if (s3 === peg$FAILED) {
                                s3 = peg$parsecmdLand();
                                if (s3 === peg$FAILED) {
                                  s3 = peg$parsecmdMoveDataBlock();
                                  if (s3 === peg$FAILED) {
                                    s3 = peg$parsecmdRoute();
                                    if (s3 === peg$FAILED) {
                                      s3 = peg$parsecmdReRoute();
                                      if (s3 === peg$FAILED) {
                                        s3 = peg$parsecmdSayRoute();
                                        if (s3 === peg$FAILED) {
                                          s3 = peg$parsecmdSID();
                                          if (s3 === peg$FAILED) {
                                            s3 = peg$parsecmdSpeed();
                                            if (s3 === peg$FAILED) {
                                              s3 = peg$parsecmdSTAR();
                                              if (s3 === peg$FAILED) {
                                                s3 = peg$parsecmdTakeoff();
                                                if (s3 === peg$FAILED) {
                                                  s3 = peg$parsecmdTaxi();
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c25(s3);
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$currPos;
          s2 = peg$parsewhiteSpace();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsecmdAbort();
            if (s3 === peg$FAILED) {
              s3 = peg$parsecmdDirect();
              if (s3 === peg$FAILED) {
                s3 = peg$parsecmdAltitude();
                if (s3 === peg$FAILED) {
                  s3 = peg$parsecmdClearedAsFiled();
                  if (s3 === peg$FAILED) {
                    s3 = peg$parsecmdClimbViaSID();
                    if (s3 === peg$FAILED) {
                      s3 = peg$parsecmdDebug();
                      if (s3 === peg$FAILED) {
                        s3 = peg$parsecmdDelete();
                        if (s3 === peg$FAILED) {
                          s3 = peg$parsecmdDescendViaSTAR();
                          if (s3 === peg$FAILED) {
                            s3 = peg$parsecmdFix();
                            if (s3 === peg$FAILED) {
                              s3 = peg$parsecmdFlyPresentHeading();
                              if (s3 === peg$FAILED) {
                                s3 = peg$parsecmdHeading();
                                if (s3 === peg$FAILED) {
                                  s3 = peg$parsecmdHold();
                                  if (s3 === peg$FAILED) {
                                    s3 = peg$parsecmdLand();
                                    if (s3 === peg$FAILED) {
                                      s3 = peg$parsecmdMoveDataBlock();
                                      if (s3 === peg$FAILED) {
                                        s3 = peg$parsecmdRoute();
                                        if (s3 === peg$FAILED) {
                                          s3 = peg$parsecmdReRoute();
                                          if (s3 === peg$FAILED) {
                                            s3 = peg$parsecmdSayRoute();
                                            if (s3 === peg$FAILED) {
                                              s3 = peg$parsecmdSID();
                                              if (s3 === peg$FAILED) {
                                                s3 = peg$parsecmdSpeed();
                                                if (s3 === peg$FAILED) {
                                                  s3 = peg$parsecmdSTAR();
                                                  if (s3 === peg$FAILED) {
                                                    s3 = peg$parsecmdTakeoff();
                                                    if (s3 === peg$FAILED) {
                                                      s3 = peg$parsecmdTaxi();
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s1;
              s2 = peg$c25(s3);
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      } else {
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdAbort() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c30) {
        s1 = peg$c30;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c32();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdAltitude() {
      var s0;

      s0 = peg$parsecmdAltitudeShort();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecmdAltitudeLong();
      }

      return s0;
    }

    function peg$parsecmdAltitudeShort() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 11105) {
        s1 = peg$c33;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }
      if (s1 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 11107) {
          s1 = peg$c35;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinteger();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c37(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdAltitudeLong() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c38) {
        s1 = peg$c38;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 5) === peg$c40) {
          s1 = peg$c40;
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c41); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c42) {
            s1 = peg$c42;
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c43); }
          }
          if (s1 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 97) {
              s1 = peg$c44;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c45); }
            }
            if (s1 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 99) {
                s1 = peg$c46;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c47); }
              }
              if (s1 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 100) {
                  s1 = peg$c48;
                  peg$currPos++;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c49); }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseinteger();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c50(s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c51) {
              s5 = peg$c51;
              peg$currPos += 8;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c52); }
            }
            if (s5 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 120) {
                s5 = peg$c53;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c54); }
              }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c55(s2);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = peg$currPos;
            s4 = peg$c56(s2, s3);
            if (s4) {
              s4 = peg$FAILED;
            } else {
              s4 = void 0;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c57(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdClearedAsFiled() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 14) === peg$c58) {
        s1 = peg$c58;
        peg$currPos += 14;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c59); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c60) {
          s1 = peg$c60;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c61); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c62();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdClimbViaSID() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 11) === peg$c63) {
        s1 = peg$c63;
        peg$currPos += 11;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c65) {
          s1 = peg$c65;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c67();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdDebug() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c68) {
        s1 = peg$c68;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c69); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c70) {
            s3 = peg$c70;
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c71); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c72();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdDelete() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c73) {
        s1 = peg$c73;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c75) {
          s1 = peg$c75;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c76); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c77) {
            s1 = peg$c77;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c78); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c79();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdDescendViaSTAR() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 14) === peg$c80) {
        s1 = peg$c80;
        peg$currPos += 14;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c81); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c82) {
          s1 = peg$c82;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c83); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c84();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdDirect() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c85) {
        s2 = peg$c85;
        peg$currPos += 6;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c86); }
      }
      if (s2 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c87) {
          s2 = peg$c87;
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c88); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c89) {
            s2 = peg$c89;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c90); }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c91();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefixToken();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdFix() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c92) {
        s2 = peg$c92;
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 102) {
          s2 = peg$c94;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c95); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c96) {
            s2 = peg$c96;
            peg$currPos += 5;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c97); }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c98();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefixToken();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsefixToken();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdFlyPresentHeading() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c99) {
        s1 = peg$c99;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c100); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c101();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdHeading() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsecmdHeadingShort();
      if (s1 === peg$FAILED) {
        s1 = peg$parsecmdHeadingLong();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c102(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdHeadingShort() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 11170) {
        s2 = peg$c103;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c104); }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c105();
      }
      s1 = s2;
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 11171) {
          s2 = peg$c106;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c107); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s1;
          s2 = peg$c108();
        }
        s1 = s2;
        if (s1 === peg$FAILED) {
          s1 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c109) {
            s2 = peg$c109;
            peg$currPos += 2;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c110); }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s1;
            s2 = peg$c111();
          }
          s1 = s2;
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseargHeading();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c112(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdHeadingLong() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c113) {
        s2 = peg$c113;
        peg$currPos += 7;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c114); }
      }
      if (s2 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c115) {
          s2 = peg$c115;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c116); }
        }
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 116) {
            s2 = peg$c117;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c118); }
          }
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 104) {
              s2 = peg$c119;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c120); }
            }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c121();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = peg$parsedirection();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseargHeading();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c122(s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseargHeading() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (peg$c123.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c124); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c123.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
        if (s2 !== peg$FAILED) {
          if (peg$c123.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c124); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c125();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (peg$c123.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
        if (s1 !== peg$FAILED) {
          if (peg$c123.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c124); }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c126();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsecmdHold() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c127) {
        s1 = peg$c127;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c128); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsedirection();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseinteger();
            if (s5 !== peg$FAILED) {
              if (input.substr(peg$currPos, 3) === peg$c129) {
                s6 = peg$c129;
                peg$currPos += 3;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c130); }
              }
              if (s6 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c131) {
                  s6 = peg$c131;
                  peg$currPos += 2;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c132); }
                }
              }
              if (s6 !== peg$FAILED) {
                s4 = [s4, s5, s6];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            s5 = peg$currPos;
            peg$silentFails++;
            s6 = peg$parseaircraftSubCommand();
            peg$silentFails--;
            if (s6 === peg$FAILED) {
              s5 = void 0;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsestring();
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c133(s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdLand() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsecmdLandShort();
      if (s1 === peg$FAILED) {
        s1 = peg$parsecmdLandLong();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c134(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdLandLong() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c135) {
        s2 = peg$c135;
        peg$currPos += 4;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c136); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 108) {
          s2 = peg$c137;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c138); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c139) {
            s2 = peg$c139;
            peg$currPos += 3;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c140); }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c141();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parsewhiteSpace();
        if (s3 !== peg$FAILED) {
          if (peg$c142.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c143); }
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsestring();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s2;
              s3 = peg$c144(s1, s4, s5);
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c145(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdLandShort() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 11088) {
        s2 = peg$c146;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c147); }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c141();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (peg$c142.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c143); }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parsestring();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c144(s1, s3, s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c145(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdMoveDataBlock() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      if (input.substr(peg$currPos, 13) === peg$c148) {
        s3 = peg$c148;
        peg$currPos += 13;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c149); }
      }
      if (s3 !== peg$FAILED) {
        s4 = peg$parsewhiteSpace();
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 96) {
          s2 = peg$c150;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c151); }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c152();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        if (peg$c153.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c154); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdRoute() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c155) {
        s1 = peg$c155;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c156); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestring();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c157(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdReRoute() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c158) {
        s1 = peg$c158;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c159); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c160) {
          s1 = peg$c160;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c161); }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestring();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c162(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdSayRoute() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c163) {
        s1 = peg$c163;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c164); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c165) {
          s1 = peg$c165;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c166); }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c167();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdSID() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c168) {
        s1 = peg$c168;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c169); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestring();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c170(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdSpeed() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s2 = peg$c171;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c172); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 45) {
          s2 = peg$c173;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c174); }
        }
      }
      if (s2 === peg$FAILED) {
        s2 = peg$currPos;
        if (input.substr(peg$currPos, 5) === peg$c175) {
          s3 = peg$c175;
          peg$currPos += 5;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c176); }
        }
        if (s3 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c177) {
            s3 = peg$c177;
            peg$currPos += 4;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c178); }
          }
          if (s3 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c179) {
              s3 = peg$c179;
              peg$currPos += 2;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c180); }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s1;
        s2 = peg$c181();
      }
      s1 = s2;
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinteger();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdSTAR() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c182) {
        s1 = peg$c182;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c183); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestring();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c184(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecmdTakeoff() {
      var s0, s1;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c185) {
        s1 = peg$c185;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c186); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c187) {
          s1 = peg$c187;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c188); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c189) {
            s1 = peg$c189;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c190); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c191();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecmdTaxi() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4) === peg$c192) {
        s1 = peg$c192;
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c193); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c194) {
          s1 = peg$c194;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c195); }
        }
        if (s1 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 119) {
            s1 = peg$c196;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c197); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsestring();
          if (s4 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c122(s4);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c198(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedirection() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsewhiteSpace();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (input.substr(peg$currPos, 4) === peg$c199) {
          s3 = peg$c199;
          peg$currPos += 4;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c200); }
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 108) {
            s3 = peg$c137;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c138); }
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s2;
          s3 = peg$c105();
        }
        s2 = s3;
        if (s2 === peg$FAILED) {
          s2 = peg$currPos;
          if (input.substr(peg$currPos, 5) === peg$c201) {
            s3 = peg$c201;
            peg$currPos += 5;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c202); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 114) {
              s3 = peg$c203;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c204); }
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s2;
            s3 = peg$c108();
          }
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c205(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefixToken() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parseaircraftSubCommand();
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsestring();
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c206(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsewhiteSpace() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c207.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c208); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c207.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c208); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }

      return s0;
    }

    function peg$parsefloat() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s3 = peg$c173;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c174); }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c123.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c123.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c124); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 46) {
            s6 = peg$c209;
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c210); }
          }
          if (s6 !== peg$FAILED) {
            s7 = [];
            if (peg$c123.test(input.charAt(peg$currPos))) {
              s8 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s8 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c124); }
            }
            if (s8 !== peg$FAILED) {
              while (s8 !== peg$FAILED) {
                s7.push(s8);
                if (peg$c123.test(input.charAt(peg$currPos))) {
                  s8 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s8 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c124); }
                }
              }
            } else {
              s7 = peg$FAILED;
            }
            if (s7 !== peg$FAILED) {
              s6 = [s6, s7];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = input.substring(s1, peg$currPos);
      } else {
        s1 = s2;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c211();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c212.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c213); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c212.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c213); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      if (peg$c207.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c208); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c207.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c208); }
          }
        }
      } else {
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c214); }
      }

      return s0;
    }

    function peg$parseinteger() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s3 = peg$c173;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c174); }
      }
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      if (s3 !== peg$FAILED) {
        s4 = [];
        if (peg$c123.test(input.charAt(peg$currPos))) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c124); }
        }
        if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c123.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c124); }
            }
          }
        } else {
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = input.substring(s1, peg$currPos);
      } else {
        s1 = s2;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c215(s1);
      }
      s0 = s1;

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();
},{}],15:[function(require,module,exports){
window.speech_init = function speech_init() {
  prop.speech = {};
  prop.speech.synthesis = window.speechSynthesis;
  prop.speech.enabled = false;

  if('atc-speech-enabled' in localStorage && localStorage['atc-speech-enabled'] == 'true') {
    prop.speech.enabled = true;
    $(".speech-toggle").addClass("active");
  }
};

window.speech_say = function speech_say(sentence) {
  if(prop.speech.synthesis != null && prop.speech.enabled) {
    var textToSay = "";
    for(var i=0; i<sentence.length; i++) {
      switch(sentence[i].type) {
        case "callsign":
          textToSay += " " + sentence[i].content.getRadioCallsign() + " "; break;
        case "altitude":
          textToSay += " " + radio_altitude(sentence[i].content) + " "; break;
        case "speed": case "heading":
          textToSay += " " + radio_heading(sentence[i].content) + " "; break;
        case "text":
          textToSay += " " + sentence[i].content + " "; break;
        default:
          break;
      }
    }

    var utterance = new SpeechSynthesisUtterance(textToSay); // make the object
    utterance.lang = "en-US"; // set the language
    utterance.voice = prop.speech.synthesis.getVoices().filter(function(voice) {
      return voice.name == 'Google US English'; })[0];   //set the voice
    utterance.rate = 1.125; // speed up just a touch
    prop.speech.synthesis.speak(utterance);  // say the words
  }
};

window.speech_toggle = function speech_toggle() {
  prop.speech.enabled = !prop.speech.enabled;

  if(prop.speech.enabled) {
    $(".speech-toggle").addClass("active");
  } else {
    $(".speech-toggle").removeClass("active");
    prop.speech.synthesis.cancel();
  }

  localStorage['atc-speech-enabled'] = prop.speech.enabled;
};

},{}],16:[function(require,module,exports){
var Step = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.title    = options.title || "?";

      this.text     = options.text || "?";

      this.parse     = options.parse || null;

      this.side     = options.side || "none";

      this.position = options.position || [0, 0];
      this.padding  = options.padding  || [0, 0];
    },
    getText: function() {
      if(this.parse)
        return this.parse(this.text);
      return this.text;
    }
  };
});

window.tutorial_init_pre = function tutorial_init_pre() {
  prop.tutorial = {};

  prop.tutorial.steps = [];
  prop.tutorial.step  = 0;

  prop.tutorial.open  = false;

  var tutorial_position = [0.1, 0.85];

  tutorial_step({
    title:    "Welcome!",
    text:     ["Welcome to Air Traffic Control simulator. It&rsquo;s not easy",
               "to control dozens of aircraft while maintaining safe distances",
               "between them; to get started with the ATC simulator tutorial, click the arrow on",
               "the right. You can also click the graduation cap icon in the lower right corner",
               "of the window at any time to close this tutorial.",
               ].join(" "),
    position: tutorial_position
  });

  tutorial_step({
    title:    "Departing aircraft",
    text:     ["Let&rsquo;s route some planes out of here. On the right side of the screen, there",
               "should be a strip with a blue bar on the left, meaning the strip represents a departing aircraft.",
               "Click the first one ({CALLSIGN}). The aircraft&rsquo;s callsign will appear in the command entry box",
               "and the strip will move to the left and change color. This means that the aircraft is selected."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Taxiing",
    text:     ["Now type in &lsquo;taxi&rsquo; or &lsquo;wait&rsquo; into the command box after the callsign and hit Return;",
               "the messages area above it will show that the aircraft is taxiing to runway ({RUNWAY}) in",
               "preparation for takeoff. (You could also specify to which runway to taxi the aircraft by",
               "entering the runway name after &lsquo;taxi&rsquo; or &lsquo;wait&rsquo;.)"
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 1",
    text:     ["When it appears at the start of runway ({RUNWAY}) (which may take a couple of seconds), click it (or press the up arrow once)",
               "and type in &lsquo;caf&rsquo; (for &lsquo;cleared as filed&rsquo;). This tells the aircraft it is cleared to follow its flightplan.",
               "Just as in real life, this step must be done before clearing the aircraft for takeoff, so they know where they're supposed to go."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 2",
    text:     ["Now the aircraft is ready for take off. Click the aircraft again (or press up arrow once)",
               "and type &lsquo;takeoff&rsquo; (or &lsquo;to&rsquo;) to clear the aircraft for take off.",
               "Once it's going fast enough, it should lift off the ground and you should",
               "see its altitude increasing. Meanwhile, read the next step."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 1",
    text:     ["On the right, there&rsquo;s a row of strips, one for each aircraft.",
               "Each strip has a bar on its left side, colored blue for departures and",
               "red for arrivals."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 2",
    text:     ["The top row shows the aircraft&rsquo;s callsign, what it's doing (parked at apron,",
               "using a runway, flying to a fix, on a heading, etc), and its assigned altitude. The bottom row shows the model",
               "({MODEL} here, which is a {MODELNAME}) to the left, its destination in the middle, and its assigned speed to the right."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{MODEL}", prop.aircraft.list[0].model.icao).replace("{MODELNAME}", prop.aircraft.list[0].model.name);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Moving aircraft",
    text:     ["Once {CALLSIGN} has taken off, you'll notice it will climb to {INIT_ALT} by itself. This is one of the instructions ",
                "we gave them when we cleared them &lsquo;as filed&rsquo;. Aircraft perform better when they are able to climb directly",
                "from the ground to their cruise altitude without leveling off, so let's keep them climbing! Click it and type &lsquo;cvs&rsquo; (for",
                "&lsquo;climb via SID&rsquo;). Then they will follow the altitudes and speeds defined in the {SID_NAME} departure",
                "procedure. Feel free to click the speedup button on the right side of the input box (it&rsquo;s two small arrows)",
                "to watch the departure climb along the SID. Then just click it again to return to 1x speed."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign()).
                 replace("{INIT_ALT}", airport_get().initial_alt).
                 replace("{SID_NAME}", prop.aircraft.list[0].destination);
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Departure destinations",
    text:     ["If you zoom out (using the mouse wheel) and click",
               "on {CALLSIGN}, you will see a blue dashed line that shows where they are heading. At the end of the",
               "line is its &lsquo;departure fix&rsquo;. Your goal is to get every departure cleared to their filed departure fix. As",
               "you have probably noticed, this is very easy with SIDs, as the aircraft do all the hard work themselves."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Altitude",
    text:     ["You can assign altitudes with the &lsquo;climb&rsquo; command, or any of its aliases (other words that",
               "act identically). Running the command &lsquo;climb&rsquo; is the same as the commands &lsquo;descend&rsquo;, &lsquo;d&rsquo;,",
               "&lsquo;clear&rsquo;, &lsquo;c&rsquo;, &lsquo;altitude&rsquo;, or &lsquo;a&rsquo;. Just use whichever feels correct in your situation.",
               "Remember, just as in real ATC, altitudes are ALWAYS written in hundreds of feet, eg. &lsquo;descend 30&rsquo; for 3,000ft or &lsquo;climb",
               " 100&rsquo; for 10,000ft."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Radar Vectors",
    text:     ["Radar vectors are an air traffic controller's way of telling aircraft to fly a specific magnetic heading. We can give aircraft radar",
               "vectors in three ways. Usually, you will use &lsquo;t l ###&rsquo; or &lsquo;t r ###&rsquo;. Be careful, as it is both easy",
               "and dangerous to give a turn in the wrong direction. If the heading is only slightly left or right, to avoid choosing the wrong direction,",
               "you can tell them to &lsquo;fly heading&rsquo; by typing &lsquo;fh###&rsquo;, and the aircraft will simply turn the shortest direction",
               "to face that heading."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Speed",
    text:     ["Speed control is the TRACON controller's best friend. Making good use of speed control can help keep the pace manageable and allow",
               "you to carefully squeeze aircraft closer and closer to minimums while still maintaining safety. To enter speed instructions, use the",
               "&lsquo;+&rsquo; and &lsquo;-&rsquo; keys on the numpad, followed by the speed, in knots. Note that this assigned speed is indicated",
               "airspeed, and our radar scope can only display groundspeed; so, the values may be different."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace(/{ANGLE}/g, heading_to_string(prop.aircraft.list[0].destination));
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Fixes",
    text:     ["Instead of guiding each aircraft based on heading, you can also clear each aircraft to proceed to a fix or navaid (shown on the map",
               "as a small triangle). Just use the command &lsquo;fix&rsquo; and the name of a fix, and the aircraft will fly to it. Upon passing the",
               "fix, it will continue flying along its present heading."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      else return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Shortcuts",
    text:     ["You can give an aircraft a shortcut in a chain of fixes through use of the &lsquo;direct&rsquo;",
               "command (&lsquo;dct&rsquo;). Also, you can add more fixes to the end of that list with the",
               "&lsquo;proceed&rsquo; (&lsquo;pr&rsquo;) command. This is useful with overflights, and while you can have",
               "departing aircraft use these commands, it is probably easier to assign them a SID if one is available at your airport."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Bon voyage, aircraft!",
    text:     ["When the aircraft crosses the airspace boundary, it will ",
               "automatically remove itself from the flight strip bay on the right.",
               "Congratulations, you&rsquo;ve successfully taken off one aircraft."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Arrivals",
    text:     ["Now, onto arrivals. Click on any arriving aircraft in the radar screen; after",
               "you&rsquo;ve selected it, use the altitude/heading/speed controls you've learned in",
               "order to guide it to be in front of a runway. Make sure to get the aircraft down to",
               "around 4,000ft, and 10-15 nautical miles (2-3 range rings) away from the airport.",
               "While you work the airplane, read the next step."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 1",
    text:     ["You can clear aircraft for an ILS approach with the &quot;ILS&quot; command, followed by a runway name. Before you can do so, however,",
               "it must be on a heading that will cross the runway's extended centerline, that is no more than 30 degrees offset from the",
               "runway's heading. Once we eventually give them an approach clearance, you can expect aircraft to capture the ILS's localizer",
               "once they're within a few degrees of the extended centerline."
                 ].join(" "),
      parse:    function(t) {
        return t;
      },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 2",
    text:     ["When you have the aircraft facing the right direction, just select it and type &lsquo;i &lt;runway&gt;&rsquo;",
               "with the runway that&rsquo;s in front of it. Once it's close enough to capture the localizer, the assigned altitude on its strip",
               "will change to &lsquo;ILS locked&rsquo; (meaning the aircraft is capable of guiding itself down to the runway via",
               "the Instrument Landing System), and the assigned heading should now show the runway to which it has an approach clearance."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 3",
    text:     ["You may choose to enter one command at a time, but air traffic controllers usually do multiple. Particularly in approach clearances,",
               "they follow an acronym &ldquo;PTAC&rdquo; for the four elements of an approach clearance, the &lsquo;T&rsquo; and &lsquo;C&rsquo; of which",
               "stand for &lsquo;Turn&rsquo; and &lsquo;Clearance&rsquo;, both of which we entered separately in this tutorial. Though longer, it is both ",
               "easier and more real-world accurate to enter them together, like this: &lsquo;fh250 i 28r&rsquo;."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aborting landings",
    text:     ["If the aircraft is established on the ILS, it should be able to land on the runway. However, say there&rsquo;s another",
               "aircraft that&rsquo;s planning to take off from the same runway. To abort the landing, use the command &lsquo;abort&rsquo;.",
               "(If the aircraft is navigating to a fix, the &lsquo;abort&rsquo; command will clear the fix instead.)"
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Wind sock",
    text:     ["In the lower right corner of the map is a small circle with a line. It's like a flag: the line trails in the direction",
               "the wind is blowing toward. If it&rsquo;s pointing straight down, the wind is blowing from the North",
               "to the South. Aircraft must be assigned to different runways such that they always take off and land into the wind, unless the",
               "wind is less than 5 knots."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Score",
    text:     ["The lower-right corner of the page has a small number in it; this is your score.",
               "Whenever you successfully route an aircraft to the ground or out of the screen, you earn points. As you make mistakes,",
               "like directing aircraft to a runway with a strong crosswind/tailwind, losing separation between aircraft, or ignoring an",
               "aircraft, you will also lose points. If you&rsquo;d like, you can just ignore the score; it doesn&rsquo;t have any effect",
               "with the simulation."
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Good job!",
    text:     ["If you&rsquo;ve gone through this entire tutorial, you should do pretty well with the pressure.",
               "In the TRACON, minimum separation is 3 miles laterally or 1000 feet vertically. Keep them separated,",
               "keep them moving, and you'll be a controller in no time!"
               ].join(" "),
    parse:    function(t) {
      return t;
    },
    side:     "left",
    position: tutorial_position
  });

}

function tutorial_step(options) {
  prop.tutorial.steps.push(new Step(options));
};

window.tutorial_init = function tutorial_init() {
  prop.tutorial.html = $("<div id='tutorial'></div>");
  prop.tutorial.html.append("<h1></h1>");
  prop.tutorial.html.append("<main></main>");
  prop.tutorial.html.append("<div class='prev'><img src='assets/images/prev.png' title='Previous step' /></div>");
  prop.tutorial.html.append("<div class='next'><img src='assets/images/next.png' title='Next step' /></div>");
  prop.tutorial.html.find(".prev").click(tutorial_prev);
  prop.tutorial.html.find(".next").click(tutorial_next);

  $("body").append(prop.tutorial.html);
};

function tutorial_complete() {
  if(!("first-run-time" in localStorage)) tutorial_open();
  localStorage["first-run-time"] = time();
}

function tutorial_open() {
  prop.tutorial.open = true;
  $("#tutorial").addClass("open");
  $(".toggle-tutorial").addClass("active");
  $(".toggle-tutorial").prop("title", "Close tutorial");
  tutorial_update_content();
}

function tutorial_close() {
  prop.tutorial.open = false;
  $("#tutorial").removeClass("open");
  $(".toggle-tutorial").removeClass("active");
  $(".toggle-tutorial").prop("title", "Open tutorial");
  tutorial_move();
}

function tutorial_get(step) {
  if(step == null) step = prop.tutorial.step;
  return prop.tutorial.steps[step];
}

function tutorial_next() {
  if(prop.tutorial.step == prop.tutorial.steps.length - 1) {
    tutorial_close();
    return;
  }
  prop.tutorial.step = clamp(0, prop.tutorial.step + 1, prop.tutorial.steps.length - 1);
  tutorial_update_content();
}

function tutorial_prev() {
  prop.tutorial.step = clamp(0, prop.tutorial.step - 1, prop.tutorial.steps.length - 1);
  tutorial_update_content();
}

function tutorial_update_content() {
  var step = tutorial_get();

  $("#tutorial h1").html(step.title);
  $("#tutorial main").html(step.getText());

  $("#tutorial").removeClass("left right");
  if(step.side == "left") $("#tutorial").addClass("left");
  else if(step.side == "right") $("#tutorial").addClass("right");

  tutorial_move();
}

function tutorial_resize() {
  tutorial_move()
}

function tutorial_move() {
  var step = tutorial_get();

  var padding = [30, 10];

  var left = step.position[0] * ($(window).width()  - $("#tutorial").outerWidth()  - padding[0]);
  var top  = step.position[1] * ($(window).height());
  top -= ($("#tutorial").outerHeight() - padding[1]);

//  left += step.padding[0];
//  top  += step.padding[1];

  $("#tutorial").offset({top: round(top), left: round(left)});
}

window.tutorial_toggle = function tutorial_toggle() {
    if (prop.tutorial.open) {
        tutorial_close();
    } else {
        tutorial_open();
    }
};

},{}],17:[function(require,module,exports){
window.ui_init_pre = function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale_default = 8; // pixels per km
  prop.ui.scale_max = 80; // max scale
  prop.ui.scale_min = 1; // min scale
  prop.ui.scale         = prop.ui.scale_default;
  prop.ui.terrain = {
    colors: {
      1000: '26, 150, 65',
      2000: '119, 194, 92',
      3000: '255, 255, 192',
      4000: '253, 201, 128',
      5000: '240, 124, 74',
      6000: '156, 81, 31'
    },
    border_opacity: 1,
    fill_opacity: .1
  };

  if('atc-scale' in localStorage) prop.ui.scale = localStorage['atc-scale'];
}

window.ui_zoom_out = function ui_zoom_out() {
  var lastpos = [round(px_to_km(prop.canvas.panX)), round(px_to_km(prop.canvas.panY))];
  prop.ui.scale *= 0.9;
  if(prop.ui.scale < prop.ui.scale_min) prop.ui.scale = prop.ui.scale_min;
  ui_after_zoom();
  prop.canvas.panX = round(km_to_px(lastpos[0]));
  prop.canvas.panY = round(km_to_px(lastpos[1]));
}

window.ui_zoom_in = function ui_zoom_in() {
  var lastpos = [round(px_to_km(prop.canvas.panX)), round(px_to_km(prop.canvas.panY))];
  prop.ui.scale /= 0.9;
  if(prop.ui.scale > prop.ui.scale_max) prop.ui.scale = prop.ui.scale_max;
  ui_after_zoom();
  prop.canvas.panX = round(km_to_px(lastpos[0]));
  prop.canvas.panY = round(km_to_px(lastpos[1]));
}

window.ui_zoom_reset = function ui_zoom_reset() {
  prop.ui.scale = prop.ui.scale_default;
  ui_after_zoom();
}

window.ui_after_zoom = function ui_after_zoom() {
  localStorage['atc-scale'] = prop.ui.scale;
  prop.canvas.dirty = true;
}

window.ui_init = function ui_init() {

  $(".fast-forwards").prop("title", "Set time warp to 2");

  var switches = {
    ".fast-forwards": game_timewarp_toggle,
    ".speech-toggle": speech_toggle,
    ".switch-airport": ui_airport_toggle,
    ".toggle-tutorial": tutorial_toggle,
    ".pause-toggle": game_pause_toggle,
    "#paused img": game_unpause,
    ".toggle-labels": canvas_labels_toggle,
    ".toggle-restricted-areas": canvas_restricted_toggle,
    ".toggle-sids": canvas_sids_toggle,
    ".toggle-terrain": canvas_terrain_toggle
  };

  $.each(switches, function(selector, fn) {
    $(selector).on('click', function(event) { fn(event); });
  });

  var options = $("<div id='options-dialog' class='dialog'></div>");
  var descriptions = prop.game.option.getDescriptions();
  for (var key in descriptions) {
    var opt = descriptions[key];
    if (opt.type == 'select') {
      var container = $('<div class="option"></div>');
      container.append("<span class='option-description'>" +
                     opt.description + "</span>");
      var sel_span = $("<span class='option-selector option-type-select'></span>");
      var selector = $("<select id='opt-" + opt.name +
                       "' name='" + opt.name + "'></select>");
      selector.data('name', opt.name);
      var current = prop.game.option.get(opt.name);
      for (var i=0;i<opt.data.length;i++) {
        var s = "<option value='"+opt.data[i][1];
        if (opt.data[i][1] == current)
          s += "' selected='selected";
        s += "'>"+opt.data[i][0]+"</option>";
        selector.append(s);
      }
      selector.change(function() {
        prop.game.option.set($(this).data('name'), $(this).val());
      });
      sel_span.append(selector);
      container.append(sel_span);
      options.append(container);
    }
  }

  $("body").append(options);

  $("#toggle-options").click(function() {
    ui_options_toggle();
  });
}

window.ui_complete = function ui_complete() {
  var airports = [];
  var icon = '&#9992;';

  for(var i in prop.airport.airports) airports.push(i);

  airports.sort();

  for(var i=0;i<airports.length;i++) {
    var airport = prop.airport.airports[airports[i]];
    var difficulty = '';
    switch (airport.level) {
    case 'beginner':
      difficulty = icon;
      break;
    case 'easy':
      difficulty = icon.repeat(2);
      break;
    case 'medium':
      difficulty = icon.repeat(3);
      break;
    case 'hard':
      difficulty = icon.repeat(4);
      break;
    case 'expert':
      difficulty = icon.repeat(5);
      break;
    default:
      difficulty = '?';
      break;
    }

    var html = $("<li class='airport icao-"+airport.icao.toLowerCase()+"'>" +
                 "<span style='font-size: 7pt' class='difficulty'>" + difficulty + "</span>" +
                 "<span class='icao'>" + airport.icao.toUpperCase() + "</span>" +
                 "<span class='name'>" + airport.name + "</span></li>");

    html.click(airport.icao.toLowerCase(), function(e) {
      if(e.data != airport_get().icao) {
        airport_set(e.data);
        ui_airport_close();
      }
    });

    $("#airport-list").append(html);
  }
  var symbol = $("<span class='symbol'>" + "&#9983" + "</span>");
  $("#airport-list-notes").append(symbol);
  var notes = $("<span class='words'>" + "indicates airport is a work in progress" + "</span>");
  $("#airport-list-notes").append(notes);
}

window.px_to_km = function px_to_km(pixels) {
  return pixels / prop.ui.scale;
}

window.km_to_px = function km_to_px(kilometers) {
  return kilometers * prop.ui.scale;
}

window.ui_log = function ui_log(message) {
  message = arguments[0];
  var warn = false;
  if(arguments[0] == true) {
    warn = true;
    message = arguments[1];
  } else if(arguments.length >= 2) {
    message += ", "+arguments[1];
  }

//  $("#log").append("<span class='item'><span class='from'>"+from+"</span><span class='message'>"+message+"</span></span>");
  var html = $("<span class='item'><span class='message'>"+message+"</span></span>");
  if(warn) html.addClass("warn");
  $("#log").append(html);
  $("#log").scrollTop($("#log").get(0).scrollHeight);
  game_timeout(function(html) {
    html.addClass("hidden");
    setTimeout(function() {
      html.remove();
    }, 10000);
  }, 3, window, html);

  // speech_say(message);

//  console.log("MESSAGE: " + message);
}

window.ui_airport_open = function ui_airport_open() {
  $(".airport").removeClass("active");
  $(".airport.icao-"+airport_get().icao.toLowerCase()).addClass("active");

  $("#airport-switch").addClass("open");
  $(".switch-airport").addClass("active");
}

window.ui_airport_close = function ui_airport_close() {
  $("#airport-switch").removeClass("open");
  $(".switch-airport").removeClass("active");
}

window.ui_airport_toggle = function ui_airport_toggle() {
  if($("#airport-switch").hasClass("open")) ui_airport_close();
  else                                      ui_airport_open();
}

window.canvas_labels_toggle = function canvas_labels_toggle(event) {
  $(event.target).closest('.control').toggleClass('active');
  prop.canvas.draw_labels = !prop.canvas.draw_labels;
}

window.canvas_restricted_toggle = function canvas_restricted_toggle(event) {
  $(event.target).closest('.control').toggleClass('warning-button active');
  prop.canvas.draw_restricted = !prop.canvas.draw_restricted;
}

window.canvas_sids_toggle = function canvas_sids_toggle(event) {
  $(event.target).closest('.control').toggleClass('active');
  prop.canvas.draw_sids = !prop.canvas.draw_sids;
}

window.canvas_terrain_toggle = function canvas_terrain_toggle(event) {
  $(event.target).closest('.control').toggleClass('active');
  prop.canvas.draw_terrain = !prop.canvas.draw_terrain;
}

window.ui_options_toggle = function ui_options_toggle() {
  if ($("#options-dialog").hasClass("open")) {
    $("#options-dialog").removeClass("open");
    $("#options-dialog").removeClass("active");
  }
  else {
    $("#options-dialog").addClass("open");
    $("#options-dialog").addClass("active");
  }
}

},{}],18:[function(require,module,exports){
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

// ******************** UNIT CONVERSION FUNCTIONS ********************

/**
 * nautical miles --> kilometers
 */
window.km = function km(nm) {
  return nm * 1.852;
}
/**
 * kilometers --> nautical miles
 */
window.nm = function nm(km) {
  return km / 1.852;
}
/**
 * kilometers --> feet
 */
window.km_ft = function km_ft(km) {
  return km / 0.0003048;
}
/**
 * feet --> kilometers
 */
window.ft_km = function ft_km(ft) {
  return ft * 0.0003048;
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

window.distance2d = function distance2d(a,b) {
  var x=a[0]-b[0];
  var y=a[1]-b[1];
  return Math.sqrt((x*x)+(y*y));
}

window.distEuclid = function distEuclid(gps1, gps2) {
  var R = 6371; // nm
  var lat1 = radians(lat1);
  var lat2 = radians(lat2);
  var dlat = radians(lat2-lat1);
  var dlon = radians(lon2-lon1);
  var a = Math.sin(dlat/2) * Math.sin(dlat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dlon/2) * Math.sin(dlon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d; // distance, in kilometers
}

window.degrees = function degrees(radians) {
  return (radians/(Math.PI*2))*360;
}

window.radians = function radians(degrees) {
  return (degrees/360)*(Math.PI*2);
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
  heading = round(mod(degrees(heading), 360)).toString();
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
  fix = [radians(fix[0]), radians(fix[1])]; // convert GPS coordinates to radians
  var R = 3440; // radius of Earth, nm
  var lat2 = Math.asin(Math.sin(fix[1])*Math.cos(dist/R) +
             Math.cos(fix[1])*Math.sin(dist/R)*Math.cos(radial));
  var lon2 = fix[0] + Math.atan2(Math.sin(radial)*Math.sin(dist/R)*Math.cos(fix[1]),
             Math.cos(dist/R)-Math.sin(fix[1])*Math.sin(lat2));
  return [degrees(lon2), degrees(lat2)];
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
 * Computes length of 2D vector
 */
window.vlen = function vlen(v) {
  try {
    var len = Math.sqrt(v[0]*v[0] + v[1] * v[1]);
    return len;
  }
  catch(err) {console.error("call to vlen() failed. v:"+v+" | Err:"+err);}
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

/**
 * Subtracts Vectors (all dimensions)
 */
window.vsub = function vsub(v1, v2) {
  try {
    var v = [], lim = Math.min(v1.length,v2.length);
    for(var i=0; i<lim; i++) v.push(v1[i] - v2[i]);
    return v;
  }
  catch(err) {console.error("call to vsub() failed. v1:"+v1+" | v2:"+v2+" | Err:"+err);}
}

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
 * Compute angle of 2D vector, in radians
 */
window.vradial = function vradial(v) {
  return Math.atan2(v[0], v[1]);
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
  if(abs(vcp(r,s)) < abs(vcp([0,1],vectorize_2d(radians(deg_allowance))))) { // parallel (within allowance)
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

},{}]},{},[9])