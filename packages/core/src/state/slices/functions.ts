import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

type FunctionJob = {
  id: string;
  name: string;

  outputDir: string;
  outputFile: string;
  inputFile: string;
  code: any;
};

const functionAdapter = createEntityAdapter<FunctionJob>({
  selectId: (input) => input.id,
});

export const functionSlice = createSlice({
  name: "functions",
  initialState: functionAdapter.getInitialState(),
  reducers: {
    add: functionAdapter.addOne,
  },
});

const actions = functionSlice.actions;
export { actions };
