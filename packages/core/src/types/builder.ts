export type EngineGraphQLConfig = {
  input: string[];
  filters: string[];
};

export type EngineProjectConfig = {
  name: string;
  pot: string;
  pwd: string;
  hotchVersion: string;
  hotchPlatform: string;
  hotchArch: string;
  isWindows: boolean;
  rollup: any;
};

export type EngineAWSConfig = {
  profile?: string;
};

export type EngineFunctionsConfig = {
  input: string[];
};

export type EngineHotchpotConfig = {
  hotchVersion: string;
  hotchPlatform: string;
  hotchArch: string;
  isWindows: boolean;
};

export type EngineConfig = {
  graphql: EngineGraphQLConfig;
  project: EngineProjectConfig;
  functions: EngineFunctionsConfig;
  aws: EngineAWSConfig;
};
