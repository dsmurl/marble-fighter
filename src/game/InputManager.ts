// Keys the game reads directly. Their default browser behavior is
// suppressed on keydown — notably, Space activating whatever element
// currently has DOM focus (e.g. the end-game modal's OK button re-clicking
// itself on keyup), and Space/arrows scrolling the page.
const GAME_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

/**
 * Tracks which keys are currently held down.
 * Kept intentionally dumb — no key-mapping config, no rebinding UI.
 * Add that later if you need it.
 */
export class InputManager {
  private readonly heldKeys = new Set<string>();
  private readonly justPressedKeys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (event) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();

      // event.repeat also covers this, but checking heldKeys ourselves means
      // we don't depend on the browser's OS-level key-repeat timing at all.
      if (!this.heldKeys.has(event.code)) {
        this.justPressedKeys.add(event.code);
      }
      this.heldKeys.add(event.code);
    });
    window.addEventListener("keyup", (event) => {
      this.heldKeys.delete(event.code);
    });
    // Prevent focus loss / scrolling from eating input on blur.
    window.addEventListener("blur", () => this.heldKeys.clear());
  }

  isDown(code: string): boolean {
    return this.heldKeys.has(code);
  }

  /** True only on the frame the key transitioned from up to down — for one-shot actions like jumping. */
  wasJustPressed(code: string): boolean {
    return this.justPressedKeys.has(code);
  }

  /** Clears the "just pressed" edge state. Call once per frame after input has been read. */
  endFrame(): void {
    this.justPressedKeys.clear();
  }

  /** Injects a one-frame "just pressed" edge for a virtual key — e.g. an on-screen touch button. */
  simulateKeyPress(code: string): void {
    this.justPressedKeys.add(code);
  }

  /** Marks a virtual key held — e.g. an on-screen touch button — so isDown() reflects it like a real keydown. */
  simulateKeyDown(code: string): void {
    if (!this.heldKeys.has(code)) {
      this.justPressedKeys.add(code);
    }
    this.heldKeys.add(code);
  }

  /** Releases a virtual key held via simulateKeyDown(). */
  simulateKeyUp(code: string): void {
    this.heldKeys.delete(code);
  }

  /** Returns a -1..1 axis value for a pair of opposing keys. */
  getAxis(negativeCode: string, positiveCode: string): number {
    let value = 0;
    if (this.isDown(negativeCode)) value -= 1;
    if (this.isDown(positiveCode)) value += 1;
    return value;
  }
}
