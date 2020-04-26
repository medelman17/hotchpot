import Command from "@oclif/command";
import { Builder } from "@xertz/core";
import * as execa from "execa";

export class Build extends Command {
  static description = "description of this example command";

  async run() {
    const builder = new Builder({ inputs: ["./graphql"] });
    builder.run();
  }
}
