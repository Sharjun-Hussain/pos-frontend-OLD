// // next.config.mjs (Corrected versio

import nextPWA from '@ducanh2912/next-pwa';

// const withPWA = nextPWA({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   sw: 'service-worker.mjs',
//   disable: process.env.NODE_ENV === 'development',
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any other Next.js specific configurations here
  // For example:
  // reactStrictMode: true,
};

// EXPORT THE WRAPPED CONFIG
// export default nextConfig;

const withPWA = nextPWA({
  dest: 'public', // This is where the *final* SW file will be
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,

  // --- THIS IS THE KEY FOR CUSTOM DEXIE LOGIC ---
  // 1. We tell next-pwa to use *our* file as the source
  // 2. It will then inject its own precaching logic into it
  // 3. This gives us the best of both worlds!
  swSrc: 'src/sw.mjs', 
});

// EXPORT THE *WRAPPED* CONFIG
export default withPWA(nextConfig);