import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../lib/AuthContext';
import { ShareForm } from './ShareForm';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  if (!user) return null;

  return (
    <>
      <Menu as="div" className="relative ml-3">
        <div>
          <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2">
            <span className="sr-only">Abrir menú de usuario</span>
            {user.photoURL ? (
              <img
                className="h-8 w-8 rounded-full"
                src={user.photoURL}
                alt="Foto de perfil"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-purple flex items-center justify-center text-white">
                {user.email?.[0].toUpperCase()}
              </div>
            )}
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setShowShareModal(true)}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'flex w-full px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  Compartir Formulario
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'flex w-full px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  Cerrar Sesión
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Modal de compartir */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple"
                  onClick={() => setShowShareModal(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-3 text-center sm:mt-0 sm:text-left">
                <ShareForm onClose={() => setShowShareModal(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 