import React from "react";

export function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl text-sky-400">Saksham</span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            Samarthya AI
          </span>
        </div>
        <nav className="flex items-center space-x-6 text-sm text-slate-300">
          <a href="#schemes" className="hover:text-sky-400 transition">Schemes</a>
          <a href="#credit" className="hover:text-sky-400 transition">Credit Readiness</a>
          <a href="http://localhost:8000/docs" target="_blank" className="hover:text-sky-400 transition">API Docs</a>
        </nav>
      </div>
    </header>
  );
}
