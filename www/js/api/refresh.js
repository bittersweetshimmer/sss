export const refresh = async () => {
    const response = await fetch('/api/refresh', {
        method: 'POST'
    });

    const json = await response.json();

    return json;
}