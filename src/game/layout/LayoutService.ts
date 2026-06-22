import type { PitStopSnapshot, WheelPosition } from '../../core';

export interface GameLayout {
  orientation: 'portrait' | 'landscape';
  car: { x: number; y: number; scale: number; angle: number };
  wheels: Record<WheelPosition, { x: number; y: number }>;
  operators: { A: { x: number; y: number }; B: { x: number; y: number } };
}

// Natural size of the cutout car asset (original-hypercar-cutout.png).
const CAR_NATURAL = 900;
// Wheel hub positions in pixels relative to the car image center, measured from
// the generated hypercar art. Front/rear differ because the wheelbase is biased
// rearward in the source image.
const WHEEL_X = 200;
const WHEEL_Y_FRONT = -215;
const WHEEL_Y_REAR = 256;
// Sprite scales relative to the car scale (tuned for the cutout asset).
const OPERATOR_SCALE = 0.5;
const WHEEL_SCALE = 0.82;

interface Point {
  x: number;
  y: number;
}

function rotate(offset: Point, angleDeg: number): Point {
  if (angleDeg === 0) return offset;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: offset.x * cos - offset.y * sin, y: offset.x * sin + offset.y * cos };
}

function wheelOffset(position: WheelPosition): Point {
  const rear = position.includes('REAR');
  const right = position.includes('RIGHT');
  return { x: right ? WHEEL_X : -WHEEL_X, y: rear ? WHEEL_Y_REAR : WHEEL_Y_FRONT };
}

export class LayoutService {
  carSpriteScale = 0;
  operatorScale = 0;
  wheelScale = 0;

  calculate(width: number, height: number, snapshot?: PitStopSnapshot): GameLayout {
    const portrait = height > width;
    const activeRight = snapshot?.activeSide === 'RIGHT';

    // Fit the square car asset into the available play area, leaving room for the
    // top HUD and the bottom touch zones.
    const fit = portrait
      ? Math.min(width * 0.82, height * 0.58)
      : Math.min(width * 0.6, height * 0.74);
    const scale = fit / CAR_NATURAL;
    this.carSpriteScale = scale;
    this.operatorScale = scale * OPERATOR_SCALE;
    this.wheelScale = scale * WHEEL_SCALE;

    const angle = 0;
    const car = {
      x: width / 2,
      y: portrait ? height * 0.4 : height * 0.48,
      scale,
      angle,
    };

    const wheels = this.placeWheels(car, angle);
    const operators = this.placeOperators(car, wheels, activeRight);

    return {
      orientation: portrait ? 'portrait' : 'landscape',
      car,
      wheels,
      operators,
    };
  }

  private placeWheels(car: { x: number; y: number; scale: number; angle: number }, angle: number): Record<WheelPosition, Point> {
    const positions = ['FRONT_LEFT', 'REAR_LEFT', 'FRONT_RIGHT', 'REAR_RIGHT'] as const;
    const result = {} as Record<WheelPosition, Point>;
    for (const position of positions) {
      const offset = wheelOffset(position);
      const rotated = rotate(offset, angle);
      result[position] = {
        x: car.x + rotated.x * car.scale,
        y: car.y + rotated.y * car.scale,
      };
    }
    return result;
  }

  // Stand each crew member just outboard of the active-side wheels so the pair
  // visually travels with the service side at crossover.
  private placeOperators(car: Point, wheels: Record<WheelPosition, Point>, activeRight: boolean): { A: Point; B: Point } {
    const front = activeRight ? wheels.FRONT_RIGHT : wheels.FRONT_LEFT;
    const rear = activeRight ? wheels.REAR_RIGHT : wheels.REAR_LEFT;
    const midX = (front.x + rear.x) / 2;
    const midY = (front.y + rear.y) / 2;
    let dirX = midX - car.x;
    let dirY = midY - car.y;
    const len = Math.hypot(dirX, dirY) || 1;
    dirX /= len;
    dirY /= len;
    const outset = 96 * this.carSpriteScale;
    return {
      A: { x: front.x + dirX * outset, y: front.y + dirY * outset },
      B: { x: rear.x + dirX * outset, y: rear.y + dirY * outset },
    };
  }
}
