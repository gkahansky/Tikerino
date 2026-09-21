// Existing iPhone installs may have an older root worker that treats /ops as
// learner-app navigation. On activation, take control first. Then re-navigate
// affected windows after activation has finished so the new /ops denylist can
// pass the request to the server-owned owner-auth route.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      const url = new URL(client.url);
      if (/^\/ops(?:\/|$)/.test(url.pathname)) void client.navigate('/ops/');
    }
  }, 0);
});
