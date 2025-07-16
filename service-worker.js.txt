// Nombre de archivo: service-worker.js
// Ubicación: En la carpeta raíz de tu proyecto, junto a index.html

const CACHE_NAME = 'agro-ia-cache-v1';
const DYNAMIC_CACHE_NAME = 'agro-ia-dynamic-cache-v1';

// Archivos que componen el "cascarón" de la aplicación.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/@phosphor-icons/web'
];

// 1. Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Guardando en caché el App Shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// 2. Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// 3. Interceptación de Peticiones (Fetch)
self.addEventListener('fetch', event => {
  // Estrategia para las llamadas a la API de Gemini
  if (event.request.url.includes('/.netlify/functions/gemini-proxy')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return fetch(event.request).then(networkResponse => {
          // Si la petición de red es exitosa, la guardamos en el caché dinámico
          cache.put(event.request.url, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          // Si la red falla (offline), intentamos servir desde el caché
          return cache.match(event.request);
        });
      })
    );
  } 
  // Estrategia para el App Shell (Cache-First)
  else if (APP_SHELL_URLS.some(url => event.request.url.includes(url))) {
    event.respondWith(
      caches.match(event.request).then(cacheResponse => {
        return cacheResponse || fetch(event.request).then(networkResponse => {
          return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request.url, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
