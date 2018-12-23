// @ts-check

const spawn = require("child_process").spawn;
const bin = require.resolve("../bin/semver");
const run = args =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, [bin].concat(args));
    c.on("error", reject);
    const out = [];
    const err = [];
    c.stdout.setEncoding("utf-8");
    c.stdout.on("data", chunk => out.push(chunk));
    c.stderr.setEncoding("utf-8");
    c.stderr.on("data", chunk => err.push(chunk));
    c.on("close", (code, signal) => {
      resolve({
        out: out.join(""),
        err: err.join(""),
        code: code,
        signal: signal
      });
    });
  });

test("inc tests", () => {
  [
    [["-i", "major", "1.0.0"], { out: "2.0.0\n", code: 0, signal: null }],
    [
      ["-i", "major", "1.0.0", "1.0.1"],
      {
        out: "",
        err: "--inc can only be used on a single version with no range\n",
        code: 1
      }
    ]
  ].forEach(c => expect(run(c[0])).resolves.toMatchObject(c[1]));
});
