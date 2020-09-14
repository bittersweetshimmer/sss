export const WebSocketSubscription = (dispatch, { OnMessage, OnError, OnClose, OnOpen, websocket }) => {
    websocket.onmessage = message => { dispatch(OnMessage, message); };
    websocket.onerror = message => { dispatch(OnError, message); };
    websocket.onclose = message => { dispatch(OnClose, message); };
    websocket.onopen = message => { dispatch(OnOpen, message); };

    return () => {
        websocket.onmessage = () => {};
        websocket.onerror = () => {};
        websocket.onclose = () => {};
        websocket.onopen = () => {};
    };
};