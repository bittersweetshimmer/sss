export default (db) => async (request, response) => {
    const username = request.params.username;

    console.log(request.params);
    console.log(`/users/${username}`);

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

        const users_in_db = await db('users').where({ username }).catch(_ => { throw { error: 'database error' }; });
        if (users_in_db.length != 1) { throw { error: 'user does not exist' }; }

        const user = users_in_db[0];

        console.log(user);

        response.status(200);
        response.send({
            status: 'ok',
            user: {
                username: user.username,
                avatar_url: user.avatar_url
            }
        });
    }
    catch (error) {
        console.log(`${username} users error: ${JSON.stringify(error)}`);

        response.status(404)
        response.send({ status: 'error', ...error });
    }
};