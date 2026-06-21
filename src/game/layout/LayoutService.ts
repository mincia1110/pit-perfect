import type { PitStopSnapshot, WheelPosition } from '../../core';

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameLayout {
  orientation: 'portrait' | 'landscape';
  car: { x: number; y: number; scale: number; angle: number };
  wheels: Record<WheelPosition, { x: number; y: number }>;
  operators: { A: { x: number; y: number }; B: { x: number; y: number } };
  touch: { left: LayoutRect; center: LayoutRect; right: LayoutRect };
  timer: { x: number; y: number };
  message: { x: number; y: number };
}

export class LayoutService {
  calculate(width: number, height: number, snapshot?: PitStopSnapshot): GameLayout {
    const portrait = height > width;
    const activeRight = snapshot?.activeSide === 'RIGHT';
    const carScale = portrait ? Math.min(width / 480, height / 980) : Math.min(width / 720, height / 900);
    const car = { x: width / 2, y: portrait ? height * 0.38 : height * 0.46, scale: carScale * 0.72, angle: 0 };
    const wheelOffsetX = 94 * car.scale;
    const wheelOffsetY = 180 * car.scale;
    const wheels = {
      FRONT_LEFT: { x: car.x - wheelOffsetX, y: car.y - wheelOffsetY },
      REAR_LEFT: { x: car.x - wheelOffsetX, y: car.y + wheelOffsetY },
      FRONT_RIGHT: { x: car.x + wheelOffsetX, y: car.y - wheelOffsetY },
      REAR_RIGHT: { x: car.x + wheelOffsetX, y: car.y + wheelOffsetY },
    };
    const operatorX = activeRight ? Math.min(width - 72 * car.scale, car.x + 214 * car.scale) : Math.max(72 * car.scale, car.x - 214 * car.scale);
    return {
      orientation: portrait ? 'portrait' : 'landscape',
      car,
      wheels,
      operators: { A: { x: operatorX, y: car.y - wheelOffsetY }, B: { x: operatorX, y: car.y + wheelOffsetY } },
      touch: {
        left: { x: 0, y: height * 0.68, width: width * 0.42, height: height * 0.32 },
        center: { x: width * 0.42, y: height * 0.68, width: width * 0.16, height: height * 0.32 },
        right: { x: width * 0.58, y: height * 0.68, width: width * 0.42, height: height * 0.32 },
      },
      timer: { x: width / 2, y: portrait ? 54 : 44 },
      message: { x: width / 2, y: portrait ? height * 0.62 : height * 0.84 },
    };
  }
}
