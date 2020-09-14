import * as api from '../api.js';
import { Effect, Perform } from './Effect.js';
import { Timeout } from './Timeout.js';
import { None } from '../enum/None.js';
import { make_tagged, Value } from '../enum/Tagged.js';
import { Session } from '../enum/Session.js';

export const RefreshTokenError = (state, error) => ({
    ...state,
    session: make_tagged(None)
});

export const RefreshTokenSuccess = (state, session) => ({
    ...state,
    session: make_tagged(Session.Ready, { ...state.session[Value], ...session })
});

export const RefreshTokenEffect = Effect(async (dispatch) => {
    try {
        const response = await api.refresh();

        if (response.status === 'ok') {
            const next = response.session.expires - (60 * 1000);
            console.info('Refresh token success, next refresh: ', new Date(next));
            dispatch(RefreshTokenSuccess, response.session);
            dispatch(Timeout(RefreshToken), next - Date.now());
        }
        else {
            console.warn('Refresh token error: ', response.error);
            dispatch(RefreshTokenError, response.error);
        }
    }
    catch (error) {
        console.warn('Refresh token error: ', error);
        dispatch(RefreshTokenError, error);
    }
});

export const RefreshToken = Perform(RefreshTokenEffect);