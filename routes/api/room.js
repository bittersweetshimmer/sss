export default (db) => async (request, response) => {
    const name = request.params.name;

    console.log(request.params);
    console.log(`/rooms/${name}`);

    try {
        if (!name.split('').every(character => {
            const code = character.charCodeAt(0);

            if (!(code > 47 && code < 58) && // numeric (0-9)
                !(code > 64 && code < 91) && // upper alpha (A-Z)
                !(code > 96 && code < 123)) { // lower alpha (a-z)
              return false;
            }

            return true;
        })) { throw { error: 'room name can\'t contain non-alphanumeric characters' }; };

        const rooms_in_db = await db.from('rooms')
            .select('rooms.name', 'rooms.description', 'users.username as owner')
            .innerJoin('users', 'rooms.owner_id', 'users.id')
            .where({ name })
            .catch(_ => { throw { error: 'database error' }; });

        if (rooms_in_db.length != 1) { throw { error: 'room does not exist' }; }

        const room = rooms_in_db[0];

        console.log(room);

        response.status(200);
        response.send({
            status: 'ok',
            room: {
                name: room.name,
                description: room.description,
                owner: room.owner
            }
        });
    }
    catch (error) {
        console.log(`${name} rooms error: ${JSON.stringify(error)}`);

        response.status(404)
        response.send({ status: 'error', ...error });
    }
};