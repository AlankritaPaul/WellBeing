// WellBeing Service Worker - Native Push & Background Medication Alarms
// Enables lockscreen/system notification banner with Take, Delay, Skip actions

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action; // 'taken', 'delayed', 'skipped', or ''
  const notifData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and broadcast action
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
        }
        client.postMessage({
          type: 'WELLBEING_NOTIFICATION_ACTION',
          action: action || 'open',
          data: notifData,
        });
        return;
      }

      // If no window is open, open the app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?action=' + encodeURIComponent(action || 'alarm'));
      }
    })
  );
});
