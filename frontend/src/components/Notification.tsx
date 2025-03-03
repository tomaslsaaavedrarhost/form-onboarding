import React from 'react';

export interface NotificationProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
}

export const Notification: React.FC<NotificationProps> = ({ message, onClose, type = 'success' }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`bg-white rounded-lg shadow-lg border ${isSuccess ? 'border-green-200' : 'border-red-200'} p-4 flex items-center space-x-3`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full ${isSuccess ? 'bg-gradient-brand' : 'bg-red-500'} flex items-center justify-center`}>
            {isSuccess ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
        <p className="text-gray-800">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}; 