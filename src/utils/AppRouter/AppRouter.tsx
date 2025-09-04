
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@pages/Home/Home';

export const AppRouter: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
      {children}
    </Router>
  );
}