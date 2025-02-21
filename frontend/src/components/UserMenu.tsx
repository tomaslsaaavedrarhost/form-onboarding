import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../lib/AuthContext';
import { useFormProgress } from '../hooks/useFormProgress';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { sharedForms, selectedFormId, switchForm, unsavedChanges } = useFormProgress();

  if (!user) return null;

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <img
            className="h-8 w-8 rounded-full"
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`}
            alt=""
          />
          {unsavedChanges && (
            <span className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm text-gray-700">{user.email}</p>
          </div>

          {/* Mi formulario */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => switchForm(user.uid)}
                className={classNames(
                  active ? 'bg-gray-100' : '',
                  selectedFormId === user.uid ? 'bg-indigo-50' : '',
                  'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                )}
              >
                <div className="flex-1 text-left">Mi formulario</div>
                {selectedFormId === user.uid && (
                  <span className="ml-2 text-indigo-600">•</span>
                )}
              </button>
            )}
          </Menu.Item>

          {/* Formularios compartidos */}
          {sharedForms.length > 0 && (
            <div className="py-1 border-t border-gray-200">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                FORMULARIOS COMPARTIDOS
              </div>
              {sharedForms.map((form) => (
                <Menu.Item key={form.formId}>
                  {({ active }) => (
                    <button
                      onClick={() => switchForm(form.formId!)}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        selectedFormId === form.formId ? 'bg-indigo-50' : '',
                        'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <div className="flex-1 text-left">
                        <div>{form.ownerEmail}</div>
                        <div className="text-xs text-gray-500">Compartido contigo</div>
                      </div>
                      {selectedFormId === form.formId && (
                        <span className="ml-2 text-indigo-600">•</span>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          )}

          {/* Cerrar sesión */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={logout}
                className={classNames(
                  active ? 'bg-gray-100' : '',
                  'block w-full px-4 py-2 text-sm text-gray-700 border-t border-gray-200'
                )}
              >
                Cerrar sesión
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 