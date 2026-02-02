// lib/sw-client.mjs

/**
 * Sends a message to the active service worker.
 * @param {object} message - The message object to send.
 */
export function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  } else {
    console.warn('Cannot send message to service worker - no controller is active.');
  }
}