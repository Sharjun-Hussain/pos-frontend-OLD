// public/service-worker.mjs

import {db} from './src/lib/indexedDB/db.mjs'

// --- CONSTANTS ---
const DATA_CACHE_NAME = 'pos-data-cache-v1';
const API_ENDPOINTS = [
  '/api/products',
  '/api/customers',
  '/api/settings',
  // Add any other essential data endpoints here
];

// --- EVENT: INSTALL ---
// This event fires when the service worker is first installed.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate the new service worker immediately
});

// --- EVENT: ACTIVATE ---
// This event fires when the service worker becomes active.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Clean up old caches that are not our current data cache
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// --- EVENT: MESSAGE ---
// The command center for the service worker. Listens for messages from the app.
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'USER_LOGOUT':
      event.waitUntil(clearUserData());
      break;
    case 'FETCH_INITIAL_DATA':
      event.waitUntil(fetchAndCacheInitialData());
      break;
  }
});

// --- EVENT: FETCH ---
// Intercepts network requests to serve data from cache when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only apply caching strategy to our defined API endpoints
  if (API_ENDPOINTS.includes(url.pathname)) {
    event.respondWith(networkFirstThenCache(event.request));
  }
});

// --- EVENT: SYNC ---
// Handles background synchronization of transactions.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-transactions') {
    event.waitUntil(syncNewTransactions());
  }
});


// --- HELPER FUNCTIONS ---

/**
 * Caching Strategy: Network First, then Cache
 * Tries to fetch from the network first. If it fails (offline), it falls back to the cache.
 */
async function networkFirstThenCache(request) {
  try {
    // 1. Try to fetch from the network
    const networkResponse = await fetch(request);
    
    // 2. If successful, open the cache and store a clone of the response
    const cache = await caches.open(DATA_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    // 3. Return the network response
    return networkResponse;
  } catch (error) {
    // 4. If the network fetch fails, try to get it from the cache
    console.warn('Network request failed, serving from cache.', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse;
  }
}

/**
 * Fetches all essential data and populates both the cache and IndexedDB.
 */
async function fetchAndCacheInitialData() {
  console.log('SW: Fetching initial data for new user session...');
  
  // Clear any old data first
  await clearUserData();

  const promises = API_ENDPOINTS.map(async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      
      const data = await response.json();
      
      // Update IndexedDB based on the endpoint
      if (endpoint === '/api/products') {
        await db.products.bulkPut(data);
      } else if (endpoint === '/api/customers') {
        await db.customers.bulkPut(data);
      }
      // Add other cases for settings, etc.
      
      // Also cache the raw response for offline fallback
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(new Request(endpoint), response.clone());
      
    } catch (error) {
      console.error(`SW: Failed to sync endpoint ${endpoint}`, error);
    }
  });

  await Promise.all(promises);
  console.log('SW: Initial data sync complete.');
}


/**
 * Clears all user-specific data from IndexedDB and caches.
 */
async function clearUserData() {
  console.log('SW: Clearing all user data...');
  // Clear IndexedDB tables
  await Promise.all([
    db.transactions.clear(),
    db.products.clear(),
    db.customers.clear(),
  ]);
  // Delete the data cache
  await caches.delete(DATA_CACHE_NAME);
  console.log('SW: User data cleared.');
}

/**
 * Syncs unsynced transactions with the server.
 * (This function remains the same as before)
 */
async function syncNewTransactions() {
  const unsyncedTxs = await db.transactions.where('isSynced').equals(0).toArray();
  if (unsyncedTxs.length === 0) return;

  try {
    const response = await fetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unsyncedTxs),
    });

    if (!response.ok) throw new Error('Server sync failed');
    
    const syncedIds = unsyncedTxs.map(tx => tx.id);
    await db.transactions.where('id').anyOf(syncedIds).modify({ isSynced: 1 });
    console.log('SW: Successfully synced transactions.');
  } catch (error) {
    console.error('SW: Sync failed, will retry later.', error);
    throw error;
  }
}