import type { InputManager } from "./InputManager";

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Could not find #${id} in index.html`);
  return element as T;
}

/** True when the primary pointing device is touch, not a precise mouse/trackpad. */
function isTouchPrimary(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

const MAX_KNOB_RADIUS = 45;
const DEADZONE = 0.15;

/**
 * On-screen joystick (bottom-left, roll) + jump button (bottom-right) for
 * touch devices. Only shown when the primary pointer is coarse — desktop
 * mouse/trackpad users never see these. Punch-by-tap needs no touch-specific
 * code at all: Babylon's pointer events already unify mouse and touch, and
 * these controls live in their own DOM elements, so a joystick drag or jump
 * tap never reaches the canvas underneath to also trigger a punch.
 */
export class TouchControls {
  readonly active: boolean;

  private readonly joystickBase = requireElement<HTMLDivElement>("touch-joystick");
  private readonly joystickKnob = requireElement<HTMLDivElement>("touch-joystick-knob");
  private readonly jumpButton = requireElement<HTMLButtonElement>("touch-jump-button");

  private joystickPointerId: number | null = null;
  private joystickCenterX = 0;
  private joystickCenterY = 0;
  private jumpPointerId: number | null = null;

  forwardAxis = 0;
  rightAxis = 0;

  constructor(input: InputManager) {
    this.active = isTouchPrimary();
    if (!this.active) return;

    this.joystickBase.classList.remove("control-hidden");
    this.jumpButton.classList.remove("control-hidden");
    requireElement("hud-controls-desktop").classList.add("control-hidden");
    requireElement("hud-controls-touch").classList.remove("control-hidden");

    this.joystickBase.addEventListener("pointerdown", this.handleJoystickDown);
    window.addEventListener("pointermove", this.handleJoystickMove);
    window.addEventListener("pointerup", this.handleJoystickUp);
    window.addEventListener("pointercancel", this.handleJoystickUp);

    // Held (not a one-shot press) so isDown("Space") stays true for as long
    // as the finger stays down — items like Halo's apex-hover depend on
    // Space being sustained, not just edge-triggered.
    this.jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.jumpPointerId = event.pointerId;
      input.simulateKeyDown("Space");
    });
    window.addEventListener("pointerup", (event) => {
      if (event.pointerId !== this.jumpPointerId) return;
      this.jumpPointerId = null;
      input.simulateKeyUp("Space");
    });
    window.addEventListener("pointercancel", (event) => {
      if (event.pointerId !== this.jumpPointerId) return;
      this.jumpPointerId = null;
      input.simulateKeyUp("Space");
    });
  }

  private readonly handleJoystickDown = (event: PointerEvent): void => {
    if (this.joystickPointerId !== null) return;
    event.preventDefault();
    this.joystickPointerId = event.pointerId;
    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickCenterX = rect.left + rect.width / 2;
    this.joystickCenterY = rect.top + rect.height / 2;
    this.updateFromPointer(event);
  };

  private readonly handleJoystickMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) return;
    this.updateFromPointer(event);
  };

  private readonly handleJoystickUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) return;
    this.joystickPointerId = null;
    this.forwardAxis = 0;
    this.rightAxis = 0;
    this.joystickKnob.style.transform = "translate(-50%, -50%)";
  };

  private updateFromPointer(event: PointerEvent): void {
    let dx = event.clientX - this.joystickCenterX;
    let dy = event.clientY - this.joystickCenterY;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_KNOB_RADIUS) {
      dx = (dx / dist) * MAX_KNOB_RADIUS;
      dy = (dy / dist) * MAX_KNOB_RADIUS;
    }
    this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    if (Math.min(dist / MAX_KNOB_RADIUS, 1) < DEADZONE) {
      this.forwardAxis = 0;
      this.rightAxis = 0;
      return;
    }
    // Screen-space drag: right = +rightAxis, dragging up the screen (away
    // from the player, dy negative) = +forwardAxis.
    this.rightAxis = dx / MAX_KNOB_RADIUS;
    this.forwardAxis = -dy / MAX_KNOB_RADIUS;
  }
}
