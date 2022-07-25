import { InvokeAction } from "./types/invoke.type";
import { SagaResponse } from "./types/saga-response";
import { Workflow } from "./types/workflow.type";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export class SagaProcessor<T> {
  private steps = [];
  private history = [];
  private ctx = {} as T;
  private currentStep = 0;
  private toCompensate = [];
  private errors: Error[] = [];
  private currentExecution = null;

  add(workflow: Workflow): SagaProcessor<T> {
    this.steps = [...this.steps, ...workflow];
    return this;
  }

  // --------------------
  // Start workflow execution
  // --------------------
  async start(): Promise<SagaResponse<T>> {
    await this.runStep();
    return this.formatResponse();
  }

  // --------------------
  // Run a step
  // --------------------
  private async runStep(): Promise<void> {
    // Get step to execute
    const currentStep = this.steps[this.currentStep];

    const { condition, validate, invokes, withCompensation } = currentStep;

    try {
      // If there is a condition, check it
      // If condition is true, run step
      if (this.checkCondition(condition)) {
        // If we execute this step, we inject compensation to the backward stack
        if (validate) await this.validate(validate);
        if (withCompensation) this.toCompensate.push(withCompensation);

        // Execute each invoke of this step (cascade)
        await invokes.reduce(
          (acc, curr) => acc.then(() => this.runInvoke(curr)),
          Promise.resolve()
        );
      }

      // Run next step
      await this.makeStepForward(this.currentStep + 1);
    } catch (err) {
      // An error occured, catch it
      this.errors.push(err);
      this.endLog("error");

      await this.compensate();
    }
  }

  // --------------------
  // Execute a function into a step
  // --------------------
  private async runInvoke(invoke: InvokeAction): Promise<void> {
    const { name, condition, action, withCompensation } = invoke;

    // If there is a condition, check it
    // If condition is wrong, jump invoke
    if (!this.checkCondition(condition)) return;

    // If we execute this step, we inject compensation to the backward stack
    if (withCompensation) this.toCompensate.push(withCompensation);

    // Recording state
    this.startLog(invoke.name);

    // Execute Invoke
    const response = await action(this.ctx);

    // Enrich context
    this.ctx = { ...this.ctx, ...response };

    // End recording
    this.endLog("success");
  }

  // --------------------
  // Validate data
  // --------------------
  async validate(dto) {
    if (!dto) return;
    // tranform the literal object to class object
    const objInstance: any = plainToInstance(dto, this.ctx);
    // validating and check the errors, throw the errors if exist
    const errors = await validate(objInstance);

    // errors is an array of validation errors
    if (errors.length > 0) {
      throw new Error(
        `Validation failed : ${errors.map(({ property }) => property)}`
      );
    }
  }

  // --------------------
  // Run a condition
  // --------------------
  checkCondition(condition) {
    if (!condition) return true;
    return condition({ ...this.ctx });
  }

  // --------------------
  // Run next step or handle workflow end
  // --------------------
  private async makeStepForward(index: number) {
    if (index >= this.steps.length) {
      return this.ctx;
    }

    this.currentStep = index;
    return this.runStep();
  }

  // --------------------
  // Start to compensate
  // --------------------
  private async compensate() {
    // Cascade compensation functions
    await this.toCompensate.reverse().reduce(
      async (acc, cur) =>
        acc
          .then(() => cur({ ...this.ctx }))
          .catch((err) => {
            this.errors.push(err);
            return;
          }),
      Promise.resolve()
    );
  }

  // --------------------
  // --------------------
  private async formatResponse(): Promise<SagaResponse<T>> {
    const hasErrors = this.errors.length > 0;

    return {
      state: hasErrors ? "failed" : "success",
      context: this.ctx,
      errors: this.errors.map((err) => err.message),
      history: this.history,
    };
  }

  startLog(name) {
    const currentStep = this.steps[this.currentStep];

    const execution = {
      step: this.currentStep,
      name: currentStep.name,
      invoke: name,
      startAt: new Date(),
      endAt: 0,
      state: "pending",
      context: { in: { ...this.ctx } },
    };

    this.currentExecution = execution;
  }

  endLog(state) {
    this.currentExecution.state = state;
    this.currentExecution.endAt = new Date();
    this.currentExecution.context.out = { ...this.ctx };
    this.history.push({ ...this.currentExecution });
  }
}
