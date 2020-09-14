import { HistoryPushStateEffect } from "./HistoryPushState.js";
import { Route } from "../enum/Route.js";
import { make_tagged, Value, Tag } from "../enum/Tagged.js";
import { None } from "../enum/None.js";
import { Some } from "../enum/Some.js";
import { Room } from "../enum/Room.js";
import { JoinRoomEffect } from "./JoinRoom.js";

const parse_route = (pattern, location) => {
    const parameters = {};

    for (let pattern_index = 0, location_index = 0; location_index < location.length; ++pattern_index, ++location_index) {
        const pattern_character = pattern[pattern_index];
        const location_character = location[location_index];

        if (pattern_character == ':') {
            let parameter_name = '';
            let parameter_value = ''; 

            for (const parameter_name_character of Array.from(pattern.substr(pattern_index + 1))) {
                if (parameter_name_character === '/') break;
                parameter_name += parameter_name_character;
            }

            if (parameter_name.length === 0) return make_tagged(None);

            for (const parameter_value_character of Array.from(location.substr(location_index))) {
                if (parameter_value_character === '/') break;
                parameter_value += parameter_value_character;
            }

            if (parameter_value.length === 0) return make_tagged(None);

            pattern_index += 1 + parameter_name.length;
            location_index += parameter_value.length;

            parameters[parameter_name] = parameter_value;
        }
        else if (pattern_character !== location_character) {
            return make_tagged(None);
        }
    }

    return make_tagged(Some, parameters);
};

const make_router = (routes, fallback) => (state, location) => {
    for (const [pattern, route] of Object.entries(routes)) {
        const maybe_parameters = parse_route(pattern, location);

        if (maybe_parameters[Tag] === Some) {
            return route(state, maybe_parameters[Value]);
        }
    }

    console.warn(`Route for location "${location}" not found.`);
    return fallback(state);
};

const router = make_router({
    '/': (state) => ({ ...state, route: make_tagged(Route.Home) }),
    '/rooms': (state) => ({ ...state, route: make_tagged(Route.Rooms) }),
    '/login': (state) => ({ ...state, route: make_tagged(Route.LogIn, {
        username: '',
        password: '',
        error: make_tagged(None)
    }) }),
    '/register': (state) => ({ ...state, route: make_tagged(Route.Register, {
        username: '',
        password: '',
        error: make_tagged(None)
    }) }),
    '/account': (state) => ({ ...state, route: make_tagged(Route.Account) }),
    '/r/:room_name': (state, parameters) => [
        { ...state, route: make_tagged(Route.Room, { name: parameters.room_name, room: make_tagged(Room.Fetching) }) },
        JoinRoomEffect(parameters.room_name)
    ],
}, (state) => [{ ...state, route: make_tagged(Route.Unknown) }]);

export const ChangeRoute = router;

export const PushRoute = (state, location) => [
    router(state, location),
    HistoryPushStateEffect({ state: {}, title: '', location })
];