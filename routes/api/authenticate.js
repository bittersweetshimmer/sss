import jwt from 'jsonwebtoken';

export default (db, session_config) => async (request, response) => {
    const refresh_token_cookie = request.cookies.refresh_token;

    console.log(`/authenticate: ${request.cookies.refresh_token}`);

    try {
        if (!refresh_token_cookie) throw 'no refresh token';

        const verified = jwt.verify(refresh_token_cookie, session_config.refresh_token.secret);

        const refresh_token_in_db = await db('tokens').where({ token: refresh_token_cookie }).catch(_ => { throw { error: 'database error' }; });
        if (refresh_token_in_db.length != 1) { throw { error: 'invalid refresh token' }; }

        const users_in_db = await db('users').where({ username: verified.username }).catch(_ => { throw { error: 'database error' }; });
        if (users_in_db.length != 1) { throw { error: 'user does not exist' }; }

        const user = users_in_db[0];

        const access_token = jwt.sign({ username: verified.username }, session_config.access_token.secret, { expiresIn: session_config.access_token.expires_in });
        const access_token_expires = new Date(Date.now() + session_config.access_token.expires_in);

        const refresh_token = jwt.sign({ username: verified.username }, session_config.refresh_token.secret, { expiresIn: session_config.refresh_token.expires_in });
        const refresh_token_expires = new Date(Date.now() + session_config.refresh_token.expires_in);

        await db('tokens').where({ id: refresh_token_in_db[0].id }).del().catch(_ => { throw { error: 'database error' }; });
        await db('tokens').insert({ token: refresh_token, expires_at: refresh_token_expires, user_id: user.id }).catch(_ => { throw { error: 'database error' }; });

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
                    username: user.username,
                    avatar_url: user.avatar_url
                }
            }
        });
    }
    catch (error) {
        console.log(`/authenticate:`);
        console.log(error); 

        response.status(403)
        response.send({ status: 'error', error: 'invalid refresh token' });
    }
};