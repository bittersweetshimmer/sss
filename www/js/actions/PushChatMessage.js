import { Focus } from "./Focus.js";
import { Value } from "../enum/Tagged.js";

export const PushChatMessage = Focus('route', Value, 'room', Value, 'messages')((previous, next) => [...previous, next]);