'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewportContext = createContext({
  isMobile: false,
  isDesktopLg: false,
});

export const ViewportProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktopLg, setIsDesktopLg] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktopLg(window.innerWidth >= 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return (
    <ViewportContext.Provider value={{ isMobile, isDesktopLg }}>
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = () => useContext(ViewportContext);
