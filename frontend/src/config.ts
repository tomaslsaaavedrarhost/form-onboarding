const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://forms-onboarding.vercel.app'  // URL de producción en Vercel
    : 'http://localhost:3001',
};

export default config; 