export const Effect = effect => args => [effect, args];
export const Perform = effect => (state, argument) => [state, effect(argument)];