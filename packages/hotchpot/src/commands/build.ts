import Command from "@oclif/command";
import { Engine as Builder, BuilderConfig, EngineConfig } from "@hotch/core";
import { readFileSync, writeFileSync } from "fs";
import * as toml from "@iarna/toml";
import * as path from "path";
import { Util } from "../Util";

export class Build extends Command {
  private toml: any = toml.parse(
    readFileSync("./hotch.toml", { encoding: "utf-8" })
  );
  static description = "description of this example command";

  async createProjectConfig() {
    const { project, ...rest } = this.toml;
    const envConfig = this.scrapeRelevantEnvConfig(this.config);
    const rollup = await Util.loadRollupConfig();
    //@ts-ignore
    return {
      ...project,
      ...envConfig,
      pot: path.resolve(process.cwd(), ".pot"),
      rollup,
    };
  }

  async run() {
    const project = await this.createProjectConfig();

    const config = {
      ...this.toml,
      project,
    };

    const builder = new Builder(config);
    const result = await builder.run();
    result.synth();
  }

  scrapeRelevantEnvConfig(config: Command["config"]) {
    return {
      hotchVersion: config.version,
      hotchPlatform: config.platform,
      hotchArch: config.arch,
    };
  }
}
