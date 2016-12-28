
'use strict';

self.addEventListener('fetch', function(e) {
    if (e.request.context === 'manifest') {
        e.respondWith(new Promise(function(resolve, reject) {
            fetch(e.request).then(function(response) {
                if (response.ok) {
                    // We found a real manifest, so we should just add our custom field
                    response.json().then(function(json) {
                        json.custom_field = 'Hello world';
                        var blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
                        console.log('Appended a custom field to the pre-existing manifest');
                        resolve(new Response(blob));
                    });
                } else {
                    // There was no manifest so return ours
                    console.log('Injected a custom manifest');
                    resolve(new Response('{ "custom_field": "Hello world" }'));
                }
            });
        }));
    }
});

// These pieces cause the service worker to claim the client immediately when it is registered instead of waiting until the next load. This means this approach can work immediately when the user lands on your site.
if (typeof self.skipWaiting === 'function') {
    console.log('self.skipWaiting() is supported.');
    self.addEventListener('install', function(e) {
        e.waitUntil(self.skipWaiting());
    });
} else {
    console.log('self.skipWaiting() is not supported.');
}

if (self.clients && (typeof self.clients.claim === 'function')) {
    console.log('self.clients.claim() is supported.');
    self.addEventListener('activate', function(e) {
        // See https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#clients-claim-method
        e.waitUntil(self.clients.claim());
    });
} else {
    console.log('self.clients.claim() is not supported.');
}

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  console.log('raw data of notification:' +event.data.text());

    const title = 'NotifyMe App';
    const options = {
      body: event.data.text(),
      icon: 'images/icon.png',
      badge: 'images/badge.png'
    };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://pushnotify-esp826612e.rhcloud.com/#/notify')
  );
});