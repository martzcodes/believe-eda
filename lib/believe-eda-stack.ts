import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Match } from "aws-cdk-lib/aws-events";
import { EventLog } from "./event-log";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, ObjectOwnership, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { AwsLogsComptroller } from "./log-comptroller/log-comptroller";

export class BelieveEdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new EventLog(this, "eventLog", {
      logGroupName: "/believe-in-serverless/events",
      eventPattern: {
        source: Match.prefix("aws."),
        detailType: Match.anythingBut("AWS API Call via CloudTrail"),
      },
    });

    new EventLog(this, "s3Log", {
      logGroupName: "/believe-in-serverless/s3-events",
      eventPattern: {
        source: ["aws.s3"],
      },
    });

    new TableV2(this, "table", {
      partitionKey: { name: "id", type: AttributeType.STRING },
    });

    new Bucket(this, "bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      eventBridgeEnabled: true,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    new AwsLogsComptroller(this, "logs-comptroller", {
      eventPattern: {
        source: ["aws.cloudformation"],
        detailType: ["CloudFormation Stack Status Change"],
        detail: {
          "status-details": {
            status: [
              // "CREATE_COMPLETE", // wouldn't have orphaned/created new loggroups to clean up
              "CREATE_FAILED",
              "DELETE_COMPLETE",
              "DELETE_FAILED",
              // "IMPORT_COMPLETE", // wouldn't have orphaned/created new loggroups to clean up
              // "IMPORT_ROLLBACK_COMPLETE", // wouldn't have orphaned/created new loggroups to clean up
              // "IMPORT_ROLLBACK_FAILED", // wouldn't have orphaned/created new loggroups to clean up
              "ROLLBACK_COMPLETE",
              "ROLLBACK_FAILED",
              "UPDATE_COMPLETE",
              "UPDATE_FAILED",
              "UPDATE_ROLLBACK_COMPLETE",
              "UPDATE_ROLLBACK_FAILED",
            ],
          },
        },
      },
    });
  }
}
