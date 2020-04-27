import { Context } from "./Context";
import { FileSystem } from "./FileSystem";
import { IGrantable } from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";
import {
  CfnGraphQLApi,
  CfnApiKey,
  CfnGraphQLSchema,
  CfnDataSource,
  CfnResolver,
  FieldLogLevel,
  MappingTemplate,
  PrimaryKey,
  Assign,
  Values,
} from "@aws-cdk/aws-appsync";
import {
  Table,
  AttributeType,
  StreamViewType,
  BillingMode,
  ProjectionType,
} from "@aws-cdk/aws-dynamodb";
import { Role, ServicePrincipal, ManagedPolicy } from "@aws-cdk/aws-iam";
import { TemplateHeader } from "./MappingTemplate";
import { OpsMap } from "./transformers";
import { InfraJob } from "./state/slices";

export type InfrastructureManagerProps = {
  context: Context;
  fs: FileSystem;
  reporter: (arg: any) => void;
  project: { name: string };
};

export class InfrastructureManager extends cdk.Stack {
  project: { name: string };
  reporter: (arg: any) => void;

  context: Context;
  fs: FileSystem;
  res: {
    Api: CfnGraphQLApi;
    ApiKey: CfnApiKey;
    LoggerRole: Role;
    Schema: CfnGraphQLSchema;
    Table: Table;
    TableRole: Role;
    DataSource: CfnDataSource;
  };

  constructor(
    scope: cdk.Construct,
    id: string,
    props: InfrastructureManagerProps
  ) {
    super(scope, id);
    this.context = props.context;
    this.project = props.project;
    this.reporter = props.reporter;

    this.reporter({ key: "NADA", msg: "Hello" });

    //@ts-ignore
    this.res = {};
    this.init.logger();
    this.init.api({
      name: this.named("GraphQLApi"),
      authenticationType: "API_KEY",
      cloudWatchLogsRoleArn: this.res.LoggerRole.roleArn,
    });
    this.init.apiKey({
      name: this.named("GraphQLApiKey"),
      apiId: this.res.Api.attrApiId,
    });
    this.init.schema({
      apiId: this.res.Api.attrApiId,
      definition: this.context.makeSchema(),
    });
    this.init.table({ name: this.named("DynamoTable") });
    this.init.tableRole();
    this.init.tableDataSource({
      name: this.named("DynamoDataSource"),
      apiId: this.res.Api.attrApiId,
      tableName: this.res.Table.tableName,
      serviceRoleArn: this.res.TableRole.roleArn,
    });

    this.handle();
  }

  named(s: string) {
    return `${this.project.name}_${s}`;
  }

  handle = () => {
    const { infra } = this.context.store.getState();
    const { ids, entities } = infra;

    for (const id of ids) {
      const job = entities[id];
      const dynamoOp = mapJobToDynamoOp(job.op);

      if (["GetItem", "Query", "PutItem"].includes(dynamoOp)) {
        const requestTemplate = buildRequestTemplate(job);
        const responseTemplate = buildResponseTemplate(job);

        this.api.add.tableResolver({
          name: this.named(`${job.fieldName}Resolver`),
          apiId: this.res.Api.attrApiId,
          fieldName: job.fieldName,
          typeName: dynamoOp === "PutItem" ? "Mutation" : "Query",
          requestTemplate,
          responseTemplate,
        });
      }
    }

    // iterate through scheduled infra jobs and execute
  };

