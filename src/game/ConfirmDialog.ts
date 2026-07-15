function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Could not find #${id} in index.html`);
  return element as T;
}

/**
 * A yes/no modal styled like the win/lose overlay, so nothing in the game
 * falls back to a native browser confirm() dialog.
 */
export class ConfirmDialog {
  private readonly overlay = requireElement<HTMLDivElement>("confirm-overlay");
  private readonly subtitle = requireElement<HTMLDivElement>("confirm-subtitle");
  private readonly cancelButton = requireElement<HTMLButtonElement>("confirm-cancel");
  private readonly confirmButton = requireElement<HTMLButtonElement>("confirm-ok");

  /** Resolves true if the user confirms, false if they cancel. */
  show(message: string): Promise<boolean> {
    this.subtitle.textContent = message;
    this.overlay.classList.remove("hidden");

    return new Promise((resolve) => {
      const settle = (result: boolean) => {
        // Same reasoning as EndGameOverlay's restart button: a focused
        // button re-activates itself when Space is released even while
        // hidden, which would otherwise fire a phantom jump right after.
        this.cancelButton.blur();
        this.confirmButton.blur();
        this.cancelButton.removeEventListener("click", onCancel);
        this.confirmButton.removeEventListener("click", onConfirm);
        this.overlay.classList.add("hidden");
        resolve(result);
      };
      const onCancel = () => settle(false);
      const onConfirm = () => settle(true);
      this.cancelButton.addEventListener("click", onCancel);
      this.confirmButton.addEventListener("click", onConfirm);
    });
  }
}
