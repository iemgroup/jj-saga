# JJ Saga

Sing a song and run saga !

```
import { SagaBuilder } from 'jj-saga';

const builder = new SagaBuilder();

const workflow = builder
  .step('Inject initial context')
  .invoke(() => initialContext)

  .step('STEP 1 : should pass')
  .invoke((ctx) => {
    return { step1: true };
  })

  .step('STEP 2 : should pass with a condition')
  .condition((ctx) => true)
  .invoke((ctx) => {
    console.log('SHOULD APPEAR');
    return { step2: true };
  })

  .step('STEP 3 : should not pass because of a condition')
  .condition((ctx) => false)
  .invoke('INVOKE 3a', (ctx) => {
    console.log('SHOULD NOT APPEAR');
    return { step3a: false };
  })
  .invoke('INVOKE 3b', (ctx) => {
    console.log('SHOULD NOT APPEAR');
    return { step3b: false };
  })

  .step('STEP 4 : with many actions')
  .invoke('INVOKE 4a', (ctx) => {
    return { step4a: true };
  })
  .invoke('INVOKE 4b', (ctx) => {
    return { step4b: true };
  })
  .withCompensation((ctx) => {
    console.log('COMPENSATE STEP 4');
  })

  .step(
    'STEP 5 : with many actions but should not pass because of condition',
  )
  .condition(() => false)
  .invoke('INVOKE 5a', (ctx) => {
    console.log('SHOULD NOT APPEAR');
    return { step5a: false };
  })
  .invoke('INVOKE 5b', (ctx) => {
    console.log('SHOULD NOT APPEAR');
    return { step5b: false };
  })

  .step('STEP 6 : with many actions and conditions')
  .invoke('INVOKE 6a', (ctx) => {
    return { step6a: true };
  })
  .invoke({
    name: 'STEP 6b',
    condition: () => true,
    action: (ctx) => {
      console.log('SHOULD APPEAR');
      return { step6b: true };
    },
  })
  .invoke('INVOKE 6c', {
    condition: () => false,
    action: (ctx) => {
      console.log('SHOULD NOT APPEAR');
      return { step6c: false };
    },
    withCompensation: (ctx) => {
      console.log('COMPENSATE STEP 6C');
    },
  })
  .invoke('INVOKE 6d', {
    condition: () => true,
    action: (ctx) => {
      return { step6c: false };
    },
    withCompensation: async (ctx) => {
      console.log('Start compensate 6D');
      const test = await new Promise((resolve) => {
        setTimeout(() => {
          console.log('COMPENSATE STEP 6D');
          resolve(ctx);
        }, 1000);
      });
      console.log('Start compensate 6D');
      return test;
    },
  })

  .step('STEP FINAL')
  .invoke((ctx) => {
    return { final: true };
  })

  .build();

  const processor = new SagaProcessor(workflow);
  const response = await processor.start();
```
