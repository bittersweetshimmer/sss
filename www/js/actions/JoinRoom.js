import * as api from '../api.js';
import { Effect, Perform } from './Effect.js';
import { make_tagged } from '../enum/Tagged.js';
import { Route } from '../enum/Route.js';
import { Room } from '../enum/Room.js';

export const JoinRoomError = (state, { name, error }) => ({
    ...state,
    route: make_tagged(Route.Room, { name, room: make_tagged(Room.Error, error) })
});

export const JoinRoomSuccess = (state, { name, room, websocket }) => ({
    ...state,
    route: make_tagged(Route.Room, { name, room: make_tagged(Room.Ready, { ...room, websocket, message_input: '', messages: [] }) })
});

export const JoinRoomEffect = Effect(async (dispatch, name) => {
    try {
        const response = await api.room(name);
        
        if (response.status === 'ok') {
            const websocket = new WebSocket(`wss://${document.location.host}`);
            
            dispatch(JoinRoomSuccess, { name, room: response.room, websocket });
        }
        else {
            console.warn(`Room "${name}" join error: `, response.error);
            dispatch(JoinRoomError, { name, error: response.error });
        }
    }
    catch (error) {
        console.warn(`Room "${name}" join error: `, error);
        dispatch(JoinRoomError, { name, error });
    }
});

export const JoinRoom = Perform(JoinRoomEffect);