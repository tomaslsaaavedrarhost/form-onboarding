const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://tu-proyecto.railway.app'  // Reemplazar con tu URL de Railway
    : 'http://localhost:3001',
};

export default config; 