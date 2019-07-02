'use strict';

function trackAction(action, data) {
    var fd = new FormData();
    fd.append('id', data.id);
    fd.append('action', action);

    return fetch('https://webpushbuilder.com/notification/track', {
        method: 'post',
        body: fd
    });
}

self.addEventListener('push', function(event) {
    if (!event.data) {
        return null;
    }

    var message = event.data.json();
    message.data = message;

    console.log('[Service worker] notification received', message);

    const trackPromise = trackAction('delivery', message);

    const showPromise = self.registration.showNotification(message.title, message)
        .then(function(e) {
            if (e && e.notification && message.displayDuration) {
                setTimeout(function () {
                    e.notification.close();
                }, message.displayDuration * 1000);
            };
        }) ;

    const promiseChain = Promise.all([
        showPromise,
        trackPromise
    ]);

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] notification click received.');
    event.notification.close();

    if (!event.notification.data) {
        return null;
    }

    event.waitUntil(
        clients.openWindow(event.notification.data.clickUrl)
    );
});