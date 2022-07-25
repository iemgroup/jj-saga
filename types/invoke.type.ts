export type Fn<T> = (context: any) => T;
export type Condition = Fn<boolean>;
export type Compensation = Fn<void>;

export type InvokeAction = {
  name?: string;
  validate?: any;
  condition?: Condition;
  action: Fn<any>;
  withCompensation?: Compensation;
};

export type Invoke = Fn<any> | InvokeAction;
