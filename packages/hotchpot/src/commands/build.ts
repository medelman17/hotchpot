import Command from "@oclif/command";
import { Builder, BuilderConfig } from "@hotch/core";
import { readFileSync, writeFileSync } from "fs";
import * as toml from "@iarna/toml";
import * as execa from "execa";

export class Build extends Command {
  static description = "description of this example command";

  async run() {
    const config = toml.parse(
      readFileSync("./hotch.toml", { encoding: "utf-8" })
    );
    const builder = new Builder(config as BuilderConfig);
    const result = await builder.run();
    result.synth();
  }
}
