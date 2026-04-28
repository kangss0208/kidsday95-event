'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { saveGameScore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TOTAL_ROUNDS = 10;
const SECONDS_PER_ROUND = 15;
const POINTS_PER_CORRECT = 10;

// 눈/코/입 영역: objectPosition + scale
const CROP_AREAS = [
  { label: '눈', objectPosition: '50% 22%', scale: 2.6 },
  { label: '코', objectPosition: '50% 42%', scale: 2.4 },
  { label: '입', objectPosition: '50% 65%', scale: 2.4 },
];

// DB 의존성 없이 이미지 파일명만으로 플레이어를 구성
interface Member {
  id: string;   // name을 id로 사용
  name: string;
  imgSrc: string;
}

interface Question {
  answer: Member;
  choices: Member[];
  crop: typeof CROP_AREAS[number];
}

interface FaceQuizGameProps {
  playerName: string;
  onBack: () => void;
}

type Phase = 'loading' | 'playing' | 'result';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(pool: Member[]): Question[] {
  if (pool.length < 2) return [];
  const rounds = Math.min(TOTAL_ROUNDS, pool.length);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, rounds).map((answer) => {
    const wrong = shuffle(pool.filter((m) => m.id !== answer.id)).slice(0, 3);
    const choices = shuffle([answer, ...wrong]);
    const crop = CROP_AREAS[Math.floor(Math.random() * CROP_AREAS.length)];
    return { answer, choices, crop };
  });
}

export function FaceQuizGame({ playerName, onBack }: FaceQuizGameProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_ROUND);
  const [selected, setSelected] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API 라우트에서 파일 목록을 가져와 Member 배열로 구성 (DB 불필요)
  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/game-images').then((r) => r.json()).catch(() => ({ names: [] }));
    const names: string[] = res.names ?? [];
    return names.map((name) => ({ id: name, name, imgSrc: `/game_img/${name}.jpg` }));
  }, []);

  useEffect(() => {
    loadMembers().then((members) => {
      if (members.length < 2) {
        setPhase('result');
        return;
      }
      setQuestions(buildQuestions(members));
      setPhase('playing');
    });
  }, [loadMembers]);

  // 라운드 타이머
  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return;
    setTimeLeft(SECONDS_PER_ROUND);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase]);

  const handleAnswer = useCallback((memberId: string | null) => {
    clearInterval(timerRef.current!);
    const q = questions[current];
    if (!q) return;
    setSelected(memberId ?? '__timeout__');
    if (memberId === q.answer.id) setScore((s) => s + POINTS_PER_CORRECT);

    setTimeout(() => {
      setSelected(null);
      if (current + 1 >= questions.length) {
        setPhase('result');
      } else {
        setCurrent((c) => c + 1);
      }
    }, 1200);
  }, [current, questions]);

  // 점수 저장
  useEffect(() => {
    if (phase === 'result' && !savedScore && questions.length > 0) {
      setSavedScore(true);
      saveGameScore(playerName, 'face_quiz', score).catch(() => { });
    }
  }, [phase, savedScore, score, playerName, questions.length]);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        <p className="text-muted-foreground animate-pulse">사진 불러오는 중...</p>
      </div>
    );
  }

  if (phase === 'result') {
    const correctCount = score / POINTS_PER_CORRECT;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        <span className="text-6xl">
          {score >= 80 ? '🏆' : score >= 50 ? '🎉' : '🙈'}
        </span>
        <div className="text-center space-y-1">
          <p className="text-2xl font-extrabold">{score}점</p>
          <p className="text-muted-foreground text-sm">
            {questions.length > 0
              ? `${questions.length}문제 중 ${correctCount}개 정답!`
              : 'game_img 폴더에 이미지가 2개 이상 필요해요'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onBack} className="h-12 px-8 rounded-2xl font-semibold">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">
              {current + 1} / {questions.length}
            </span>
            <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              ⏱ {timeLeft}초
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold text-primary">{score}점</span>
      </div>

      {/* 얼굴 크롭 이미지 */}
      <div className="flex flex-col items-center px-4 py-3 gap-2">
        <p className="text-sm text-muted-foreground font-medium">
          부분을 보고 누군지 맞춰보세요!
        </p>
        <div
          className="w-52 h-52 rounded-3xl border-4 border-primary/30 overflow-hidden shadow-lg bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={q.answer.imgSrc}
            alt="???"
            className="w-full h-full"
            style={{
              objectFit: 'cover',
              objectPosition: q.crop.objectPosition,
              transform: `scale(${q.crop.scale})`,
              transformOrigin: q.crop.objectPosition,
            }}
          />
        </div>
      </div>

      {/* 4지선다 */}
      <div className="flex-1 px-4 pb-8 grid grid-cols-2 gap-3 content-start">
        {q.choices.map((member) => {
          const isCorrect = member.id === q.answer.id;
          const isSelected = selected === member.id;
          const isTimeout = selected === '__timeout__';
          let bg = 'bg-card border-2 border-primary/20 hover:border-primary/60 active:scale-95';
          if (selected !== null) {
            if (isCorrect) bg = 'bg-green-100 border-2 border-green-500 scale-105';
            else if (isSelected || isTimeout) bg = 'bg-red-100 border-2 border-red-400';
            else bg = 'bg-card border-2 border-muted opacity-50';
          }
          return (
            <button
              key={member.id}
              onClick={() => selected === null && handleAnswer(member.id)}
              disabled={selected !== null}
              className={`flex items-center justify-center h-16 rounded-2xl font-semibold text-base transition-all ${bg}`}
            >
              {member.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
