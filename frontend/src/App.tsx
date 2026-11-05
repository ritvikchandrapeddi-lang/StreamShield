import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { StreamShieldProvider } from './context/StreamShieldContext';
import { ToastContainer } from './components/ui/ToastContainer';

export const App: React.FC = () => {
  return (
    <StreamShieldProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </StreamShieldProvider>
  );
};

export default App;
