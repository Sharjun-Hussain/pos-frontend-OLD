// lib/db.js

import Dexie from 'dexie';

export const db = new Dexie('emipos');

db.version(1).stores({
  products: '++id, &productId, name, price', // ++id is auto-incrementing primary key, &productId is a unique index
  transactions: '++id, transactionId, totalAmount, items, createdAt, isSynced', // isSynced will track sync status
  customers: '++id, &customerId, name, phone',
});