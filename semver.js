// @ts-check

exports = module.exports = SemVer;

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = "2.0.0";

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

// Max safe segment length for coercion.
var MAX_SAFE_COMPONENT_LENGTH = 16;

// The actual regexps go on exports.re
var re = (exports.re = []);
var src = (exports.src = []);
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = "[0-9]+";

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";

// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] =
  "(" +
  src[NUMERICIDENTIFIER] +
  ")\\." +
  "(" +
  src[NUMERICIDENTIFIER] +
  ")\\." +
  "(" +
  src[NUMERICIDENTIFIER] +
  ")";

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] =
  "(" +
  src[NUMERICIDENTIFIERLOOSE] +
  ")\\." +
  "(" +
  src[NUMERICIDENTIFIERLOOSE] +
  ")\\." +
  "(" +
  src[NUMERICIDENTIFIERLOOSE] +
  ")";

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] =
  "(?:" + src[NUMERICIDENTIFIER] + "|" + src[NONNUMERICIDENTIFIER] + ")";

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] =
  "(?:" + src[NUMERICIDENTIFIERLOOSE] + "|" + src[NONNUMERICIDENTIFIER] + ")";

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] =
  "(?:-(" +
  src[PRERELEASEIDENTIFIER] +
  "(?:\\." +
  src[PRERELEASEIDENTIFIER] +
  ")*))";

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] =
  "(?:-?(" +
  src[PRERELEASEIDENTIFIERLOOSE] +
  "(?:\\." +
  src[PRERELEASEIDENTIFIERLOOSE] +
  ")*))";

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] =
  "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." + src[BUILDIDENTIFIER] + ")*))";

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN =
  "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] + "?";

src[FULL] = "^" + FULLPLAIN + "$";

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN =
  "[v=\\s]*" +
  src[MAINVERSIONLOOSE] +
  src[PRERELEASELOOSE] +
  "?" +
  src[BUILD] +
  "?";

var LOOSE = R++;
src[LOOSE] = "^" + LOOSEPLAIN + "$";

var GTLT = R++;
src[GTLT] = "((?:<|>)?=?)";

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + "|x|X|\\*";
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] =
  "[v=\\s]*(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIER] +
  ")" +
  "(?:" +
  src[PRERELEASE] +
  ")?" +
  src[BUILD] +
  "?" +
  ")?)?";

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] =
  "[v=\\s]*(" +
  src[XRANGEIDENTIFIERLOOSE] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIERLOOSE] +
  ")" +
  "(?:\\.(" +
  src[XRANGEIDENTIFIERLOOSE] +
  ")" +
  "(?:" +
  src[PRERELEASELOOSE] +
  ")?" +
  src[BUILD] +
  "?" +
  ")?)?";

var XRANGE = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";
var XRANGELOOSE = R++;
src[XRANGELOOSE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAINLOOSE] + "$";

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
var COERCE = R++;
src[COERCE] =
  "(?:^|[^\\d])" +
  "(\\d{1," +
  MAX_SAFE_COMPONENT_LENGTH +
  "})" +
  "(?:\\.(\\d{1," +
  MAX_SAFE_COMPONENT_LENGTH +
  "}))?" +
  "(?:\\.(\\d{1," +
  MAX_SAFE_COMPONENT_LENGTH +
  "}))?" +
  "(?:$|[^\\d])";

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = "(?:~>?)";

var TILDETRIM = R++;
src[TILDETRIM] = "(\\s*)" + src[LONETILDE] + "\\s+";
re[TILDETRIM] = new RegExp(src[TILDETRIM], "g");
var tildeTrimReplace = "$1~";

var TILDE = R++;
src[TILDE] = "^" + src[LONETILDE] + src[XRANGEPLAIN] + "$";
var TILDELOOSE = R++;
src[TILDELOOSE] = "^" + src[LONETILDE] + src[XRANGEPLAINLOOSE] + "$";

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = "(?:\\^)";

var CARETTRIM = R++;
src[CARETTRIM] = "(\\s*)" + src[LONECARET] + "\\s+";
re[CARETTRIM] = new RegExp(src[CARETTRIM], "g");
var caretTrimReplace = "$1^";

var CARET = R++;
src[CARET] = "^" + src[LONECARET] + src[XRANGEPLAIN] + "$";
var CARETLOOSE = R++;
src[CARETLOOSE] = "^" + src[LONECARET] + src[XRANGEPLAINLOOSE] + "$";

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = "^" + src[GTLT] + "\\s*(" + LOOSEPLAIN + ")$|^$";
var COMPARATOR = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] =
  "(\\s*)" + src[GTLT] + "\\s*(" + LOOSEPLAIN + "|" + src[XRANGEPLAIN] + ")";

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], "g");
var comparatorTrimReplace = "$1$2$3";

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] =
  "^\\s*(" +
  src[XRANGEPLAIN] +
  ")" +
  "\\s+-\\s+" +
  "(" +
  src[XRANGEPLAIN] +
  ")" +
  "\\s*$";

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] =
  "^\\s*(" +
  src[XRANGEPLAINLOOSE] +
  ")" +
  "\\s+-\\s+" +
  "(" +
  src[XRANGEPLAINLOOSE] +
  ")" +
  "\\s*$";

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = "(<|>)?=?\\s*\\*";

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  if (!re[i]) {
    re[i] = new RegExp(src[i]);
  }
}

