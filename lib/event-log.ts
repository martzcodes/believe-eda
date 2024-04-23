import { RemovalPolicy } from "aws-cdk-lib";
import { EventPattern, Rule } from "aws-cdk-lib/aws-events";
import { CloudWatchLogGroup } from "aws-cdk-lib/aws-events-targets";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface EventLogProps {
  eventPattern: EventPattern;
  logGroupName: string;
}

export class EventLog extends Construct {
  constructor(scope: Construct, id: string, props: EventLogProps) {
    super(scope, id);

    const { eventPattern, logGroupName } = props;

    const eventObserver = new LogGroup(this, 'eventObserver', {
      logGroupName,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    new Rule(this, 'eventRule', {
      eventPattern,
      targets: [new CloudWatchLogGroup(eventObserver)],
    })
  }
}