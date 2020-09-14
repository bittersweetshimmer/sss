export const log_out = async (access_token) => {
    const response = await fetch('/api/logout', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token })
    });

    const json = await response.json();

    return json;
}