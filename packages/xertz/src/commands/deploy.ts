import Command from "@oclif/command";

export class Deploy extends Command {
  static description = "description of this example command";

  async run() {
    console.log("running my command");
  }
}
