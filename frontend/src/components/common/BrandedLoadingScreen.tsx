import React from 'react';
import { Sparkles } from 'lucide-react';

export const BrandedLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl animate-pulse" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-[0_0_50px_rgba(99,102,241,0.5)] animate-bounce" style={{ animationDuration: '2s' }}>
            <Sparkles className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/30 blur-md -z-10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        {/* Brand Text */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Community<span className="text-indigo-400">Connect</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">
            Securing Verified Session...
          </p>
        </div>

        {/* Minimalist Progress Pill */}
        <div className="w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500 w-full animate-[liquidFlow_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

