// @ts-check

var semver = require("../semver.js");
var clean = semver.clean;

test("clean tests", function() {
  // [range, version]
  // Version should be detectable despite extra characters
  [
    ["1.2.3", "1.2.3"],
    [" 1.2.3 ", "1.2.3"],
    [" 1.2.3-4 ", "1.2.3-4"],
    [" 1.2.3-pre ", "1.2.3-pre"],
    ["  =v1.2.3   ", "1.2.3"],
    ["v1.2.3", "1.2.3"],
    [" v1.2.3 ", "1.2.3"],
    ["\t1.2.3", "1.2.3"],
    [">1.2.3", null],
    ["~1.2.3", null],
    ["<=1.2.3", null],
    ["1.2.x", null]
  ].forEach(function(tuple) {
    var range = tuple[0];
    var version = tuple[1];
    expect(clean(range)).toBe(version);
  });
});
