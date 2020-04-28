import * as babel from "@babel/core";
import * as shelljs from "shelljs";
import * as fs from "fs";
import * as vm from "vm";

export class Util {
  static async loadRollupConfig() {
    // const f = await import(process.cwd() + "/.pot/rollup.config.js");
    const rollup = fs.readFileSync("./.pot/rollup.config.js", {
      encoding: "utf-8",
    });

    const code = babel.transformSync(rollup, {
      presets: ["@babel/preset-env"],
    });

    if (code !== null) {
      fs.writeFileSync("./.pot/r.c.js", code.code);
    }

    try {
      return await import(process.cwd() + "/.pot/r.c.js");
    } catch (err) {
      console.log(err);
    } finally {
      shelljs.rm(process.cwd() + "/.pot/r.c.js");
    }
  }
}
