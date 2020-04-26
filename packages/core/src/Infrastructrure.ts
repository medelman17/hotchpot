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

export type InfrastructureManagerProps = { context: Context; fs: FileSystem };

export class InfrastructureManager extends cdk.Stack {
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
    //@ts-ignore
    this.res = {};
    this.init.logger();
    this.init.api({
      name: "XertzGraphQLApi",
      authenticationType: "API_KEY",
      cloudWatchLogsRoleArn: this.res.LoggerRole.roleArn,
    });
    this.init.apiKey({ name: "GraphQLApiKey", apiId: this.res.Api.attrApiId });
    this.init.schema({
      apiId: this.res.Api.attrApiId,
      definition: this.context.makeSchema(),
    });
    this.init.table({ name: "XertzDynamoTable" });
    this.init.tableRole();
    this.init.tableDataSource({
      name: "DynamoDS",
      apiId: this.res.Api.attrApiId,
      tableName: this.res.Table.tableName,
      serviceRoleArn: this.res.TableRole.roleArn,
    });

    this.handle();
  }

  handle = () => {
    const { infra } = this.context.store.getState();

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
    },
    apiKey: (args: { name: string; apiId: string }) => {
      const { name } = args;
      this.res.ApiKey = new CfnApiKey(this, name, args);
    },
    logger: () => {
      this.res.LoggerRole = new Role(this, "ApiLogsRole", {
        assumedBy: new ServicePrincipal("appsync"),
      });
      this.res.LoggerRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppSyncPushToCloudWatchLogs"
        )
      );
    },
    schema: (args: { apiId: string; definition: string }) => {
      this.res.Schema = new CfnGraphQLSchema(this, "Schema", args);
    },
    tableDataSource: (args: {
      apiId: string;
      name: string;
      tableName: string;
      serviceRoleArn: string;
    }) => {
      const { apiId, name, tableName, serviceRoleArn } = args;
      this.res.DataSource = new CfnDataSource(this, "TestDataSource", {
        apiId,
        name,
        type: "AMAZON_DYNAMODB",
        dynamoDbConfig: { tableName, awsRegion: this.region },
        serviceRoleArn,
      });
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
      this.res.TableRole = new Role(this, "TableRole", {
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
            const header = TemplateHeader.attribute("typename")
              .is(args.entityName)
              .attribute("interface")
              .is(args.interfaceName)
              .attribute("id")
              .is("$util.autoId()")
              .renderTemplate();
            const base = MappingTemplate.dynamoDbPutItem(
              new PrimaryKey(
                new Assign("PK", '"Interface#$extra.interface"'),
                new Assign("SK", '"$extra.typename#$extra.id"')
              ),
              Values.projecting()
                .attribute("__typename")
                .is(args.entityName)
                .attribute("createdAt")
                .is("$util.time.nowISO8601()")
                .attribute("updatedAt")
                .is("$util.time.nowISO8601()")
                .attribute("id")
                .is("$extra.id")
            ).renderTemplate();
            return MappingTemplate.fromString([header, base].join("\n"));
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
