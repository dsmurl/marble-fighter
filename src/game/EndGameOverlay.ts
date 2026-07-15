import * as Store from "./Store";

export type EndGameOutcome = "win" | "lose";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "long-spring", name: "Long Spring", description: "Doubles the glove's reach.", price: 20 },
  { id: "coffee", name: "Coffee", description: "Doubles punch speed.", price: 20 },
  { id: "halo", name: "Halo", description: "Hover at a jump's peak while holding jump.", price: 20 },
];

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
  private readonly store = requireElement<HTMLDivElement>("endgame-store");
  private readonly restartButton = requireElement<HTMLButtonElement>("endgame-restart");
  /** Called after every successful purchase — e.g. to refresh the HUD and apply item effects. */
  private readonly onPurchase: () => void;

  constructor(onRestart: () => void, onPurchase: () => void) {
    this.onPurchase = onPurchase;
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

    if (outcome === "win") {
      this.store.classList.remove("hidden");
      this.renderStore();
    } else {
      this.store.classList.add("hidden");
      this.store.innerHTML = "";
    }
  }

  hide(): void {
    this.overlay.classList.add("hidden");
  }

  /** Rebuilds the 3 item cards from the current Store state — call after any purchase too. */
  private renderStore(): void {
    const state = Store.getState();
    this.store.innerHTML = "";

    for (const item of SHOP_ITEMS) {
      const owned = state.ownedItems.includes(item.id);
      const affordable = state.money >= item.price;

      const cardEl = document.createElement("div");
      cardEl.className = owned ? "item-card owned" : "item-card";

      const nameEl = document.createElement("div");
      nameEl.className = "item-card-name";
      nameEl.textContent = item.name;

      const descEl = document.createElement("div");
      descEl.className = "item-card-desc";
      descEl.textContent = item.description;

      const buyButton = document.createElement("button");
      buyButton.className = "item-card-buy";
      buyButton.dataset.itemId = item.id;
      if (owned) {
        buyButton.textContent = "Owned";
        buyButton.disabled = true;
      } else {
        buyButton.textContent = `Buy $${item.price}`;
        buyButton.disabled = !affordable;
        buyButton.addEventListener("click", () => {
          if (!Store.buyItem(item.id, item.price)) return;
          // A single visit can buy more than one item, so re-render in place
          // rather than closing the dialog — the just-bought card darkens
          // and the remaining two re-evaluate affordability immediately.
          this.renderStore();
          this.onPurchase();
        });
      }

      cardEl.append(nameEl, descEl, buyButton);
      this.store.append(cardEl);
    }
  }
}
