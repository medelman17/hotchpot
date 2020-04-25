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

export class FileSystem {
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
  };
}
