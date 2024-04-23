import { EventBus, EventPattern, IEventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { getIteratorStateMachine } from './iterator-state-machine';

import { getRunner } from './runner-state-machine';
import { Duration } from 'aws-cdk-lib';

export interface AwsLogsComptrollerProps {
  readonly retentionDays?: RetentionDays
  eventPattern?: EventPattern;
}

export class AwsLogsComptroller extends Construct {
  constructor (scope: Construct, id: string, props: AwsLogsComptrollerProps) {
    super(scope, id);

    const { eventPattern, retentionDays } = props;

    const bus = EventBus.fromEventBusName(this, 'EventBus', 'default');

    const runner = getRunner(scope, retentionDays);
    const iterator = getIteratorStateMachine(scope, runner);
    bus.grantPutEventsTo(iterator);
    
    // trigger log comptroller on successful stack deployments
    new Rule(this, `ComptrollerRule`, {
      ...(eventPattern ? { eventPattern } : { schedule: Schedule.rate(Duration.days(7)), }),
      targets: [new SfnStateMachine(iterator)]
    });
  }
}