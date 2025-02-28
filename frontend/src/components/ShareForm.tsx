import React from 'react';
import { useForm } from '../lib/FormContext';

// Componente simplificado que no usa la funcionalidad de compartir
const ShareForm: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Compartir Formulario</h2>
      <div className="py-4 text-center text-gray-600">
        <p>La funcionalidad para compartir formularios está deshabilitada en esta versión.</p>
      </div>
    </div>
  );
};

export default ShareForm; 