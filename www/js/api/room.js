export const room = async (id) => {
    const response = await fetch(`/api/rooms/${id}`);
    const json = await response.json();

    return json;
}