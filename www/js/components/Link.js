import { h } from '/static/js/hyperapp.js';
import { PushRoute } from '../actions/PushRoute.js';

export const Link = (location, element, props, content) => h(element, { ...props, onclick: [PushRoute, location] }, content);