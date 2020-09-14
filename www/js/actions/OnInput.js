import { Argument } from "./Argument.js";
import { Focus } from "./Focus.js";
import { Combine } from "./Combine.js";

export const OnInput = (...keys) => Combine(
    Argument(event => event.target.value),
    Focus(...keys)
)((previous, next) => next)