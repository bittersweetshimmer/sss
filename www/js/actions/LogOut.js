import * as api from '../api.js';
import { Session } from '../enum/Session.js';
import { Effect } from './Effect.js';
import { make_tagged, Value } from '../enum/Tagged.js';
import { None } from '../enum/None.js';

export const LogOutError = (state, error) => ({
    ...state,
    session: make_tagged(None)
});

export const LogOutSuccess = (state) => ({
    ...state,
    session: make_tagged(None)
});

export const LogOutEffect = Effect(async (dispatch, access_token) => {
    try {
        const response = await api.log_out(access_token);
        
        if (response.status === 'ok') dispatch(LogOutSuccess);
        else {
            console.warn(`Log out error: `, response.error);
            dispatch(LogOutError, response.error);
        }
    }
    catch (error) {
        console.warn(`Log out error: `, error);
        dispatch(LogOutError, error);
    }
});

export const LogOut = (state, event) => {
    event.preventDefault();

    return [
        state,
        LogOutEffect(state.session[Value].access_token)
    ];
};