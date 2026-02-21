import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';

export const RouterProvider = ({ children }: { children: ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

