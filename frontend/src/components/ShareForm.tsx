import React, { useState } from 'react';
import { useForm } from '../lib/FormContext';

interface ShareFormProps {
  onClose?: () => void;
}

export const ShareForm = ({ onClose }: ShareFormProps) => {
  const { formData, shareForm, removeSharing } = useForm();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await shareForm(email);
      setSuccessMessage('Invitación enviada exitosamente');
      setEmail('');
      if (onClose) {
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError('Error al compartir el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await removeSharing(email);
      setSuccessMessage('Acceso removido exitosamente');
    } catch (err) {
      setError('Error al remover acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Compartir Formulario</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comparte el acceso a este formulario con otros usuarios. Ellos podrán ver y editar el progreso.
        </p>
      </div>

      <form onSubmit={handleShare} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo Electrónico
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 focus:border-brand-purple focus:ring-brand-purple sm:text-sm"
              placeholder="usuario@ejemplo.com"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-purple hover:bg-brand-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple disabled:opacity-50"
            >
              {loading ? 'Compartiendo...' : 'Compartir'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      {formData.sharedWith && formData.sharedWith.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900">Usuarios con Acceso</h4>
          <ul className="mt-3 divide-y divide-gray-200">
            {formData.sharedWith.map((email) => (
              <li key={email} className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAccess(email)}
                  className="ml-4 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Remover acceso
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 