import { resolve, extname, sep, parse, join } from "path";
import {
  writeFileSync,
  readFileSync,
  lstatSync,
  readdirSync,
  existsSync,
  statSync,
  fstat,
  mkdirSync,
  rmdirSync,
  unlinkSync,
} from "fs";
import * as fs from "fs";
import * as path from "path";

import rollup from "rollup";

import { EngineConfig } from "./types";

export class FileSystem {
  constructor(protected config: EngineConfig) {}

  loadSchema() {
    const { input } = this.config.graphql;
    return input
      .map((dir) =>
        FileSystem.read
          .dir(dir)
          .map((file) =>
            FileSystem.read.file(FileSystem.path.resolve([dir, file]))
          )
          .join("/n")
      )
      .join("/n");
  }

  static write = {
    file(file: string, data: string) {
      return writeFileSync(file, data);
    },
  };

  static read = {
    file(file: string) {
      return readFileSync(file, { encoding: "utf-8" });
    },
    dir(dir: string) {
      return readdirSync(resolve(process.cwd(), dir));
    },
  };

  static path = {
    resolve(bits: string[]) {
      return resolve(process.cwd(), ...bits);
    },
    join(bits: string[]) {
      return join(...bits);
    },
    parse(file: string) {
      return path.parse(file);
    },
    extension(file: string) {
      return path.extname(file);
    },
  };
}
