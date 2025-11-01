'use client';

import { useState, useEffect } from 'react';
import { Zap, Rocket, Sparkles, TrendingUp } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  status: string;
}

export function LoadingScreen({ progress, status }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 animate-grid-move"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} 
        />
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 blur-sm"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo/Icon Animation */}
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 blur-2xl opacity-50 animate-pulse" />
          
          {/* Rotating Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-cyan-500/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          
          {/* Central Icon */}
          <div className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full shadow-2xl">
            <Rocket className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '2s' }} />
          </div>

          {/* Orbiting Icons */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '10s' }}>
            <Zap className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
            <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 text-cyan-400" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
            <TrendingUp className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            Entering Future
          </h1>
          <p className="text-lg text-gray-400 font-mono">
            {status}{dots}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 max-w-full space-y-2">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 font-mono">
            {progress}%
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
              style={{
                animation: `bounce 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-purple-500/30 animate-pulse" />
      <div className="absolute top-10 right-10 w-32 h-32 border-r-2 border-t-2 border-cyan-500/30 animate-pulse" />
      <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-purple-500/30 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-cyan-500/30 animate-pulse" />

    </div>
  );
}

