import { Compensation, Condition, Invoke } from "./types/invoke.type";
import { SagaStep } from "./types/saga-step.type";
import { Workflow } from "./types/workflow.type";

export class SagaBuilder {
  index: number | null = null;
  steps: Workflow = [];

  // --------------------
  // Describe a new step
  // --------------------
  step(name: string): SagaBuilder {
    this.index = this.index === null ? 0 : this.index + 1;

    const step: SagaStep = {
      name,
      condition: null,
      invokes: [],
      withCompensation: null,
    };

    this.steps = [...this.steps, step];
    return this;
  }

  // --------------------
  // Stack a function to execute for this workflow
  // --------------------
  invoke(name: string | Invoke, fn?: Invoke): SagaBuilder {
    const realFn = typeof name === "string" ? fn : name;
    const realName = typeof name === "string" ? name : `Anonymous invoke`;

    const step = this.steps[this.index];

    // Transform function into InvokeAction
    if (typeof realFn === "function") {
      step.invokes.push({
        name: realName,
        condition: null,
        action: realFn,
        withCompensation: null,
      });
    } else {
      step.invokes.push(realFn);
    }

    return this;
  }

  // --------------------
  // Add a condition to step execution
  // --------------------
  condition(fn: Condition): SagaBuilder {
    const step = this.steps[this.index];
    step.condition = fn;
    return this;
  }

  // --------------------
  // Add a compensate function to execute if an error occured into step
  // --------------------
  withCompensation(fn: Compensation): SagaBuilder {
    const step = this.steps[this.index];
    step.withCompensation = fn;
    return this;
  }

  // --------------------
  // Return workflow steps
  // --------------------
  build(): Workflow {
    return this.steps;
  }
}
