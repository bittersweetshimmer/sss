import knex from 'knex';
import express from 'express';
import cookie_parser from 'cookie-parser';
import http from 'http';
import https from 'https';
import fs from 'fs';
import WebSocket from 'ws';
import path from 'path';
import jwt from 'jsonwebtoken';

import login from './routes/api/login.js';
import logout from './routes/api/logout.js';
import register from './routes/api/register.js';
import authenticate from './routes/api/authenticate.js';
import user from './routes/api/user.js';
import room from './routes/api/room.js';
import rooms from './routes/api/rooms.js';
import refresh from './routes/api/refresh.js';


const HTTP_PORT = 8000;
const HTTPS_PORT = 44800;

const __dirname = path.dirname(import.meta.url).replace(/^file:\/\//, '');

const session_config = Object.freeze({
    access_token: Object.freeze({
        secret: 'OOGA BOOGA',
        expires_in: 15 * 60 * 1000 
    }),
    refresh_token: Object.freeze({
        secret: 'foobar',
        expires_in: 30 * 24 * 60 * 60 * 1000
    })
});

const promisify = fn => (...args) => new Promise((resolve, reject) => fn(...args, (error, data) => error ? reject(error) : resolve(data)));
const read_file = promisify(fs.readFile);

(async () => {
    try {
        const key = await read_file('ssl/key.pem');
        const cert = await read_file('ssl/cert.pem');

        const app = express();
        const http_server = http.createServer((request, response) => {
            response.writeHead(301, { "Location": "https://" + request.headers['host'].replace(HTTP_PORT, HTTPS_PORT) + request.url });
            response.end();
        });
        const https_server = https.createServer({ key, cert }, app);

        const db = knex({
            client: 'sqlite3',
            connection: {
                filename: 'sqlite3.db'
            },
            useNullAsDefault: true
        });

        await db.raw('PRAGMA foreign_keys = ON');

        if (!await db.schema.hasTable('users')) {
            await db.schema.createTable('users', table => {
                table.increments('id').primary();

                table.string('username', 16).unique().notNullable();
                table.string('password_hash', 60).notNullable();
                table.string('avatar_url').notNullable().defaultTo('');
            });
        }

        if (!await db.schema.hasTable('tokens')) {
            await db.schema.createTable('tokens', table => {
                table.increments('id').primary();

                table.string('token').unique().notNullable();
                table.dateTime('expires_at').notNullable();
                table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('cascade');
            });
        }

        if (!await db.schema.hasTable('rooms')) {
            await db.schema.createTable('rooms', table => {
                table.increments('id').primary();

                table.string('name', 16).unique().notNullable();
                table.string('description', 64).notNullable().defaultTo('');
                table.integer('owner_id').unsigned().notNullable().references('id').inTable('users').onDelete('cascade');
            });
        }

        if (!await db.schema.hasTable('messages')) {
            await db.schema.createTable('messages', table => {
                table.increments('id').primary();

                table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('cascade');
                table.integer('room_id').unsigned().notNullable().references('id').inTable('rooms').onDelete('cascade');
            });
        }

        app.use('/static/', express.static('www'));
        app.use(cookie_parser());
        app.use(express.json());

        app.post('/api/login', login(db, session_config));
        app.post('/api/logout', logout(db, session_config));
        app.post('/api/register', register(db, session_config));
        app.post('/api/authenticate', authenticate(db, session_config));
        app.post('/api/refresh', refresh(db, session_config));

        app.get('/api/rooms/', rooms(db));
        app.get('/api/rooms/:name', room(db));
        app.get('/api/users/:username', user(db));

        app.get('*', (request, response) => {
            response.sendFile(path.join(__dirname + '/www/index.html'));
        });

        http_server.listen(HTTP_PORT);
        https_server.listen(HTTPS_PORT);

        const websocket_clients = {};

        const wss = new WebSocket.Server({ server: https_server });

        let client_id = 0;

        wss.on('connection', ws => {
            const this_id = client_id;
            websocket_clients[this_id] = { socket: ws };
            client_id += 1;
            
            ws.on('message', async message => {
                console.log('received: %s', message);

                try {
                    const request = JSON.parse(message);

                    if (request.access_token) {
                        try {
                            const verified = jwt.verify(request.access_token, session_config.access_token.secret);

                            if (!websocket_clients[this_id].user) {
                                const users_in_db = await db('users').where({ username: verified.username }).catch(_ => { throw { error: 'database error' }; });
                                if (users_in_db.length != 1) { throw { error: 'user does not exist' }; }

                                const user = users_in_db[0];

                                websocket_clients[this_id].user = {
                                    username: user.username,
                                    avatar_url: user.avatar_url
                                };
                            }
                        }
                        catch (error) {
                            console.warn('websocket error:', error);

                            delete websocket_clients[this_id].user;
                        }
                    }
                    else {
                        delete websocket_clients[this_id].user;
                    }

                    if (request.type === 'join_room') {
                        websocket_clients[this_id].room = request.payload.name;
                        websocket_clients[this_id].socket.send(JSON.stringify({
                            type: 'join_room',
                            payload: { status: 'ok' }
                        }));
                    }
                    else if (request.type === 'chat_message' && request.payload.message.length > 0) {
                        if (websocket_clients[this_id].room) {
                            for (const [id, client] of Object.entries(websocket_clients)) {
                                if (client.room === websocket_clients[this_id].room) {
                                    client.socket.send(JSON.stringify({
                                        type: 'chat_message',
                                        payload: {
                                            user: websocket_clients[this_id].user ?? {
                                                username: `Guest#${id}`
                                            },
                                            message: request.payload.message,
                                            timestamp: Date.now()
                                        }
                                    }));
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    console.warn(error);
                }
            });
        });
    }
    catch (error) {
        console.error(`error: ${error}`);
    }
})();