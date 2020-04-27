import Command from "@oclif/command";
// import * as Conf from "conf";

import { AppGenerator } from "../AppGenerator";

export class Init extends Command {
  static description = "Start a new Hotch project";
  static aliases = ["i"];

  static args = [
    {
      name: "project",
      required: true,
      description: "name of your new project",
    },
    {
      name: "dev",
      required: false,
    },
  ];

  async run() {
    const { args } = this.parse(Init);
    const name = args.project ?? "HotchpotProject";
    const generator = new AppGenerator({ name }, args.dev);
    generator.run();
  }
}
