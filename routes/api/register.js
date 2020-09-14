import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default (db, session_config) => async (request, response) => {
    const username = request.body.username;
    const password = request.body.password;

    console.log(`/register: ${username}:${password}`);

    try {
        if (!username.split('').every(character => {
            const code = character.charCodeAt(0);

            if (!(code > 47 && code < 58) && // numeric (0-9)
                !(code > 64 && code < 91) && // upper alpha (A-Z)
                !(code > 96 && code < 123) && // lower alpha (a-z)
                !(character === '_')) { // underscore
              return false;
            }

            return true;
        })) { throw { error: 'username can\'t contain characters other than 0-9/a-z/A-Z/_' }; };
        if (username.length < 3) { throw { error: 'username must consists of at least 3 characters' }; };
        if (password.length == 0) { throw { error: 'password can\'t be empty' }; };

        const salt = await bcrypt.genSalt().catch(_ => { throw { error: 'internal error' }; });
        const password_hash = await bcrypt.hash(password, salt).catch(_ => { throw { error: 'internal error' }; });

        const users_in_db = await db('users').where({ username }).catch(_ => { throw { error: 'database error' }; });
        if (users_in_db.length != 0) { throw { error: 'username already exists' }; }

        const id = await db('users').insert({ username, password_hash }).then(row => row[0]).catch(_ => { throw { error: 'database error' }; });

        const access_token = jwt.sign({ username }, session_config.access_token.secret, { expiresIn: session_config.access_token.expires_in });
        const access_token_expires = new Date(Date.now() + session_config.access_token.expires_in);

        const refresh_token = jwt.sign({ username }, session_config.refresh_token.secret, { expiresIn: session_config.refresh_token.expires_in });
        const refresh_token_expires = new Date(Date.now() + session_config.refresh_token.expires_in);

        await db('tokens').insert({ token: refresh_token, expires_at: refresh_token_expires, user_id: id }).catch(_ => { throw { error: 'database error' }; });

        response.status(200);
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true,
            expires: refresh_token_expires
        });
        response.send({
            status: 'ok',
            session: {
                access_token,
                expires: access_token_expires.getTime(),
                user: {
                    username: username,
                    avatar_url: ''
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        response.status(400)
        response.send({ status: 'error', ...error });
    }
}