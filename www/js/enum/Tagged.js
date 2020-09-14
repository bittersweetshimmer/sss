import { None } from './None.js';

export const Value = Symbol('Value');
export const Tag = Symbol('Tag');

export const Default = Symbol('Default');

export const make_tagged = (tag, value) => value === undefined ? ({ [Tag]: tag }) : ({ [Tag]: tag, [Value]: value });

export const map = fn => value => {
    return {
        [Value]: fn(value[Value]),
        [Tag]: value[Tag]
    };
};

export const when = tag => (fn, otherwise = _ => undefined) => value => {
    if (value[Tag] === tag) {
        return fn(value[Value]);
    }
    else {
        return otherwise(value[Value]);
    }
};

export const when_not = tag => (fn, otherwise = _ => undefined) => value => {
    if (value[Tag] !== tag) {
        return fn(value[Value]);
    }
    else {
        return otherwise(value[Value]);
    }
};

export const match = mapping => value => {
    if (mapping[value[Tag]] !== undefined) {
        return mapping[value[Tag]](value[Value]);
    }
    else if (mapping[Default] !== undefined) {
        return mapping[Default](value[Value]);
    }
    else {
        return undefined;
    }
};