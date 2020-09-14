import * as api from '../api.js';
import { Effect, Perform } from './Effect.js';
import { RefreshToken } from './RefreshToken.js';
import { Timeout } from './Timeout.js';
import { make_tagged } from '../enum/Tagged.js';
import { None } from '../enum/None.js';
import { Session } from '../enum/Session.js';

export const AuthenticateError = (state, error) => ({
    ...state,
    session: make_tagged(None)
});

export const AuthenticateSuccess = (state, session) => ({
    ...state,
    session: make_tagged(Session.Ready, session)
});

export const AuthenticateEffect = Effect(async (dispatch) => {
    try {
        const response = await api.authenticate();

        if (response.status === 'ok') {
            dispatch(AuthenticateSuccess, response.session);
            dispatch(Timeout(RefreshToken), response.session.expires - (60 * 1000) - Date.now());
        }
        else {
            console.warn('Authentication error: ', response.error);
            dispatch(AuthenticateError, response.error);
        }
    }
    catch (error) {
        console.warn('Authentication error: ', error);
        dispatch(AuthenticateError, error);
    }
});

export const Authenticate = Perform(AuthenticateEffect);