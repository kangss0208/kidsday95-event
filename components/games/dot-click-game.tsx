'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveGameScore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GAME_DURATION = 30;
const DOT_LIFETIME = 1500;
const DOT_SIZE = 54;

interface Dot {
  id: number;
  x: number;
  y: number;
}

interface DotClickGameProps {
  playerName: string;
  onBack: () => void;
}

type Phase = 'ready' | 'playing' | 'result';

export function DotClickGame({ playerName, onBack }: DotClickGameProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [dots, setDots] = useState<Dot[]>([]);
  const [savedScore, setSavedScore] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const dotIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const elapsed = GAME_DURATION - timeLeft;
  const maxDots = elapsed < 10 ? 1 : elapsed < 20 ? 2 : 3;

  const spawnDot = useCallback(() => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const margin = DOT_SIZE / 2 + 8;
    const x = Math.random() * (rect.width - margin * 2) + margin;
    const y = Math.random() * (rect.height - margin * 2) + margin;
    const id = ++dotIdRef.current;
    setDots((prev) => {
      if (prev.length >= maxDots) return prev;
      return [...prev, { id, x, y }];
    });
    setTimeout(() => {
      setDots((prev) => prev.filter((d) => d.id !== id));
    }, DOT_LIFETIME);
  }, [maxDots]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setDots([]);
    setSavedScore(false);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(spawnRef.current!);
          setDots([]);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(spawnDot, 600);
    spawnDot();

    return () => {
      clearInterval(timerRef.current!);
      clearInterval(spawnRef.current!);
    };
  }, [phase, spawnDot]);

  useEffect(() => {
    if (phase === 'result' && !savedScore) {
      setSavedScore(true);
      saveGameScore(playerName, 'dot_click', score).catch(() => {});
    }
  }, [phase, savedScore, score, playerName]);

  const clickDot = (id: number) => {
    setDots((prev) => prev.filter((d) => d.id !== id));
    setScore((s) => s + 1);
  };

  const progressPct = (timeLeft / GAME_DURATION) * 100;

  if (phase === 'result') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-b from-blue-50 via-background to-indigo-50">
        <span className="text-6xl">{score >= 30 ? '🏆' : score >= 15 ? '🎉' : '😅'}</span>
        <div className="text-center space-y-1">
          <p className="text-3xl font-extrabold">{score}점</p>
          <p className="text-muted-foreground text-sm">30초 동안 {score}개를 클릭했어요!</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="h-12 px-6 rounded-2xl font-semibold">
            나가기
          </Button>
          <Button onClick={startGame} className="h-12 px-6 rounded-2xl font-semibold">
            다시 하기
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-b from-blue-50 via-background to-indigo-50">
        <button onClick={onBack} className="self-start ml-4 mt-10 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <span className="text-6xl">🎯</span>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold">점 클릭 게임</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              30초 동안 나타나는 점을<br />최대한 빠르게 클릭하세요!<br />
              <span className="text-xs">점은 1.5초 후 사라져요</span>
            </p>
          </div>
          <Button onClick={startGame} className="h-14 px-10 rounded-2xl text-lg font-semibold">
            시작!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-background to-indigo-50">
      {/* 상단 HUD */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3">
        <button onClick={() => { clearInterval(timerRef.current!); clearInterval(spawnRef.current!); onBack(); }}
          className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className={`font-bold ${timeLeft <= 5 ? 'text-destructive' : 'text-foreground'}`}>
              ⏱ {timeLeft}초
            </span>
            <span className="font-bold text-primary">{score}점</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-1000 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 게임 영역 */}
      <div
        ref={areaRef}
        className="flex-1 relative overflow-hidden mx-4 mb-4 rounded-3xl border-2 border-blue-200 bg-white/60"
      >
        {dots.map((dot) => (
          <button
            key={dot.id}
            onClick={() => clickDot(dot.id)}
            className="absolute rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg active:scale-90 transition-transform animate-bounce-in"
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              left: dot.x - DOT_SIZE / 2,
              top: dot.y - DOT_SIZE / 2,
            }}
          />
        ))}
        {dots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm select-none">
            점이 나타나면 클릭!
          </div>
        )}
      </div>
    </div>
  );
}
