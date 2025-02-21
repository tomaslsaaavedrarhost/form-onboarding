import React from 'react';
import { useFormProgress } from '../hooks/useFormProgress';
import UserMenu from './UserMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { saveFormData, unsavedChanges } = useFormProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold leading-6 text-gray-900">
              Forms Onboarding
            </h1>
            <div className="flex items-center space-x-4">
              {/* Botón de guardar */}
              <button
                onClick={saveFormData}
                disabled={!unsavedChanges}
                className={`
                  inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm
                  ${unsavedChanges
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Guardar
                {unsavedChanges && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-red-400"></span>
                )}
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 