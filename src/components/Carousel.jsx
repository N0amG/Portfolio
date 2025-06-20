'use client'

import React, { useState, useEffect, useRef } from "react";

export default function Carousel({ children, className}) {
  const items = React.Children.toArray(children);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimeout = useRef(null);

  // Défilement automatique toutes les 3 secondes, sauf si "paused" est actif
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c === items.length - 1 ? 0 : c + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length, paused]);

  // Fonction pour mettre en pause le défilement auto pendant 8 secondes
  const triggerPause = () => {
    setPaused(true);
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
    pauseTimeout.current = setTimeout(() => setPaused(false), 5000);
  };

  const prev = () => {
    setCurrent((c) => (c === 0 ? items.length - 1 : c - 1));
    triggerPause();
  };
  const next = () => {
    setCurrent((c) => (c === items.length - 1 ? 0 : c + 1));
    triggerPause();
  };

  return (
    <div className={`carousel flex relative rounded-2xl overflow-hidden ${className}`}>
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)`, width: `${items.length * 100}%` }}
      >
        {items.map((item, i) => (
          <div key={i} className="w-full flex-shrink-0 h-full flex items-center justify-center">
            {item}
          </div>
        ))}
      </div>
      <button
        onClick={prev}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-indigo-600/70 text-white rounded-full p-2 z-10"
        aria-label="Précédent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} fill="currentColor"><path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z"></path></svg>
      </button>
      <button
        onClick={next}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-indigo-600/70 text-white rounded-full p-2 z-10"
        aria-label="Suivant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} fill="currentColor"><path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path></svg>
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, i) => (
          <span
            key={i}
            className={`w-4 h-2 rounded-full ${i === current ? "bg-indigo-600" : "bg-black"}`}
          />
        ))}
      </div>
    </div>
  );
}