export const Enum = (...args) => Object.freeze(args.reduce((acc, value) => {
    acc[value] = Symbol(value);
    return acc;
}, {}));