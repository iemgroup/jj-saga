import { Compensation, Condition, InvokeAction } from './invoke.type';

export type SagaStep = {
  name: string;
  condition: Condition;
  invokes: InvokeAction[];
  withCompensation: Compensation;
};
