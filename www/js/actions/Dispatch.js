import { Effect } from "./Effect.js";

export const Dispatch = action => Effect(async (dispatch, argument) => dispatch(action, argument));