'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveGameScore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const FRUITS = [
  { level: 1, r: 20,  color: '#fca5a5' },
  { level: 2, r: 28,  color: '#fdba74' },
  { level: 3, r: 38,  color: '#fde68a' },
  { level: 4, r: 49,  color: '#86efac' },
  { level: 5, r: 61,  color: '#67e8f9' },
  { level: 6, r: 74,  color: '#a5b4fc' },
  { level: 7, r: 89,  color: '#f9a8d4' },
  { level: 8, r: 106, color: '#6ee7b7' },
];

const IMG_FOLDER = '/game_img2';
// 8개 과일 레벨에 대응하는 이미지 파일명 (확장자 포함)
const FRUIT_IMGS = ['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', '6_1.jpeg', '7_1.jpeg', '8_1.jpeg'];
const FACE_CROP_RATIO = 1;
const WALL_T = 20;
const DANGER_Y = 80;
const DANGER_SEC = 3;
const HUD_H = 96; // HUD 영역 높이 추정값 (pt-10 + 버튼 행)

// 480px 이하: 좌우 20px 여백 후 가득, 높이는 HUD 제외 가득
function calcCanvasSize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = vw <= 480 ? vw - 40 : Math.min(vw - 40, 440);
  const h = vh - HUD_H - 38; // 8 기본 + 30 하단 여백
  return { w: Math.max(w, 260), h: Math.max(h, 400) };
}

interface WatermelonGameProps {
  playerName: string;
  onBack: () => void;
}

type Phase = 'intro' | 'playing' | 'result';
type MatterModule = typeof import('matter-js');

