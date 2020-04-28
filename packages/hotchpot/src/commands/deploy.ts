import Command from "@oclif/command";
import * as execa from "execa";
// import { spawn } from "child_process";
//@ts-ignore
import { BuilderConfig } from "@hotch/core";
import { readFileSync, writeFileSync, ReadStream, WriteStream } from "fs";
import * as toml from "@iarna/toml";

export class Deploy extends Command {
  static description = "description of this example command";

  async run() {
    const config = toml.parse(
      readFileSync("./hotch.toml", { encoding: "utf-8" })
    );

    try {
      execa("cdk", this.createBootstrapArgs(config), {
        stdio: "inherit",
      }).then(() => {
        execa(`cdk`, this.createCdkArguments(config as BuilderConfig), {
          stdio: "inherit",
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  createBootstrapArgs(config: BuilderConfig) {
    let args = ["bootstrap"];
    const { aws } = config;

    if (aws.profile) {
      args.push(`--profile`);
      args.push(aws.profile);
    } else {
      // console.log("No profile");
    }
    return args;
  }

  createCdkArguments(config: BuilderConfig) {
    let args = [
      "deploy",
      // "--app",
      // "./node_modules/hotchpot/bin/run",
      "--outputs-file",
      "./.pot/hotchpot.stacks.json",
    ];
    const { aws } = config;

    if (aws.profile) {
      args.push(`--profile`);
      args.push(aws.profile);
    } else {
      // console.log("No profile");
    }
    return args;
  }
}
