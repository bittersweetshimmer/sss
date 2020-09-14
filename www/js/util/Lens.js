export const prop = (head, ...tail) => value => tail.length === 0 ? value[head] : prop(...tail)(value[head]);

export const assoc = (head, ...tail) => (object, value) => {
    if (tail.length != 0) {
        const inner_object = prop(head, ...tail.slice(0, -1))(object);

        if (Array.isArray(inner_object)) {
            const array = [...inner_object];
            array[tail[tail.length - 1]] = value;
            return assoc(head, ...tail.slice(0, -1))(object, array);
        }
        else return assoc(head, ...tail.slice(0, -1))(object, { ...inner_object, [tail[tail.length - 1]]: value });
    }
    else {
        if (Array.isArray(object)) {
            const array = [...object];
            array[head] = value;
            return array;
        }
        else return { ...object, [head]: value };
    }
};

export const from = (head, ...tail) => ({
    get: prop(head, ...tail),
    set: assoc(head, ...tail),
    modify: (object, fn) => assoc(head, ...tail)(object, fn(prop(head, ...tail)))
});
