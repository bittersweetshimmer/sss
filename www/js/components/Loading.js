import { h } from '/static/js/hyperapp.js';

export const Loading = () => h('div', { className: 'loading' }, [
    h('div', {}),
    h('div', {}),
    h('div', {})
]);

export const LoadingBig = () => h('div', { className: 'loading-big' }, [
    h('div', {}),
    h('div', {}),
    h('div', {})
]);