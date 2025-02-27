import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../lib/AuthContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const UserProfile = () => {
  const { user, logout } = useAuth();

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
    </>
  );
};

export default UserProfile; 