'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGameScores } from '@/lib/store';
import type { GameScore } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Trophy, X } from 'lucide-react';

type GameType = GameScore['game_type'];

const GAME_LABELS: Record<GameType, string> = {
  face_quiz: '얼굴 맞추기',
  dot_click: '점 클릭',
  reaction: '반응속도',
  watermelon: '수박 게임',
};

const GAME_EMOJIS: Record<GameType, string> = {
  face_quiz: '🤔',
  dot_click: '🎯',
  reaction: '⚡',
  watermelon: '🍉',
};

const MEDAL = ['🥇', '🥈', '🥉'];

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<GameType>('face_quiz');
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGameScores(activeTab);
      setScores(data);
    } catch {
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const formatScore = (score: number, type: GameType) => {
    if (type === 'reaction') return `${score}ms`;
    if (type === 'face_quiz') return `${score}점`;
    return `${score}점`;
  };

  const tabs: GameType[] = ['face_quiz', 'dot_click', 'reaction', 'watermelon'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-extrabold">주간 랭킹</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-3">매주 월요일 12시 리셋</p>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 py-2 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border-2 border-primary/20 text-muted-foreground'
            }`}
          >
            {GAME_EMOJIS[tab]} {GAME_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Scores */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            불러오는 중...
          </div>
        ) : scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <span className="text-4xl">🎮</span>
            <p className="text-sm">아직 기록이 없어요</p>
            <p className="text-xs">첫 번째 도전자가 되어보세요!</p>
          </div>
        ) : (
          scores.map((s, i) => (
            <Card key={s.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${
              i === 0 ? 'border-yellow-400 bg-yellow-50' :
              i === 1 ? 'border-gray-300 bg-gray-50' :
              i === 2 ? 'border-amber-600 bg-amber-50' :
              'border-primary/10'
            }`}>
              <span className="text-2xl w-8 text-center">
                {i < 3 ? MEDAL[i] : `${i + 1}`}
              </span>
              <span className="flex-1 font-semibold truncate">{s.player_name}</span>
              <span className={`font-bold text-lg ${
                i === 0 ? 'text-yellow-600' :
                i === 1 ? 'text-gray-500' :
                i === 2 ? 'text-amber-700' :
                'text-primary'
              }`}>
                {formatScore(s.score, activeTab)}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
