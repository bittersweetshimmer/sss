import jwt from 'jsonwebtoken';

export default (db, session_config) => async (request, response) => {
    const refresh_token_cookie = request.cookies.refresh_token;

    console.log(`/logout: ${refresh_token_cookie}`);

    try {
        if (!refresh_token_cookie) throw 'no refresh token';
        jwt.verify(refresh_token_cookie, session_config.refresh_token.secret);

        const refresh_token_in_db = await db('tokens').where({ token: refresh_token_cookie }).catch(_ => { throw { error: 'database error' }; });
        if (refresh_token_in_db.length != 1) { throw { error: 'invalid refresh token' }; }

        await db('tokens').where({ id: refresh_token_in_db[0].id }).del().catch(_ => { throw { error: 'database error' }; });

        response.clearCookie('refresh_token');
        response.send({ status: 'ok' });
    }
    catch (error) {
        console.log(`/logout:`);
        console.log(error); 

        response.status(403)
        response.send({ status: 'error', error: 'invalid refresh token' });
    }
};