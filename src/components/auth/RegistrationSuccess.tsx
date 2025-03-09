"use client";

import { useEffect, useState } from 'react';
import { shouldShowWelcome } from '@/lib/auth/client-navigation';

export const RegistrationSuccess = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if we should show the welcome message
    const showWelcome = shouldShowWelcome();
    if (showWelcome) {
      setVisible(true);
      // Hide after 5 seconds
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      data-testid="registration-success"
      className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg transition-opacity duration-300"
    >
      <div className="flex items-center">
        <div className="py-1">
          <svg
            className="fill-current h-6 w-6 text-green-500 mr-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z" />
          </svg>
        </div>
        <div>
          <p className="font-bold">Welcome!</p>
          <p className="text-sm">Your account has been created successfully.</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;