exports.parse = parse;
function parse(version, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }

  if (version instanceof SemVer) {
    return version;
  }

  if (typeof version !== "string") {
    return null;
  }

  if (version.length > MAX_LENGTH) {
    return null;
  }

  var r = options.loose ? re[LOOSE] : re[FULL];
  if (!r.test(version)) {
    return null;
  }

  try {
    return new SemVer(version, options);
  } catch (er) {
    return null;
  }
}

exports.valid = valid;
function valid(version, options) {
  var v = parse(version, options);
  return v ? v.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }
  if (version instanceof SemVer) {
    if (version.loose === options.loose) {
      return version;
    } else {
      version = version.version;
    }
  } else if (typeof version !== "string") {
    throw new TypeError("Invalid Version: " + version);
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError("version is longer than " + MAX_LENGTH + " characters");
  }

  this.options = options;
  this.loose = !!options.loose;

  var m = version.trim().match(options.loose ? re[LOOSE] : re[FULL]);

  if (!m) {
    throw new TypeError("Invalid Version: " + version);
  }

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
    throw new TypeError("Invalid major version");
  }

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
    throw new TypeError("Invalid minor version");
  }

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
    throw new TypeError("Invalid patch version");
  }

  // numberify any prerelease numeric ids
  if (!m[4]) {
    this.prerelease = [];
  } else {
    this.prerelease = m[4].split(".").map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER) {
          return num;
        }
      }
      return id;
    });
  }

  this.build = m[5] ? m[5].split(".") : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + "." + this.minor + "." + this.patch;
  if (this.prerelease.length) {
    this.version += "-" + this.prerelease.join(".");
  }
  return this.version;
};

SemVer.prototype.compare = function(other) {

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  return (
    compareIdentifiers(this.major, other.major) ||
    compareIdentifiers(this.minor, other.minor) ||
    compareIdentifiers(this.patch, other.patch)
  );
};

SemVer.prototype.comparePre = function(other) {
  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length) {
    return -1;
  } else if (!this.prerelease.length && other.prerelease.length) {
    return 1;
  } else if (!this.prerelease.length && !other.prerelease.length) {
    return 0;
  }

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    if (a === undefined && b === undefined) {
      return 0;
    } else if (b === undefined) {
      return 1;
    } else if (a === undefined) {
      return -1;
    } else if (a === b) {
      continue;
    } else {
      return compareIdentifiers(a, b);
    }
  } while (++i);
};

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : a > b ? 1 : 0;
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose));
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case "":
    case "=":
    case "==":
      ret = eq(a, b, loose);
      break;
    case ">":
      ret = gt(a, b, loose);
      break;
    case ">=":
      ret = gte(a, b, loose);
      break;
    case "<":
      ret = lt(a, b, loose);
      break;
    case "<=":
      ret = lte(a, b, loose);
      break;
    default:
      throw new TypeError("Invalid operator: " + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }

  this.options = options;
  this.loose = !!options.loose;
  this.parse(comp);

  if (this.semver === ANY) {
    this.value = "";
  } else {
    this.value = this.operator + this.semver.version;
  }

}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.options.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m) {
    throw new TypeError("Invalid comparator: " + comp);
  }

  this.operator = m[1];
  if (this.operator === "=") {
    this.operator = "";
  }

  // if it literally is just '>' or '' then allow anything.
  if (!m[2]) {
    this.semver = ANY;
  } else {
    this.semver = new SemVer(m[2], this.options.loose);
  }
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {

  if (this.semver === ANY) {
    return true;
  }

  if (typeof version === "string") {
    version = new SemVer(version, this.options);
  }

  return cmp(version, this.operator, this.semver, this.options);
};

exports.Range = Range;
function Range(range, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }

  this.options = options;
  this.loose = !!options.loose;
  this.includePrerelease = !!options.includePrerelease;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range
    .split(/\s*\|\|\s*/)
    .map(function(range) {
      return this.parseRange(range.trim());
    }, this)
    .filter(function(c) {
      // throw out any that are not relevant for whatever reason
      return c.length;
    });

  if (!this.set.length) {
    throw new TypeError("Invalid SemVer Range: " + range);
  }

  this.format();
}

