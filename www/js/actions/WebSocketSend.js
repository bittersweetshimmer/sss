import { Effect, Perform } from "./Effect.js";

export const WebSocketSendEffect = Effect(async (dispatch, { websocket, access_token, type, payload }) => {
    websocket.send(JSON.stringify({ type, payload, access_token }));
});

export const WebSocketSend = Perform(WebSocketSendEffect);