export type EndGameOutcome = "win" | "lose";

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Could not find #${id} in index.html`);
  return element as T;
}

/**
 * Controls the win/lose modal defined in index.html. Kept out of Game.ts so
 * the render loop doesn't have to know about DOM details.
 */
export class EndGameOverlay {
  private readonly overlay = requireElement<HTMLDivElement>("endgame-overlay");
  private readonly card = requireElement<HTMLDivElement>("endgame-card");
  private readonly title = requireElement<HTMLDivElement>("endgame-title");
  private readonly subtitle = requireElement<HTMLDivElement>("endgame-subtitle");
  private readonly restartButton = requireElement<HTMLButtonElement>("endgame-restart");

  constructor(onRestart: () => void) {
    this.restartButton.addEventListener("click", () => {
      // A focused <button> re-activates itself when Space is released, even
      // while hidden — CSS opacity/pointer-events don't affect keyboard
      // focus. Without this blur, pressing Space to jump right after
      // clicking OK silently re-clicks OK and resets the round again.
      this.restartButton.blur();
      this.hide();
      onRestart();
    });
  }

  show(outcome: EndGameOutcome, message: string): void {
    this.card.classList.remove("win", "lose");
    this.card.classList.add(outcome);
    this.title.textContent = outcome === "win" ? "YOU WIN" : "YOU LOSE";
    this.subtitle.textContent = message;
    this.overlay.classList.remove("hidden");
  }

  hide(): void {
    this.overlay.classList.add("hidden");
  }
}
