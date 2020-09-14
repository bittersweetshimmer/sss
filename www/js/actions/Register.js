import * as api from '../api.js';
import { Session } from '../enum/Session.js';
import { Effect } from './Effect.js';
import { make_tagged, Value } from '../enum/Tagged.js';
import { None } from '../enum/None.js';
import { Some } from '../enum/Some.js';
import { Route } from '../enum/Route.js';

export const RegisterError = (state, error) => ({
    ...state,
    session: make_tagged(None),
    route: make_tagged(Route.Register, {
        ...state.route[Value],
        error: make_tagged(Some, error)
    })
});

export const RegisterSuccess = (state, session) => ({
    ...state,
    session: make_tagged(Session.Ready, session),
    route: make_tagged(Route.Register, {
        username: '',
        password: '',
        error: make_tagged(None)
    })
});

export const RegisterEffect = Effect(async (dispatch, { username, password }) => {        
    try {
        const response = await api.register(username, password);
        
        if (response.status === 'ok') dispatch(RegisterSuccess, response.session);
        else {
            console.warn(response.error);
            dispatch(RegisterError, response.error);
        }
    }
    catch (error) {
        console.warn(error);
        dispatch(RegisterError, error);
    }
});

export const Register = (state, event) => {
    event.preventDefault();

    const route_register = state.route[Value];

    return [
        { ...state, session: make_tagged(Session.Authenticating) },
        RegisterEffect({
            username: route_register.username,
            password: route_register.password
        })
    ];
}