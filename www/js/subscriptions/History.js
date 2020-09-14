export const HistorySubscription = (dispatch, action) => {
    const event_listener =  (event) => {
        dispatch(action, document.location.pathname);
    };

    window.addEventListener('popstate', event_listener);

    return () => window.removeEventListener('popstate', event_listener);
};