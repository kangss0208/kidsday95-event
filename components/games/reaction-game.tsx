'use client';

import { useState, useEffect, useRef } from 'react';
import { saveGameScore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TOTAL_ROUNDS = 5;
const PENALTY_MS = 1000;

type RoundState = 'waiting' | 'ready' | 'go' | 'early' | 'done';

interface ReactionGameProps {
  playerName: string;
  onBack: () => void;
}

type Phase = 'intro' | 'playing' | 'result';

export function ReactionGame({ playerName, onBack }: ReactionGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [roundState, setRoundState] = useState<RoundState>('waiting');
  const [times, setTimes] = useState<number[]>([]);
  const [currentMs, setCurrentMs] = useState<number | null>(null);
  const [savedScore, setSavedScore] = useState(false);
  const goTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const avgMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  const startRound = () => {
    setRoundState('waiting');
    setCurrentMs(null);
    const delay = 1000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setRoundState('go');
    }, delay);
  };

  const handleClick = () => {
    if (roundState === 'waiting') {
      clearTimeout(timeoutRef.current!);
      setCurrentMs(PENALTY_MS);
      setRoundState('early');
      return;
    }
    if (roundState === 'go') {
      const ms = Date.now() - goTimeRef.current;
      setCurrentMs(ms);
      setTimes((prev) => [...prev, ms]);
      setRoundState('done');
      return;
    }
    if (roundState === 'early' || roundState === 'done') {
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setPhase('result');
      } else {
        setRound(nextRound);
        startRound();
      }
    }
  };

  const startGame = () => {
    setRound(0);
    setTimes([]);
    setCurrentMs(null);
    setSavedScore(false);
    setPhase('playing');
    setRoundState('waiting');
  };

  useEffect(() => {
    if (phase === 'playing') startRound();
    return () => clearTimeout(timeoutRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'result' && !savedScore) {
      setSavedScore(true);
      saveGameScore(playerName, 'reaction', avgMs).catch(() => { });
    }
  }, [phase, savedScore, avgMs, playerName]);

  const bgColor =
    roundState === 'go' ? 'bg-green-400' :
      roundState === 'early' ? 'bg-red-400' :
        roundState === 'done' ? 'bg-blue-200' :
          'bg-gray-200';

  const message =
    roundState === 'waiting' ? '준비...' :
      roundState === 'go' ? '지금!' :
        roundState === 'early' ? `너무 빨라요! +${PENALTY_MS}ms` :
          roundState === 'done' ? `${currentMs}ms` :
            '';

  const subMessage =
    roundState === 'waiting' ? '화면이 초록색으로 바뀌면 클릭!' :
      roundState === 'early' || roundState === 'done' ? '화면을 탭하면 다음으로' :
        '';

  if (phase === 'result') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-b from-yellow-50 via-background to-amber-50">
        <span className="text-6xl">{avgMs < 200 ? '⚡' : avgMs < 350 ? '🎉' : '🐢'}</span>
        <div className="text-center space-y-1">
          <p className="text-3xl font-extrabold">{avgMs}ms</p>
          <p className="text-muted-foreground text-sm">평균 반응속도 (낮을수록 좋아요)</p>
          <div className="mt-3 space-y-1">
            {times.map((t, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {i + 1}라운드: {t}ms{t === PENALTY_MS ? ' (빠른 클릭 패널티)' : ''}
              </p>
            ))}
          </div>
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

  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-yellow-50 via-background to-amber-50">
        <button onClick={onBack} className="self-start m-4 mt-10 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <span className="text-6xl">⚡</span>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold">반응속도 테스트</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              화면이 초록색으로 바뀌면<br />최대한 빠르게 클릭하세요!<br />
              <span className="text-xs">총 5라운드, 평균 반응속도 측정</span>
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
    <button
      onClick={handleClick}
      className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 transition-colors duration-100 ${bgColor} select-none`}
    >
      {/* 라운드 표시 */}
      <div className="absolute top-10 left-0 right-0 flex justify-center gap-2">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i < times.length ? 'bg-white' : i === round ? 'bg-white/60' : 'bg-white/20'}`}
          />
        ))}
      </div>

      <p className="text-5xl font-extrabold text-[#333] drop-shadow">{message}</p>
      {subMessage && <p className="text-[#333] text-sm">{subMessage}</p>}

      {times.length > 0 && (
        <p className="absolute bottom-16 text-white/70 text-xs">
          현재 평균: {Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms
        </p>
      )}
    </button>
  );
}
