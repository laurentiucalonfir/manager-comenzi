const CACHE_NAME = 'app-cache-v8';

// Fisiere esentiale care trebuie descarcate imediat pentru a functiona offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js'
];

// Instalare: Salvam fisierele de baza in cache
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forteaza noul SW sa preia controlul imediat
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching fisiere esentiale...');
      // Folosim try/catch tacit pentru addAll ca sa nu esueze complet daca pica un CDN
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('[SW] Eroare pre-cache:', err));
    })
  );
});

// Activare: Curatam cache-urile vechi
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Sterg cache vechi:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Interceptare Request-uri (Strategie: Network First cu Fallback pe Cache)
self.addEventListener('fetch', (e) => {
  // Ignoram cererile care nu sunt de tip GET (ex. POST/PUT)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Daca raspunsul e valid (200 OK), il salvam in cache pentru utilizare viitoare
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Ignoram erorile de caching pentru request-uri ciudate (chrome-extension:// etc)
            if (e.request.url.startsWith('http')) {
              cache.put(e.request, responseToCache);
            }
          });
        }
        return response; // Returnam mereu versiunea fresh din retea
      })
      .catch(async () => {
        // Daca pica reteaua (Offline), cautam in cache
        const cachedResponse = await caches.match(e.request, { ignoreSearch: true });
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Ca ultim resort pentru navigare offline, returnam index.html
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
