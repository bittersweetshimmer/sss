import { h, app, text } from '/static/js/hyperapp.js';
import { AuthenticateEffect } from './actions/Authenticate.js';
import { Session } from './enum/Session.js';
import { make_tagged, match, when, Default, Value, Tag } from './enum/Tagged.js';
import { HistorySubscription } from './subscriptions/History.js';
import { Route } from './enum/Route.js';
import { ChangeRoute } from './actions/PushRoute.js';
import { Dispatch } from './actions/Dispatch.js';
import { Room } from './enum/Room.js';
import { Loading, LoadingBig } from './components/Loading.js';
import { Link } from './components/Link.js';
import { LogOut } from './actions/LogOut.js';
import { LogIn } from './actions/LogIn.js';
import { Some } from './enum/Some.js';
import { None } from './enum/None.js';
import { Register } from './actions/Register.js';
import { WebSocketSubscription } from './subscriptions/WebSocket.js';
import { WebSocketSendEffect } from './actions/WebSocketSend.js';
import { PushChatMessage } from './actions/PushChatMessage.js';
import { Message } from './enum/Message.js';
import { OnInput } from './actions/OnInput.js';
import { Focus } from './actions/Focus.js';
import { Perform } from './actions/Effect.js';

app({
    init: [
        {
            title: 'Tuba',
            session: make_tagged(Session.Authenticating),
            route: make_tagged(Route.Unknown)
        },
        AuthenticateEffect(),
        Dispatch(ChangeRoute)(document.location.pathname)
    ],
    view: state => {
        console.debug('View:', state);

        return h('div', { id: 'app' }, [
            h('header', {}, [
                h('div', { id: 'title' }, Link('/', 'a', {}, text(state.title))),
                h('nav', {}, [
                    Link('/rooms', 'button', {}, text('Public rooms'))
                ]),
                h('div', {}, match({
                    [Session.Ready]: session_ready => [
                        h('button', { onclick: LogOut }, text('Log out')),
                        Link('/account', 'button', {}, text('Account')),
                        h('div', { id: 'logged-in-as' }, [
                            h('div', {}, text('Logged in as')),
                            h('div', { className: 'username' }, text(session_ready.user.username))
                        ]),
                        h('img', { className: 'avatar', src: session_ready.user.avatar_url })
                    ],
                    [Session.Authenticating]: () => [
                        h('div', {}, text('Authenticating...')),
                        Loading()
                    ],
                    [Default]: () => [
                        Link('/login', 'button', {}, text('Log in')),
                        Link('/register', 'button', {}, text('Register'))
                    ]
                })(state.session))
            ]),   
            match({
                [Route.Home]: () => h('main', {}, [
                    h('form', {}, [
                        h('label', { for: 'username' }, text('Room')),
                        h('input', { type: 'text', name: 'name', placeholder: 'gaynigga' }),

                        h('label', { for: 'password' }, text('Password')),
                        h('input', { type: 'password', name: 'password', placeholder: 'hunter2' }),

                        h('input', { type: 'submit', value: 'Join' }),
                        when(Session.Ready)(session_ready => h('input', { type: 'submit', value: 'Create' }))(state.session),
                    ])
                ]),
                [Route.LogIn]: route_login => match({
                    [Session.Ready]: session_ready => h('main', {}, h('h3', {}, [
                        text(`Logged in as: `),
                        h('span', { className: 'username' }, text(session_ready.user.username))
                    ])),
                    [Session.Authenticating]: () => h('main', {}, [
                        LoadingBig(),
                        h('h3', {}, text('Authenticating...'))
                    ]),
                    [None]: () => h('main', {}, [
                        when(Some)(error => h('div', { className: 'form-error' }, text(error)))(route_login.error),
                        h('form', { onsubmit: LogIn }, [
                            h('label', { for: 'username' }, text('Username')),
                            h('input', {
                                value: route_login.username,
                                type: 'text', name: 'username', placeholder: 'AzureDiamond',
                                pattern: '[a-zA-Z0-9_]+', required: true, minlength: 3, maxlength: 16,
                                oninput: OnInput('route', Value, 'username')
                            }),
    
                            h('label', { for: 'password' }, text('Password')),
                            h('input', {
                                value: route_login.password,
                                type: 'password', name: 'password', placeholder: 'hunter2',
                                required: true, minlength: 1,
                                oninput: OnInput('route', Value, 'password')
                            }),
    
                            h('input', { type: 'submit', value: 'Log in' })
                        ])
                    ])
                })(state.session),
                [Route.Register]: route_register => match({
                    [Session.Ready]: session_ready => h('main', {}, h('h3', {}, [
                        text(`Account registered: `),
                        h('span', { className: 'username' }, text(session_ready.user.username))
                    ])),
                    [Session.Authenticating]: () => h('main', {}, [
                        LoadingBig(),
                        h('h3', {}, text('Authenticating...'))
                    ]),
                    [None]: () => h('main', {}, [
                        when(Some)(error => h('div', { className: 'form-error' }, text(error)))(route_register.error),
                        h('form', { onsubmit: Register }, [
                            h('label', { for: 'username' }, text('Username')),
                            h('input', {
                                value: route_register.username,
                                type: 'text', name: 'username', placeholder: 'AzureDiamond',
                                pattern: '[a-zA-Z0-9_]+', required: true, minlength: 3, maxlength: 16,
                                oninput: OnInput('route', Value, 'username')
                            }),
    
                            h('label', { for: 'password' }, text('Password')),
                            h('input', {
                                value: route_register.password,
                                type: 'password', name: 'password', placeholder: 'hunter2',
                                required: true, minlength: 1,
                                oninput: OnInput('route', Value, 'password')
                            }),
    
                            h('input', { type: 'submit', value: 'Register' })
                        ])
                    ])
                })(state.session),
                [Route.Account]: () => match({
                    [Session.Ready]: session_ready => h('main', {}, [
                        h('img', { className: 'avatar-big', src: session_ready.user.avatar_url }),
                        h('h3', { className: 'username' }, text(session_ready.user.username)),
                        h('form', { onsubmit: (state, event) => { event.preventDefault(); return state; } }, [
                            h('label', { for: 'avatar_url' }, text('Avatar URL')),
                            h('input', { type: 'url', name: 'avatar_url', placeholder: '', value: session_ready.user.avatar_url }),
                            h('input', { type: 'submit', value: 'Save'})
                        ])
                    ]),
                    [Session.Authenticating]: () => h('main', {}, [
                        LoadingBig(),
                        h('h3', {}, text('Authenticating...'))
                    ]),
                    [None]: () => h('main', {}, [
                        h('h3', {}, text('You are not logged in.')),
                        Link('/login', 'a', {}, text('Log in'))
                    ])
                })(state.session),
                [Route.Rooms]: () => h('main', { className: 'main-rooms' }, [
                    LoadingBig()
                ]),
                [Route.Room]: route_room => match({
                    [Room.Ready]: room => h('main', { className: 'main-room-ready' }, [
                        h('div', { id: 'video' }, [
                            h('div', { id: 'video-header' }, text(`Room ${room.name} (${room.owner}): ${room.description}`)),
                            h('div', { id: 'player-container' }, h('iframe', { id: 'player' })),
                            h('div', { id: 'video-controls' })
                        ]),
                        h('div', { id: 'chat' }, [
                            h('div', { id: 'messages' }, room.messages.reduce((blocks, message) => {
                                const next_block = () => {
                                    blocks.push(match({
                                        [Message.User]: ({ user, message, timestamp }) => make_tagged(Message.User, {
                                            user,
                                            timestamp,
                                            group: [[message, timestamp]]
                                        }),
                                        [Message.System]: ({ message, timestamp }) => make_tagged(Message.System, {
                                            timestamp,
                                            group: [[message, timestamp]]
                                        })
                                    })(message));

                                    return blocks;
                                };

                                if (blocks.length === 0) return next_block();
                                else {
                                    const last_block = blocks[blocks.length - 1];

                                    const is_tag = tag => (last_block[Tag] === tag && message[Tag] === tag);
                                    const is_same_username = last_block[Value]?.user?.username === message[Value]?.user?.username;
                                    const is_time_diff_less_than = diff => message[Value].timestamp - last_block[Value].timestamp < diff;

                                    const is_matching_user_block = is_tag(Message.User) && is_same_username && is_time_diff_less_than(5 * 60 * 1000);
                                    const is_matching_system_block = is_tag(Message.System);

                                    if (is_matching_user_block || is_matching_system_block) {
                                        last_block[Value].group.push([message[Value].message, message[Value].timestamp]);
                                        return blocks;
                                    }
                                    else return next_block();
                                }
                            }, []).map(block => match({
                                [Message.User]: ({user, timestamp, group}) => h('div', {
                                        className: `message-block message-user ${user.username === state.session[Value]?.user?.username ? 'message-self' : ''}`
                                    },
                                    [
                                        h('img', { className: 'avatar', src: user.avatar_url }),
                                        h('div', { className: 'message-group' }, [
                                            h('div', { className: 'message-group-header' }, [
                                                h('div', { className: 'username' }, text(user.username)),
                                                h('div', { className: 'message-time' }, text(new Date(timestamp).toLocaleTimeString()))
                                            ]),
                                            ...group.map(([message, timestamp]) => h('div', { className: 'message', title: new Date(timestamp).toLocaleTimeString(), }, text(message)))
                                        ])
                                    ]
                                ),
                                [Message.System]: ({timestamp, group}) => h('div', { className: 'message-block message-system' }, [
                                    h('div', { className: 'message-group' }, [
                                        ...group.map(([message, timestamp]) => h('div', { className: 'message', title: new Date(timestamp).toLocaleTimeString() }, text(message)))
                                    ])
                                ])
                            })(block))),
                            h('input', {
                                value: room.message_input,
                                type: 'text',
                                oninput: OnInput('route', Value, 'room', Value, 'message_input'),
                                onkeydown: (state, event) => event.which === 13 ? [
                                    Focus('route', Value, 'room', Value, 'message_input')(() => '')(state, event),
                                    WebSocketSendEffect({
                                        websocket: room.websocket,
                                        access_token: state?.session?.[Value]?.access_token,
                                        type: 'chat_message',
                                        payload: { message: room.message_input }
                                    }),
                                 ] : state
                            })
                        ]),
                        h('div', { id: 'userlist' }, [])
                    ]),
                    [Room.Fetching]: _ => h('main', {}, [
                        LoadingBig()
                    ]),
                    [Room.Error]: error => h('main', {}, [
                        h('h3', {}, text('Error')),
                        h('p', {}, text(error))
                    ]),
                })(route_room.room),
                [Route.Unknown]: () => h('main', {}, [
                    h('h2', {}, text('You\'ve met with a terrible fate, haven\'t you?'))
                ])
            })(state.route),
            h('footer', {}, text('Footer'))
        ]);
    },
    subscriptions: state => [
        [HistorySubscription, ChangeRoute],
        state?.route?.[Value]?.room?.[Value]?.websocket && [WebSocketSubscription, {
            OnOpen: (state, event) => [
                PushChatMessage(state, make_tagged(Message.System, { message: 'WebSocket connection opened.', timestamp: Date.now() })),
                WebSocketSendEffect({ 
                    websocket: state?.route?.[Value]?.room?.[Value]?.websocket,
                    access_token: state?.session?.[Value]?.access_token,
                    type: 'join_room',
                    payload: { name: state?.route?.[Value]?.room?.[Value]?.name }
                })
            ],
            OnMessage: (state, message) => {
                try {
                    const json = JSON.parse(message.data);

                    if (json.type === 'join_room' && json.payload.status === 'ok') {
                        return PushChatMessage(state, make_tagged(Message.System, { message: `Joined room.`, timestamp: Date.now() }));
                    }
                    else if (json.type === 'chat_message') {
                        return PushChatMessage(state, make_tagged(Message.User, json.payload)); 
                    }
                }
                catch (error) {
                    console.warn('websocket invalid message error:', error);

                    return PushChatMessage(state, make_tagged(Mess0age.System, { message: `Received an invalid websocket message.`, timestamp: Date.now() }));
                }
            },
            OnError: (state) => PushChatMessage(state, make_tagged(Message.System, { message: `WebSocket error.`, timestamp: Date.now() })),
            OnClose: (state) => PushChatMessage(state, make_tagged(Message.System, { message: 'WebSocket connection closed.', timestamp: Date.now() })),
            websocket: state?.route?.[Value]?.room?.[Value]?.websocket
        }]
    ],
    node: document.getElementById('app'),
    middleware: dispatch => (...args) => {
        console.debug('Dispatch:', args[0]);

        return dispatch(...args);
    }
})