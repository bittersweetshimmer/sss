import { None } from "./enum/None.js";
import { make_tagged } from "./enum/Tagged.js";
import { Some } from "./enum/Some.js";

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

export const Router = routes => location => {
    for (const [pattern, route_tag] of Object.entries(routes)) {
        const maybe_parameters = parse_route(pattern, location);

        if (is_tag(Some)(maybe_parameters)) {
            return make_tagged(route_tag, maybe_parameters.value);
        }
    }

    return make_tagged(None);
};