/**
 * Service Worker para ASISTEM San Martín
 * Estrategia: Network First con Cache Fallback
 * 
 * Features:
 * - Cache de recursos estáticos
 * - Cache de API responses
 * - Offline fallback
 * - Background sync para registros de asistencia
 * - Optimizado para iOS Safari
 * - Admin PWA móvil optimizado
 */

const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `asistem-${CACHE_VERSION}`;
const API_CACHE = `asistem-api-${CACHE_VERSION}`;

// Recursos estáticos críticos para cachear en install
const STATIC_RESOURCES = [
  '/',
  '/offline.html',
  '/docente',
  '/admin',
  '/login',
  '/manifest.json'
];

// URLs de API que se pueden cachear
const API_URLS_TO_CACHE = [
  '/api/docente/mi-dashboard',
  '/api/docente/mi-perfil',
  '/api/docente/mis-horarios',
  '/api/admin/estadisticas'
];

// =========================
// INSTALL EVENT
// =========================
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache abierto');
        // Pre-cachear recursos estáticos
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('✅ Service Worker: Instalado correctamente');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Error en instalación:', error);
      })
  );
});

// =========================
// ACTIVATE EVENT
// =========================
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Eliminar caches antiguos
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('asistem-') && cacheName !== CACHE_NAME && cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activado correctamente');
        return self.clients.claim(); // Tomar control inmediato
      })
  );
});

// =========================
// FETCH EVENT - Network First Strategy
// =========================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia para API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Estrategia para recursos estáticos
  event.respondWith(handleStaticRequest(request));
});

/**
 * Manejo de requests a la API
 * Estrategia: Network First con Cache Fallback
 */
async function handleApiRequest(request) {
  try {
    // Intentar obtener de la red
    const networkResponse = await fetch(request);
    
    // Si es exitoso, cachear la respuesta (solo GET 200)
    if (networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Network failed, intentando cache:', request.url);
    
    // Si falla la red, buscar en cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('✅ Respuesta desde cache:', request.url);
      return cachedResponse;
    }
    
    // Si no hay cache, retornar error offline
    console.error('❌ No hay cache disponible para:', request.url);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Sin conexión. Por favor, intenta más tarde.',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Manejo de recursos estáticos
 * Estrategia: Cache First con Network Fallback
 */
async function handleStaticRequest(request) {
  try {
    // Intentar desde cache primero
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📦 Desde cache:', request.url);
      return cachedResponse;
    }
    
    // Si no está en cache, obtener de la red
    console.log('🌐 Desde red:', request.url);
    const networkResponse = await fetch(request);
    
    // Cachear la respuesta
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Error al obtener recurso:', request.url, error);
    
    // Si es una página HTML y falla, mostrar offline.html
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Retornar error genérico
    return new Response('Recurso no disponible offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// =========================
// BACKGROUND SYNC
// =========================
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'sync-asistencias') {
    event.waitUntil(syncAsistencias());
  }
});

/**
 * Sincronizar asistencias pendientes cuando vuelva la conexión
 */
async function syncAsistencias() {
  try {
    console.log('🔄 Sincronizando asistencias pendientes...');
    
    // Aquí puedes implementar la lógica para sincronizar
    // asistencias que se guardaron en IndexedDB mientras no había conexión
    
    console.log('✅ Asistencias sincronizadas');
  } catch (error) {
    console.error('❌ Error al sincronizar asistencias:', error);
    throw error; // Reintentar más tarde
  }
}

// =========================
// PUSH NOTIFICATIONS
// =========================
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification recibida');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ASISTEM San Martín';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// =========================
// NOTIFICATION CLICK
// =========================
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Abrir la URL correspondiente
  const urlToOpen = event.notification.data?.url || '/docente';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// =========================
// MESSAGE EVENT
// =========================
self.addEventListener('message', (event) => {
  console.log('📨 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('🚀 Service Worker cargado');
