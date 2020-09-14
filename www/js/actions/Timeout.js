import { Effect, Perform } from "./Effect.js";

export const TimeoutEffect = action => Effect(async (dispatch, delay) => {
    setTimeout(() => dispatch(action), delay);
});

export const Timeout = action => Perform(TimeoutEffect(action));