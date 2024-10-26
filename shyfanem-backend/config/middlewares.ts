export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'http://localhost:1337'], // Add your allowed domains
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],  // Allowed HTTP methods
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],  // Allowed headers
      keepHeadersOnError: true,  // Keep CORS headers on errors
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
