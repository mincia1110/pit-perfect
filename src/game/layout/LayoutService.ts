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
    const carScale = portrait ? Math.min(width / 480, height / 980) : Math.min(width / 900, height / 760);
    const car = { x: width / 2, y: portrait ? height * 0.38 : height * 0.52, scale: carScale * 0.72, angle: portrait ? 0 : -90 };
    const wheelOffsetX = portrait ? 94 * car.scale : 210 * car.scale;
    const wheelOffsetY = portrait ? 180 * car.scale : 90 * car.scale;
    const wheels = portrait
      ? {
          FRONT_LEFT: { x: car.x - wheelOffsetX, y: car.y - wheelOffsetY },
          REAR_LEFT: { x: car.x - wheelOffsetX, y: car.y + wheelOffsetY },
          FRONT_RIGHT: { x: car.x + wheelOffsetX, y: car.y - wheelOffsetY },
          REAR_RIGHT: { x: car.x + wheelOffsetX, y: car.y + wheelOffsetY },
        }
      : {
          FRONT_LEFT: { x: car.x - wheelOffsetY, y: car.y - wheelOffsetX },
          REAR_LEFT: { x: car.x + wheelOffsetY, y: car.y - wheelOffsetX },
          FRONT_RIGHT: { x: car.x - wheelOffsetY, y: car.y + wheelOffsetX },
          REAR_RIGHT: { x: car.x + wheelOffsetY, y: car.y + wheelOffsetX },
        };
    const laneY = activeRight ? 1 : -1;
    return {
      orientation: portrait ? 'portrait' : 'landscape',
      car,
      wheels,
      operators: portrait
        ? { A: { x: activeRight ? width * 0.82 : width * 0.18, y: car.y - wheelOffsetY }, B: { x: activeRight ? width * 0.82 : width * 0.18, y: car.y + wheelOffsetY } }
        : { A: { x: car.x - 140 * car.scale, y: car.y + laneY * 260 * car.scale }, B: { x: car.x + 140 * car.scale, y: car.y + laneY * 260 * car.scale } },
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
