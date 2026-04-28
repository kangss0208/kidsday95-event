'use client';

import { useState, useEffect } from 'react';
import { getGamePlayerName, setGamePlayerName } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trophy, Pencil } from 'lucide-react';
import { Leaderboard } from './leaderboard';
import { FaceQuizGame } from './face-quiz-game';
import { DotClickGame } from './dot-click-game';
import { ReactionGame } from './reaction-game';
import { WatermelonGame } from './watermelon-game';

type ActiveGame = 'face_quiz' | 'dot_click' | 'reaction' | 'watermelon' | null;

const GAMES = [
  {
    id: 'face_quiz' as const,
    emoji: '🤔',
    title: '얼굴 맞추기',
    desc: '사진의 일부만 보고\n누군지 맞춰보세요!',
    color: 'from-pink-100 to-rose-100 border-pink-200',
  },
  {
    id: 'dot_click' as const,
    emoji: '🎯',
    title: '점 클릭 게임',
    desc: '30초 동안 나타나는\n점을 빠르게 클릭!',
    color: 'from-blue-100 to-indigo-100 border-blue-200',
  },
  {
    id: 'reaction' as const,
    emoji: '⚡',
    title: '반응속도 테스트',
    desc: '화면이 바뀌면\n최대한 빠르게 클릭!',
    color: 'from-yellow-100 to-amber-100 border-yellow-200',
  },
  {
    id: 'watermelon' as const,
    emoji: '🍉',
    title: '수박 게임',
    desc: '같은 과일을 합쳐서\n수박을 만들어보세요!',
    color: 'from-green-100 to-emerald-100 border-green-200',
  },
];

interface GamesHubProps {
  onBack: () => void;
}

export function GamesHub({ onBack }: GamesHubProps) {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  useEffect(() => {
    const saved = getGamePlayerName();
    if (saved) {
      setPlayerNameState(saved);
    } else {
      setShowNameModal(true);
    }
  }, []);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setGamePlayerName(trimmed);
    setPlayerNameState(trimmed);
    setShowNameModal(false);
    setNameInput('');
  };

  const startGame = (id: ActiveGame) => {
    if (!playerName) {
      setShowNameModal(true);
      return;
    }
    setActiveGame(id);
  };

  // 게임 화면 렌더링
  if (activeGame === 'face_quiz' && playerName) {
    return <FaceQuizGame playerName={playerName} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dot_click' && playerName) {
    return <DotClickGame playerName={playerName} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'reaction' && playerName) {
    return <ReactionGame playerName={playerName} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'watermelon' && playerName) {
    return <WatermelonGame playerName={playerName} onBack={() => setActiveGame(null)} />;
  }

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-secondary/10">
      {/* 닉네임 입력 모달 */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm p-6 rounded-3xl border-2 border-primary/20 space-y-4">
            <h3 className="text-xl font-extrabold text-center">닉네임 입력</h3>
            <p className="text-sm text-muted-foreground text-center">
              랭킹에 표시될 이름을 입력해주세요
            </p>
            <Input
              placeholder="닉네임 (최대 8자)"
              value={nameInput}
              maxLength={8}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              className="rounded-2xl h-12 text-center text-lg"
              autoFocus
            />
            <Button
              onClick={saveName}
              disabled={!nameInput.trim()}
              className="w-full h-12 rounded-2xl text-base font-semibold">
              확인
            </Button>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-extrabold">미니 게임</h1>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm">랭킹</span>
        </button>
      </div>

      {/* 플레이어 이름 */}
      {playerName && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{playerName}</span> 으로 플레이 중
          </span>
          <button
            onClick={() => { setNameInput(playerName); setShowNameModal(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 게임 카드 그리드 */}
      <div className="flex-1 px-4 grid grid-cols-2 gap-3 pb-8 content-start">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => startGame(game.id)}
            className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 bg-gradient-to-br ${game.color} active:scale-95 transition-transform shadow-sm`}
          >
            <span className="text-4xl">{game.emoji}</span>
            <span className="font-bold text-base leading-tight">{game.title}</span>
            <span className="text-xs text-muted-foreground text-center whitespace-pre-line leading-snug">
              {game.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
