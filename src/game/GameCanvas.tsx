import { useEffect, useRef } from 'react';
import { GameEngine } from './GameEngine';
import type { HudState } from './types';

interface Props {
  onHudChange: (state: HudState) => void;
}

export default function GameCanvas({ onHudChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new GameEngine(canvasRef.current, onHudChange);
    return () => game.dispose();
  }, [onHudChange]);

  return <canvas ref={canvasRef} className="game-canvas" />;
}
