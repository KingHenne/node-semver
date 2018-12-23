// @ts-check

var semver = require("../");

test("long version is too long", function() {
  var v = "1.2." + new Array(256).join("1");
  expect(function() {
    new semver.SemVer(v); // eslint-disable-line no-new
  }).toThrowError();
  expect(semver.valid(v, false)).toBeNull();
  expect(semver.valid(v, true)).toBeNull();
  expect(semver.inc(v, "patch")).toBeNull();
});

test("big number is like too long version", function() {
  var v = "1.2." + new Array(100).join("1");
  expect(function() {
    new semver.SemVer(v); // eslint-disable-line no-new
  }).toThrowError();
  expect(semver.valid(v, false)).toBeNull();
  expect(semver.valid(v, true)).toBeNull();
  expect(semver.inc(v, "patch")).toBeNull();
});

test("parsing null does not throw", function() {
  expect(semver.parse(null)).toBeNull();
  expect(semver.parse({})).toBeNull();
  expect(semver.parse(new semver.SemVer("1.2.3")).version).toBe("1.2.3");
});
