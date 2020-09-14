import * as api from '../api.js';

import { Session } from '../enum/Session.js';
import { Effect } from './Effect.js';
import { make_tagged, Value } from '../enum/Tagged.js';
import { Some } from '../enum/Some.js';
import { None } from '../enum/None.js';
import { Route } from '../enum/Route.js';

export const LogInError = (state, error) => ({
    ...state,
    session: make_tagged(None),
    route: make_tagged(Route.LogIn, {
        ...state.route[Value],
        error: make_tagged(Some, error)
    })
});

export const LogInSuccess = (state, session) => ({
    ...state,
    session: make_tagged(Session.Ready, session),
    route: make_tagged(Route.LogIn, {
        username: '',
        password: '',
        error: make_tagged(None)
    })
});

export const LogInEffect = Effect(async (dispatch, { username, password }) => {
    try {
        const response = await api.log_in(username, password);
        
        if (response.status === 'ok') dispatch(LogInSuccess, response.session);
        else {
            console.warn(`Log in error (username: ${username}): `, response.error);
            dispatch(LogInError, response.error);
        }
    }
    catch (error) {
        console.warn(`Log in error (username: ${username}): `, error);
        dispatch(LogInError, error);
    }
});

export const LogIn = (state, event) => {
    event.preventDefault();

    const route_login = state.route[Value];

    return [
        { ...state, session: make_tagged(Session.Authenticating) },
        LogInEffect({
            username: route_login.username,
            password: route_login.password
        })
    ];
};