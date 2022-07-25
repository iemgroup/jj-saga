import { Compensation, Condition, InvokeAction } from "./invoke.type";

export type SagaStep = {
  name: string;
  validate: any;
  condition: Condition;
  invokes: InvokeAction[];
  withCompensation: Compensation;
};
