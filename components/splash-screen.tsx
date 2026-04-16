'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'fadeOut'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('fadeOut'), 2000);
    const timer2 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-primary/20 via-background to-secondary/30 transition-opacity duration-500 ${
        phase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Floating balloons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          >
            <div
              className={`w-8 h-10 rounded-full ${
                i % 3 === 0
                  ? 'bg-primary/60'
                  : i % 3 === 1
                  ? 'bg-secondary/80'
                  : 'bg-accent/70'
              }`}
              style={{
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              }}
            />
            <div className="w-px h-8 bg-foreground/20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="text-center animate-bounce-gentle">
        <div className="relative inline-block">
          <div className="absolute -top-4 -right-4 text-secondary">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -left-4 text-primary/60">
            <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <div className="bg-card rounded-3xl px-10 py-8 shadow-xl border-4 border-primary/30">
            <h1 className="text-5xl font-extrabold tracking-tight">
              <span className="text-primary">CARAT</span>
              <span className="text-secondary-foreground ml-2">9559</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg font-medium">
              특별한 어린이 이벤트
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(100vh) rotate(0deg);
          }
          50% {
            transform: translateY(-20vh) rotate(10deg);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
