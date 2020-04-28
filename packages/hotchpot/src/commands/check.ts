import Command from "@oclif/command";
// import * as Conf from "conf";

import { AppGenerator } from "../AppGenerator";

export class Check extends Command {
  static description = "Start a new Hotch project";

  static args = [];

  async run() {
    const { args } = this.parse(Check);
    console.log(process.env);
  }
}
