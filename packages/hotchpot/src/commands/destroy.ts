import Command from "@oclif/command";
import * as execa from "execa";

export class Destroy extends Command {
  async run() {
    const cdk = execa("cdk", ["destroy"], {
      stdio: "inherit",
    });
    await cdk;
  }
}