  init = {
    api: (args: {
      name: string;
      authenticationType: string;
      cloudWatchLogsRoleArn: string;
    }) => {
      const { name, authenticationType, cloudWatchLogsRoleArn } = args;
      this.res.Api = new CfnGraphQLApi(this, name, {
        name,
        authenticationType,
        logConfig: {
          cloudWatchLogsRoleArn,
          fieldLogLevel: FieldLogLevel.ALL,
        },
      });
      new cdk.CfnOutput(this, "GraphQLApiId", {
        value: this.res.Api.attrApiId,
      });
      new cdk.CfnOutput(this, "GraphQLApiURL", {
        value: this.res.Api.attrGraphQlUrl,
      });
      new cdk.CfnOutput(this, "GraphQLApiARN", {
        value: this.res.Api.attrArn,
      });
    },
    apiKey: (args: { name: string; apiId: string }) => {
      const { name } = args;
      this.res.ApiKey = new CfnApiKey(this, name, args);
      new cdk.CfnOutput(this, "GraphQLApiKey", {
        value: this.res.ApiKey.attrApiKey,
      });
      new cdk.CfnOutput(this, "GraphQLApiKeyArn", {
        value: this.res.ApiKey.attrArn,
      });
    },
    logger: () => {
      this.res.LoggerRole = new Role(this, this.named("ApiLogsRole"), {
        assumedBy: new ServicePrincipal("appsync"),
      });
      this.res.LoggerRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppSyncPushToCloudWatchLogs"
        )
      );
    },
    schema: (args: { apiId: string; definition: string }) => {
      this.res.Schema = new CfnGraphQLSchema(this, this.named("Schema"), args);
    },
    tableDataSource: (args: {
      apiId: string;
      name: string;
      tableName: string;
      serviceRoleArn: string;
    }) => {
      const { apiId, name, tableName, serviceRoleArn } = args;
      this.res.DataSource = new CfnDataSource(
        this,
        this.named("TableDataSource"),
        {
          apiId,
          name,
          type: "AMAZON_DYNAMODB",
          dynamoDbConfig: { tableName, awsRegion: this.region },
          serviceRoleArn,
        }
      );
    },
    table: (args: {
      name: string;
      removalPolicy?: cdk.RemovalPolicy;
      billingMode?: BillingMode;
    }) => {
      const { name } = args;
      this.res.Table = new Table(this, name, {
        tableName: args.name,
        partitionKey: {
          name: "PK",
          type: AttributeType.STRING,
        },
        sortKey: {
          name: "SK",
          type: AttributeType.STRING,
        },
        billingMode: args.billingMode ?? BillingMode.PAY_PER_REQUEST,
        removalPolicy: args.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
        stream: StreamViewType.NEW_AND_OLD_IMAGES,
      });
    },
    tableRole: (args?: {}) => {
      this.res.TableRole = new Role(this, this.named("TableRole"), {
        assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
      });
      this.res.TableRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
      );
    },
  };

  api = {
    add: {
      tableResolver: (args: {
        name: string;
        apiId: string;
        fieldName: string;
        typeName: string;
        requestTemplate: string;
        responseTemplate: string;
      }) => {
        const {
          name,
          apiId,
          fieldName,
          typeName,
          requestTemplate,
          responseTemplate,
        } = args;
        const resolver = new CfnResolver(this, name, {
          apiId,
          fieldName,
          typeName,
          dataSourceName: this.res.DataSource.name,
          requestMappingTemplate: requestTemplate,
          responseMappingTemplate: responseTemplate,
        });
        resolver.addDependsOn(this.res.Schema);
        resolver.addDependsOn(this.res.DataSource);
      },
    },
  };

  table = {
    add: {
      gsi: (args: {
        name: string;
        nonKeyAttributes?: string[];
        projectionType?: ProjectionType;
      }) => {
        this.res.Table.addGlobalSecondaryIndex({
          indexName: args.name,
          partitionKey: {
            name: `${args.name}PK`,
            type: AttributeType.STRING,
          },
          sortKey: {
            name: `${args.name}SK`,
            type: AttributeType.STRING,
          },
          nonKeyAttributes: args.nonKeyAttributes,
          projectionType: args.projectionType,
        });
      },
      lsi: (args: {
        name: string;
        nonKeyAttributes?: string[];
        projectionType?: ProjectionType;
      }) => {
        this.res.Table.addLocalSecondaryIndex({
          indexName: args.name,
          sortKey: {
            name: `${args.name}SK`,
            type: AttributeType.STRING,
          },
          nonKeyAttributes: args.nonKeyAttributes,
          projectionType: args.projectionType,
        });
      },
    },
    grant: {
      fullAccess: (policy: IGrantable) =>
        this.res.Table.grantFullAccess(policy),
      streamAccess: (policy: IGrantable) => this.res.Table.grantStream(policy),
    },
    template: {
      get: {
        entity: {
          request: () => {},
          response: () => {},
        },
      },
      list: {
        entity: {
          request: () => {},
          response: () => {},
        },
        interface: {
          request: (args: { interfaceName: string }) => {
            return MappingTemplate.fromString(
              ` {
                  "version": "2017-02-28",
                  "operation": "Query",
                  "query": {
                    "expression": "#PK = :pk",
                    "expressionNames": { "#PK": "PK" },
                    "expressionValues": {":pk": $util.dynamodb.toDynamoDBJson("Interface#${args.interfaceName}")}
                  }
                }
              `
            );
          },
          response: () => {
            return MappingTemplate.dynamoDbResultList().renderTemplate();
          },
        },
      },
      create: {
        entity: {
          request: (args: { interfaceName: string; entityName: string }) => {
            // const header = TemplateHeader.attribute("typename")
            //   .is(args.entityName)
            //   .attribute("interface")
            //   .is(args.interfaceName)
            //   .attribute("id")
            //   .is("$util.autoId()")
            //   .renderTemplate();
            // const base = MappingTemplate.dynamoDbPutItem(
            //   new PrimaryKey(
            //     new Assign("PK", '"Interface#$extra.interface"'),
            //     new Assign("SK", '"$extra.typename#$extra.id"')
            //   ),
            //   Values.projecting()
            //     .attribute("__typename")
            //     .is(args.entityName)
            //     .attribute("createdAt")
            //     .is("$util.time.nowISO8601()")
            //     .attribute("updatedAt")
            //     .is("$util.time.nowISO8601()")
            //     .attribute("id")
            //     .is("$extra.id")
            // ).renderTemplate();
            // return MappingTemplate.fromString([header, base].join("\n"));
          },
          response: () => {
            return MappingTemplate.dynamoDbResultItem().renderTemplate();
          },
        },
      },
      update: {
        entity: {
          request: () => {},
          response: () => {},
        },
      },
      delete: {
        entity: {
          request: () => {},
          response: () => {},
        },
      },
    },
  };
}

