import React from "react";

export default function TextCard({ children }) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-md text-2xl font-monospace relative">
      {children}
      <span className="inline-block align-middle ml-1 w-3 h-7 bg-white animate-blink cursor-blink" />
    </div>
  );
}