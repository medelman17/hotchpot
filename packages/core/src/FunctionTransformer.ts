import { FileSystem } from "./FileSystem";
import * as shelljs from "shelljs";
import rollup from "rollup";
import {
  EngineConfig,
  EngineFunctionsConfig,
  EngineProjectConfig,
} from "./types";
import { Context } from "./Context";
import { actions } from "./state/slices/functions";

export class FunctionTransformer {
  private rollupConfig: rollup.RollupOptions;
  private project: EngineProjectConfig;
  private config: EngineFunctionsConfig;
  private paths: string[] = [];
  private files: string[] = [];
  constructor(config: EngineConfig, protected context: Context) {
    this.rollupConfig = config.project.rollup.lambda;
    this.config = config.functions;
    this.project = config.project;
    this.paths = this.config.input;

    for (const path of this.paths) {
      const files = FileSystem.read.dir(path);
      for (const file of files) {
        this.files.push(FileSystem.path.join([path, file]));
      }
    }
  }

  async run() {
    for (const file of this.files) {
      await this.processFunction(file);
    }
    return {};
  }

  getMetadata(file: string) {
    const ext = FileSystem.path.extension(file);
    const format = FileSystem.path.parse(file);
    return {
      ...format,
      isTS: ext === ".ts",
      isJS: ext === ".js",
    };
  }

  async processFunction(file: string) {
    const metadata = this.getMetadata(file);
    const name = metadata.name;
    const outputDir = FileSystem.path.join([".pot", "functions", name]);
    const outputFile = `${outputDir}/index.js`;
    shelljs.mkdir("-p", outputDir);

    const code = await rollup.rollup({
      input: file,
      ...this.rollupConfig,
    });

    await code.write({
      file: outputFile,
    });

    this.context.dispatch(
      actions.add({
        id: outputFile,
        name,
        outputDir,
        outputFile,
        inputFile: file,
        code: await code.generate({ format: "cjs" }),
      })
    );
  }
}
