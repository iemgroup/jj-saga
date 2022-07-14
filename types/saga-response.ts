export class SagaResponse<ContextType> {
  state: 'success' | 'failed';
  context: ContextType;
  history: any[];
  errors: string[];
}
