import * as Lens from '../util/Lens.js';

export const Focus = (...keys) => action => (state, argument) => {
    const lens = Lens.from(...keys); 

    return lens.set(state, action(lens.get(state), argument));
};