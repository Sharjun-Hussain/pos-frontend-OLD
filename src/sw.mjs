// src/sw.mjs

// Import Dexie (make sure you've npm installed it)
import Dexie from 'dexie';

// Import Workbox libraries (provided by next-pwa)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// --- 1. Precache Next.js files ---
// This is the "magic" injection point.
// next-pwa will replace self.__WB_MANIFEST with a list
// of all your Next.js chunks (JS, CSS, etc.)
precacheAndRoute(self.__WB_MANIFEST);

// --- 2. Define Your Dexie DB ---
const db = new Dexie('POSDatabase');
db.version(1).stores({
  salesQueue: '++id', // Auto-incrementing primary key
});

// --- 3. Caching for GET API Routes ---

// Strategy: Stale-While-Revalidate for products
// (Fast response, fresh data in background)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/product'),
  new StaleWhileRevalidate({
    cacheName: 'api-product-cache',
  })
);

// Strategy: Network-First for recent sales list
// (Always try for new data, use cache as offline fallback)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/sales'),
  new NetworkFirst({
    cacheName: 'api-sales-cache',
  })
);

// --- 4. Background Sync for POST API Routes ---

// This plugin will automatically queue failed POST requests
const bgSyncPlugin = new BackgroundSyncPlugin('sales-queue', {
  maxRetentionTime: 24 * 60, // Retry for 24 hours
});

// Register a route for your "create sale" endpoint
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/sales/create'),
  new NetworkFirst({ // Try network first
    plugins: [bgSyncPlugin], // If it fails, use the Background Sync Plugin
  }),
  'POST' // IMPORTANT: Only apply this to POST requests
);

// --- (Optional, but Recommended) Sync Event Listener ---
// The plugin above handles most cases, but you can
// also listen for the event manually if you use Dexie as the trigger.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-sales') {
    event.waitUntil(syncSales());
  }
});

async function syncSales() {
  const allSales = await db.salesQueue.toArray();
  for (const sale of allSales) {
    try {
      const response = await fetch('/api/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale.saleData), // Assuming you store it this way
      });

      if (response.ok) {
        // Success! Remove it from the Dexie queue
        await db.salesQueue.delete(sale.id);
        console.log('Synced and deleted sale from queue:', sale.id);
      } else {
        // Server error (4xx, 5xx), don't delete, let it retry
        console.error('Server error for sale, will retry:', sale.id);
      }
    } catch (error) {
      // Network error, still offline.
      // Do nothing, the sync will try again later.
      console.log('Still offline, will retry sale later:', sale.id);
      return; // Stop the loop
    }
  }
}

// Skip waiting and claim clients to take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});