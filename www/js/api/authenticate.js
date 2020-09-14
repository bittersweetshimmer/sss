export const authenticate = async () => {
    const response = await fetch('/api/authenticate', {
        method: 'POST'
    });

    const json = await response.json();

    return json;
}