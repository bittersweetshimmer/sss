import { Effect, Perform } from './Effect.js';

export const HistoryPushStateEffect = Effect(async (dispatch, { state, title, location }) => {
    history.pushState(state, title, location);
});

export const HistoryPushState = Perform(HistoryPushStateEffect);