Range.prototype.format = function() {
  this.range = this.set
    .map(function(comps) {
      return comps.join(" ").trim();
    })
    .join("||")
    .trim();
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.options.loose;
  range = range.trim();
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(" ");

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range
    .split(" ")
    .map(function(comp) {
      return parseComparator(comp, this.options);
    }, this)
    .join(" ")
    .split(/\s+/);
  if (this.options.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, this.options);
  }, this);

  return set;
};

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, options) {
  comp = replaceCarets(comp, options);
  comp = replaceTildes(comp, options);
  comp = replaceXRanges(comp, options);
  comp = replaceStars(comp, options);
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === "x" || id === "*";
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, options) {
  return comp
    .trim()
    .split(/\s+/)
    .map(function(comp) {
      return replaceTilde(comp, options);
    })
    .join(" ");
}

function replaceTilde(comp, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }
  var r = options.loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    var ret;

    if (isX(M)) {
      ret = "";
    } else if (isX(m)) {
      ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0
      ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
    } else if (pr) {
      if (pr.charAt(0) !== "-") {
        pr = "-" + pr;
      }
      ret =
        ">=" + M + "." + m + "." + p + pr + " <" + M + "." + (+m + 1) + ".0";
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
    }

    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, options) {
  return comp
    .trim()
    .split(/\s+/)
    .map(function(comp) {
      return replaceCaret(comp, options);
    })
    .join(" ");
}

function replaceCaret(comp, options) {
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }
  var r = options.loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    var ret;

    if (isX(M)) {
      ret = "";
    } else if (isX(m)) {
      ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
    } else if (isX(p)) {
      if (M === "0") {
        ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
      } else {
        ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
      }
    } else if (pr) {
      if (pr.charAt(0) !== "-") {
        pr = "-" + pr;
      }
      if (M === "0") {
        if (m === "0") {
          ret =
            ">=" +
            M +
            "." +
            m +
            "." +
            p +
            pr +
            " <" +
            M +
            "." +
            m +
            "." +
            (+p + 1);
        } else {
          ret =
            ">=" +
            M +
            "." +
            m +
            "." +
            p +
            pr +
            " <" +
            M +
            "." +
            (+m + 1) +
            ".0";
        }
      } else {
        ret = ">=" + M + "." + m + "." + p + pr + " <" + (+M + 1) + ".0.0";
      }
    } else {
      if (M === "0") {
        if (m === "0") {
          ret =
            ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." + (+p + 1);
        } else {
          ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
        }
      } else {
        ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
      }
    }

    return ret;
  });
}

function replaceXRanges(comp, options) {
  return comp
    .split(/\s+/)
    .map(function(comp) {
      return replaceXRange(comp, options);
    })
    .join(" ");
}

function replaceXRange(comp, options) {
  comp = comp.trim();
  if (!options || typeof options !== "object") {
    options = { loose: !!options, includePrerelease: false };
  }
  var r = options.loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === "=" && anyX) {
      gtlt = "";
    }

    if (xM) {
      if (gtlt === ">" || gtlt === "<") {
        // nothing is allowed
        ret = "<0.0.0";
      } else {
        // nothing is forbidden
        ret = "*";
      }
    } else if (gtlt && anyX) {
      // replace X with 0
      if (xm) {
        m = 0;
      }
      if (xp) {
        p = 0;
      }

      if (gtlt === ">") {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = ">=";
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === "<=") {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = "<";
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }

      ret = gtlt + M + "." + m + "." + p;
    } else if (xm) {
      ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
    } else if (xp) {
      ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
    }


    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, options) {
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], "");
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
  if (isX(fM)) {
    from = "";
  } else if (isX(fm)) {
    from = ">=" + fM + ".0.0";
  } else if (isX(fp)) {
    from = ">=" + fM + "." + fm + ".0";
  } else {
    from = ">=" + from;
  }

  if (isX(tM)) {
    to = "";
  } else if (isX(tm)) {
    to = "<" + (+tM + 1) + ".0.0";
  } else if (isX(tp)) {
    to = "<" + tM + "." + (+tm + 1) + ".0";
  } else if (tpr) {
    to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
  } else {
    to = "<=" + to;
  }

  return (from + " " + to).trim();
}

// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version) {
    return false;
  }

  if (typeof version === "string") {
    version = new SemVer(version, this.options);
  }

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version, this.options)) {
      return true;
    }
  }
  return false;
};

function testSet(set, version, options) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false;
    }
  }

  if (!options) {
    options = {};
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (i = 0; i < set.length; i++) {
      if (set[i].semver === ANY) {
        continue;
      }

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (
          allowed.major === version.major &&
          allowed.minor === version.minor &&
          allowed.patch === version.patch
        ) {
          return true;
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, options) {
  try {
    range = new Range(range, options);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.coerce = coerce;
function coerce(version) {
  if (version instanceof SemVer) {
    return version;
  }

  if (typeof version !== "string") {
    return null;
  }

  var match = version.match(re[COERCE]);

  if (match == null) {
    return null;
  }

  return parse(
    (match[1] || "0") + "." + (match[2] || "0") + "." + (match[3] || "0")
  );
}
