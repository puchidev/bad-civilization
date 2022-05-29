import type { MaybePromise } from '../../models';
import { DELAY_BEFORE_COUNT, DELAY_BETWEEN_COUNT } from './config';

interface CountdownOptions {
  onCount: (currentCount: number) => MaybePromise<unknown>;
  onEnd: () => MaybePromise<unknown>;
}

/**
 * Counts down to zero and invoke callback on each tick.
 * @param currentCount current value of countdown
 * @param options additional parameters
 * @param options.onCount function to invoke on each count
 * @param options.onEnd function to invoke on end of countdown
 */
function countdown(currentCount: number, options: CountdownOptions) {
  options.onCount(currentCount);

  if (currentCount === 0) {
    options.onEnd();
    return;
  }

  setTimeout(() => {
    countdown(currentCount - 1, options);
  }, DELAY_BETWEEN_COUNT);
}

/**
 * Starts countdown ticks.
 * @param currentCount current value of countdown
 * @param options additional parameters
 */
function startCountdown(currentCount: number, options: CountdownOptions) {
  setTimeout(() => {
    countdown(currentCount, options);
  }, DELAY_BEFORE_COUNT);
}

export { startCountdown };