function mapJobToDynamoOp(job: keyof OpsMap) {
  switch (job) {
    case "GET":
      return "GetItem";
    case "LIST":
      return "Query";
    case "CREATE":
      return "PutItem";
    case "UPDATE":
      return "UpdateItem";
    case "DELETE":
      return "DeleteItem";
  }
}

function buildRequestTemplate(job: InfraJob) {
  const dynamoOperation = mapJobToDynamoOp(job.op);
  switch (job.op) {
    case "GET":
      return getEntityGetRequestTemplate({
        interfaceName: job.returnTypeInterface,
        entityName: job.returnType,
      });
    case "LIST":
      return job.isInterface
        ? getInterfaceListRequestTemplate({
            interfaceName: job.returnTypeInterface,
          })
        : getEntityListRequestTemplate({
            interfaceName: job.returnTypeInterface,
            entityName: job.returnType,
          });
    case "CREATE":
      return getEntityCreateRequestTemplate({
        interfaceName: job.returnTypeInterface,
        entityName: job.returnType,
      });
    case "UPDATE":
      return job.isInterface ? "" : "";
    case "DELETE":
      return job.isInterface ? "" : "";
  }
}

function buildResponseTemplate(job: InfraJob) {
  if (job.isList) {
    return MappingTemplate.dynamoDbResultList().renderTemplate();
  } else {
    return MappingTemplate.dynamoDbResultItem().renderTemplate();
  }
}

function getEntityCreateRequestTemplate(args: {
  interfaceName: string;
  entityName: string;
}) {
  const header = TemplateHeader.attribute("typename")
    .is(args.entityName)
    .attribute("interface")
    .is(args.interfaceName)
    .attribute("id")
    .is("$util.autoId()")
    .renderTemplate();

  const base = MappingTemplate.fromString(
    `
    #set($input = $ctx.args.input)
    $util.qr($input.put("__typename", "${args.entityName}"))
    $util.qr($input.put("createdAt", "$util.time.nowISO8601()"))
    $util.qr($input.put("updatedAt", "$util.time.nowISO8601()"))
    $util.qr($input.put("id", "$extra.id")) 
    {
      "version" : "2017-02-28",
      "operation" : "PutItem",
      "key" : {
        "PK" : $util.dynamodb.toDynamoDBJson("Interface#${args.interfaceName}"), 
        "SK" : $util.dynamodb.toDynamoDBJson("$extra.typename#$extra.id")
      },
      "attributeValues": $util.dynamodb.toMapValuesJson($input)
    }`
  ).renderTemplate();

  return MappingTemplate.fromString([header, base].join("\n")).renderTemplate();
}

function getEntityListRequestTemplate(args: {
  interfaceName: string;
  entityName: string;
}) {
  return MappingTemplate.fromString(
    `{
      "version" : "2017-02-28", 
      "operation" : "Query", 
      "query" : {
        "expression" : "#PK = :pk AND begins_with(#SK, :sk)",
        "expressionNames" : {
          "#PK" : "PK", 
          "#SK" : "SK"
        },
        "expressionValues" : {
          ":pk" : $util.dynamodb.toDynamoDBJson("Interface#${args.interfaceName}"), ":sk" : $util.dynamodb.toDynamoDBJson("${args.entityName}")
        }
      }
    }`
  ).renderTemplate();
}

function getInterfaceListRequestTemplate(args: { interfaceName: string }) {
  return MappingTemplate.fromString(
    ` {
        "version": "2017-02-28",
        "operation": "Query",
        "query": {
          "expression": "#PK = :pk",
          "expressionNames": { "#PK": "PK" },
          "expressionValues": {":pk": $util.dynamodb.toDynamoDBJson("Interface#${args.interfaceName}")}
        }
      }
    `
  ).renderTemplate();
}

function getEntityGetRequestTemplate(args: {
  interfaceName: string;
  entityName: string;
}) {
  return MappingTemplate.fromString(
    ` {
      "version" : "2017-02-28",
      "operation" : "GetItem",
      "key" : {
        "PK" : $util.dynamodb.toDynamoDBJson("Interface#${args.interfaceName}"),
        "SK" : $util.dynamodb.toDynamoDBJson("${args.entityName}#$ctx.args.where.id")
      }
    }
  `
  ).renderTemplate();
}
