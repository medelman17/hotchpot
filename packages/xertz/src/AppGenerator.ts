import * as shelljs from "shelljs";
import * as path from "path";

export class AppGenerator {
  cliDir: string = __dirname;
  templateDir: string = path.join(__dirname, "../template");
  appRoot: string;

  constructor(protected config: { name: string }, dev?: boolean) {
    this.appRoot = path.join(process.cwd(), this.config.name);
    if (dev) {
      shelljs.exec(`rm -rf ${this.appRoot}`);
    }
  }

  async run() {
    await this.createProjectDirectories();
  }

  async createProjectDirectories() {
    if (shelljs.test("-e", this.appRoot)) {
      throw new Error(
        "It looks like a project with that name already exists..."
      );
    } else {
      shelljs.mkdir(this.appRoot);
      shelljs.cp("-r", `${this.templateDir}/*`, this.appRoot);
    }
  }
}
