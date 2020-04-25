import Command from "@oclif/command";
import { Builder } from "@xertz/core";

export class Build extends Command {
  static description = "description of this example command";

  async run() {
    const builder = new Builder({ inputs: ["./fixtures/graphql"] });
    builder.run();
  }
}
