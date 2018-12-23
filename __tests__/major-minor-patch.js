// @ts-check

var semver = require("../semver.js");

test("major tests", function() {
  // [range, version]
  // Version should be detectable despite extra characters
  [
    ["1.2.3", 1],
    [" 1.2.3 ", 1],
    [" 2.2.3-4 ", 2],
    [" 3.2.3-pre ", 3],
    ["v5.2.3", 5],
    [" v8.2.3 ", 8],
    ["\t13.2.3", 13],
    ["=21.2.3", 21, true],
    ["v=34.2.3", 34, true]
  ].forEach(function(tuple) {
    var range = tuple[0];
    var version = tuple[1];
    var loose = tuple[2] || false;
    expect(semver.major(range, loose)).toBe(version);
  });
});

test("minor tests", function() {
  // [range, version]
  // Version should be detectable despite extra characters
  [
    ["1.1.3", 1],
    [" 1.1.3 ", 1],
    [" 1.2.3-4 ", 2],
    [" 1.3.3-pre ", 3],
    ["v1.5.3", 5],
    [" v1.8.3 ", 8],
    ["\t1.13.3", 13],
    ["=1.21.3", 21, true],
    ["v=1.34.3", 34, true]
  ].forEach(function(tuple) {
    var range = tuple[0];
    var version = tuple[1];
    var loose = tuple[2] || false;
    expect(semver.minor(range, loose)).toBe(version);
  });
});

test("patch tests", function() {
  // [range, version]
  // Version should be detectable despite extra characters
  [
    ["1.2.1", 1],
    [" 1.2.1 ", 1],
    [" 1.2.2-4 ", 2],
    [" 1.2.3-pre ", 3],
    ["v1.2.5", 5],
    [" v1.2.8 ", 8],
    ["\t1.2.13", 13],
    ["=1.2.21", 21, true],
    ["v=1.2.34", 34, true]
  ].forEach(function(tuple) {
    var range = tuple[0];
    var version = tuple[1];
    var loose = tuple[2] || false;
    expect(semver.patch(range, loose)).toBe(version);
  });
});
