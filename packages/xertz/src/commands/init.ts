import Command from "@oclif/command";
import * as Conf from "conf";

import { AppGenerator } from "../AppGenerator";

export class Init extends Command {
  Config: Conf = new Conf();
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
    const name = args.projectName ?? "xertz";
    const generator = new AppGenerator({ name }, args.dev);
    generator.run();
  }
}
