import * as shelljs from "shelljs";
import * as path from "path";
import * as toml from "@iarna/toml";
import * as execa from "execa";
import { readFileSync, writeFileSync } from "fs";
export class AppGenerator {
  cliDir: string = __dirname;
  templateDir: string = path.join(__dirname, "../template");
  root: string;
  name: string;

  constructor(protected config: { name: string }, dev?: boolean) {
    this.name = config.name;
    this.root = path.join(process.cwd(), this.name);

    if (dev) {
      shelljs.exec(`rm -rf ${this.root}`);
    }
  }

  async run() {
    await this.createProjectDirectories();
    await this.createProjectConfigurationFile();
    await this.createProjectPackageJson();
    await this.installDeps();
  }

  async installDeps() {
    if (!process.env.SKIPNPM) {
      shelljs.cd(this.root);
      const yarn = shelljs.which("yarn");
      if (yarn !== null) {
        await execa(yarn.stdout, [], { stdio: "inherit" });
      } else {
        await execa("npm", ["install"], { stdio: "inherit" });
      }
      shelljs.cd("..");
    } else {
      console.log("Skipping NPM install...");
    }
  }

  async createProjectDirectories() {
    if (shelljs.test("-e", this.root)) {
      throw new Error(
        "It looks like a project with that name already exists..."
      );
    } else {
      shelljs.mkdir(this.root);
      shelljs.cp("-r", `${this.templateDir}/**/*`, this.root);
      shelljs.cp("-r", `${this.templateDir}/.pot`, `${this.root}/.pot`);
      shelljs.mkdir("-p", `${this.root}/.pot/schema`);
      shelljs.mkdir("-p", `${this.root}/.pot/functions`);
    }
  }

  async createProjectConfigurationFile() {
    const templateConfig = toml.parse(
      readFileSync(path.resolve(this.root, "hotch.toml"), {
        encoding: "utf-8",
      })
    );
    const config = { ...templateConfig, project: { name: this.name } };
    writeFileSync(
      path.resolve(this.root, "hotch.toml"),
      toml.stringify(config)
    );
  }

  async createProjectPackageJson() {
    const templatePkg = JSON.parse(
      readFileSync(path.resolve(this.root, "package.json"), {
        encoding: "utf-8",
      })
    );
    const pkg = { ...templatePkg, name: this.name };
    writeFileSync(
      path.resolve(this.root, "package.json"),
      JSON.stringify(pkg, null, 2)
    );
  }
}
