import { Context } from "./Context";

type TransformerFunction = (context: Context) => Context;

export class Transformer {
  private transformers: TransformerFunction[] = [];

  constructor(protected context: Context) {}

  schedule(transformer: TransformerFunction) {
    this.transformers = [...this.transformers, transformer];
  }

  run = (): Context => {
    for (const transformer of this.transformers) {
      this.context = transformer(this.context);
    }
    return this.context;
  };
}
