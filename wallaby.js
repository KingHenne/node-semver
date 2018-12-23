"use strict";

module.exports = function() {
  return {
    env: {
      type: "node"
    },
    files: ["semver.js", "bin/semver"],
    testFramework: "jest",
    tests: ["__tests__/*.js"]
  };
};