export function WatermelonGame({ playerName, onBack }: WatermelonGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [savedScore, setSavedScore] = useState(false);
  const [nextLevel, setNextLevel] = useState(1);
  const [faceImgsReady, setFaceImgsReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<MatterModule['Engine']['create']> | null>(null);
  const renderRef = useRef<ReturnType<MatterModule['Render']['create']> | null>(null);
  const runnerRef = useRef<ReturnType<MatterModule['Runner']['create']> | null>(null);
  const bodiesRef = useRef<Map<number, number>>(new Map());
  const scoreRef = useRef(0);
  const dangerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverRef = useRef(false);
  const matterRef = useRef<MatterModule | null>(null);
  const faceImgsRef = useRef<HTMLImageElement[]>([]);
  // 현재 게임에서 사용 중인 canvas 크기 (matter.js 좌표계와 일치해야 함)
  const cwRef = useRef(340);
  const chRef = useRef(500);
  const lastSpawnTimeRef = useRef(0);

  const preloadFaceImages = useCallback(async () => {
    const imgs = await Promise.all(
      FRUIT_IMGS.map((filename) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = `${IMG_FOLDER}/${filename}`;
        })
      )
    );
    faceImgsRef.current = imgs;
    setFaceImgsReady(true);
    return imgs;
  }, []);

  useEffect(() => { preloadFaceImages(); }, [preloadFaceImages]);

  const stopEngine = useCallback(() => {
    const M = matterRef.current;
    if (!M) return;
    if (renderRef.current) M.Render.stop(renderRef.current);
    if (runnerRef.current) M.Runner.stop(runnerRef.current);
  }, []);

  const endGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current);
    stopEngine();
    setPhase('result');
  }, [stopEngine]);

  const spawnFruit = useCallback((x: number, level: number) => {
    const M = matterRef.current;
    if (!M || !engineRef.current || gameOverRef.current) return;
    const fruit = FRUITS[level - 1];
    const body = M.Bodies.circle(x, DANGER_Y - fruit.r - 5, fruit.r, {
      restitution: 0.3, friction: 0.5, frictionAir: 0.01,
      label: `fruit_${level}`,
      render: { visible: false },
    });
    bodiesRef.current.set(body.id, level);
    M.Composite.add(engineRef.current.world, body);
    setNextLevel(Math.ceil(Math.random() * 4));
  }, []);

  const startGame = useCallback(async () => {
    setScore(0);
    scoreRef.current = 0;
    setSavedScore(false);
    gameOverRef.current = false;
    bodiesRef.current.clear();
    setNextLevel(Math.ceil(Math.random() * 4));

    if (!faceImgsRef.current.length) await preloadFaceImages();

    // canvas 크기 계산 및 적용
    const { w: cw, h: ch } = calcCanvasSize();
    cwRef.current = cw;
    chRef.current = ch;
    if (canvasRef.current) {
      canvasRef.current.width = cw;
      canvasRef.current.height = ch;
    }

    const Matter = await import('matter-js');
    matterRef.current = Matter;
    stopEngine();

    const engine = Matter.Engine.create({ gravity: { y: 1.5 } });
    const render = Matter.Render.create({
      canvas: canvasRef.current!,
      engine,
      options: { width: cw, height: ch, wireframes: false, background: '#fefce8' },
    });
    const runner = Matter.Runner.create();
    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = runner;

    // 벽 (동적 크기 기반)
    const ground = Matter.Bodies.rectangle(cw / 2, ch + WALL_T / 2, cw + WALL_T * 2, WALL_T, {
      isStatic: true, label: 'wall', render: { fillStyle: '#d4a373' },
    });
    const leftWall = Matter.Bodies.rectangle(-WALL_T / 2, ch / 2, WALL_T, ch * 2, {
      isStatic: true, label: 'wall', render: { fillStyle: '#d4a373' },
    });
    const rightWall = Matter.Bodies.rectangle(cw + WALL_T / 2, ch / 2, WALL_T, ch * 2, {
      isStatic: true, label: 'wall', render: { fillStyle: '#d4a373' },
    });
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    // 합체 로직
    const mergeSet = new Set<string>();
    Matter.Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const levelA = bodiesRef.current.get(bodyA.id);
        const levelB = bodiesRef.current.get(bodyB.id);
        if (levelA == null || levelB == null || levelA !== levelB || levelA >= FRUITS.length) continue;
        const key = [bodyA.id, bodyB.id].sort().join('-');
        if (mergeSet.has(key)) continue;
        mergeSet.add(key);

        const newLevel = levelA + 1;
        const cx = (bodyA.position.x + bodyB.position.x) / 2;
        const cy = (bodyA.position.y + bodyB.position.y) / 2;
        Matter.Composite.remove(engine.world, bodyA);
        Matter.Composite.remove(engine.world, bodyB);
        bodiesRef.current.delete(bodyA.id);
        bodiesRef.current.delete(bodyB.id);

        scoreRef.current += newLevel * newLevel * 10;
        setScore(scoreRef.current);

        const newFruit = FRUITS[newLevel - 1];
        const newBody = Matter.Bodies.circle(cx, cy, newFruit.r, {
          restitution: 0.3, friction: 0.5, frictionAir: 0.01,
          label: `fruit_${newLevel}`,
          render: { visible: false },
        });
        bodiesRef.current.set(newBody.id, newLevel);
        Matter.Composite.add(engine.world, newBody);
      }
    });

    // 위험선 감지
    Matter.Events.on(engine, 'afterUpdate', () => {
      if (gameOverRef.current) return;
      const bodies = Matter.Composite.allBodies(engine.world);
      const overDanger = bodies.some(
        (b) => !b.isStatic && b.position.y - (b.circleRadius ?? 0) < DANGER_Y
      );
      if (overDanger) {
        if (!dangerTimerRef.current)
          dangerTimerRef.current = setTimeout(() => endGame(), DANGER_SEC * 1000);
      } else {
        if (dangerTimerRef.current) { clearTimeout(dangerTimerRef.current); dangerTimerRef.current = null; }
      }
    });

    // 얼굴 이미지 원형 크롭 렌더링
    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      const currentCw = cwRef.current;
      const bodies = Matter.Composite.allBodies(engine.world);

      for (const body of bodies) {
        if (body.isStatic) continue;
        const level = bodiesRef.current.get(body.id);
        if (level == null) continue;

        const fruit = FRUITS[level - 1];
        const { x, y } = body.position;
        const r = fruit.r;
        const img = faceImgsRef.current[level - 1];

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.clip();

        if (img?.complete && img.naturalWidth > 0) {
          const srcW = img.naturalWidth;
          const srcH = img.naturalHeight * FACE_CROP_RATIO;
          ctx.drawImage(img, 0, 0, srcW, srcH, x - r, y - r, r * 2, r * 2);
        } else {
          ctx.fillStyle = fruit.color;
          ctx.fill();
          ctx.fillStyle = '#374151';
          ctx.font = `bold ${r * 0.7}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(level), x, y);
        }

        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = fruit.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 위험선
      ctx.save();
      ctx.strokeStyle = 'rgba(239,68,68,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, DANGER_Y);
      ctx.lineTo(currentCw, DANGER_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(239,68,68,0.8)';
      ctx.textAlign = 'left';
      ctx.fillText('위험선', 4, DANGER_Y - 4);
      ctx.restore();
    });

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);
    setPhase('playing');
  }, [endGame, stopEngine, preloadFaceImages]);

  useEffect(() => {
    if (phase === 'result' && !savedScore) {
      setSavedScore(true);
      saveGameScore(playerName, 'watermelon', scoreRef.current).catch(() => {});
    }
  }, [phase, savedScore, playerName]);

  useEffect(() => {
    return () => {
      stopEngine();
      if (dangerTimerRef.current) clearTimeout(dangerTimerRef.current);
    };
  }, [stopEngine]);

  const getDropX = (clientX: number, rect: DOMRect, level: number) => {
    // CSS 표시 크기 → canvas 내부 좌표로 변환
    const scaleX = cwRef.current / rect.width;
    const r = FRUITS[level - 1].r;
    return Math.max(r + 5, Math.min(cwRef.current - r - 5, (clientX - rect.left) * scaleX));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing' || gameOverRef.current) return;
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < 300) return; // touch 후 발화되는 synthetic click 무시
    lastSpawnTimeRef.current = now;
    spawnFruit(getDropX(e.clientX, canvasRef.current!.getBoundingClientRect(), nextLevel), nextLevel);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing' || gameOverRef.current) return;
    e.preventDefault();
    lastSpawnTimeRef.current = Date.now();
    spawnFruit(getDropX(e.touches[0].clientX, canvasRef.current!.getBoundingClientRect(), nextLevel), nextLevel);
  };

  const nextImg = `${IMG_FOLDER}/${FRUIT_IMGS[nextLevel - 1]}`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 via-background to-emerald-50">

      {/* 인트로 */}
      {phase === 'intro' && (
        <>
          <button onClick={onBack} className="self-start m-4 mt-10 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pb-8">
            <div className="flex gap-2 items-end">
              {[1, 2, 3, 2, 1].map((lvl, i) => {
                const sz = FRUITS[lvl - 1].r * 1.4;
                return (
                  <div key={i} className="rounded-full overflow-hidden border-2 border-green-300 flex-shrink-0"
                    style={{ width: sz, height: sz }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${IMG_FOLDER}/${FRUIT_IMGS[lvl - 1]}`} alt="" className="w-full object-cover object-top"
                      style={{ height: '200%' }} />
                  </div>
                );
              })}
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold">수박 게임</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                같은 얼굴끼리 합치면 더 커져요!<br />
                화면을 탭해서 떨어뜨리세요.<br />
                <span className="text-xs">빨간 선 위에 3초 있으면 게임 오버</span>
              </p>
            </div>
            <Button onClick={startGame} disabled={!faceImgsReady}
              className="h-14 px-10 rounded-2xl text-lg font-semibold">
              {faceImgsReady ? '시작!' : '이미지 로딩 중...'}
            </Button>
          </div>
        </>
      )}

      {/* 결과 */}
      {phase === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <span className="text-6xl">{scoreRef.current >= 500 ? '🏆' : scoreRef.current >= 200 ? '🎉' : '😅'}</span>
          <div className="text-center space-y-1">
            <p className="text-3xl font-extrabold">{scoreRef.current}점</p>
            <p className="text-muted-foreground text-sm">게임 오버!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="h-12 px-6 rounded-2xl font-semibold">나가기</Button>
            <Button onClick={startGame} className="h-12 px-6 rounded-2xl font-semibold">다시 하기</Button>
          </div>
        </div>
      )}

      {/* 게임 화면 — canvas는 항상 DOM에 존재 */}
      <div
        style={{ display: phase === 'playing' ? 'flex' : 'none' }}
        className="flex-1 flex-col"
      >
        {/* HUD */}
        <div className="flex items-center justify-between px-5 pt-10 pb-2">
          <button onClick={() => { endGame(); onBack(); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">다음</span>
            <div className="rounded-full overflow-hidden border-2 border-green-300 flex-shrink-0"
              style={{ width: 40, height: 40 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nextImg} alt="next" className="w-full object-cover object-top" style={{ height: '200%' }} />
            </div>
            <span className="font-bold text-lg text-primary">{score}점</span>
          </div>
        </div>

        {/* 캔버스: 좌우 20px 패딩, 높이는 남은 공간 전체 */}
        <div className="flex justify-center px-5 pb-8 flex-1">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onTouchStart={handleCanvasTouch}
            className="rounded-2xl border-2 border-green-200 shadow-md cursor-crosshair touch-none block"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
