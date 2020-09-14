export default (db) => async (request, response) => {
    console.log(`/rooms/`);

    try {
        const rooms_in_db = await db.from('rooms')
            .select('rooms.name', 'rooms.description', 'users.username as owner')
            .innerJoin('users', 'rooms.owner_id', 'users.id')
            .catch(_ => { throw { error: 'database error' }; });
            
        console.log(rooms_in_db);

        response.status(200);
        response.send({
            status: 'ok',
            rooms: rooms_in_db
        });
    }
    catch (error) {
        console.log(`${rooms_in_db} rooms error: ${JSON.stringify(error)}`);

        response.status(404)
        response.send({ status: 'error', ...error });
    }
};0