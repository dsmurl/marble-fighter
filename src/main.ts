import { Game } from "./game/Game";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error("Could not find #renderCanvas in index.html");
}

const game = new Game(canvas);
game.start().catch((error) => {
  console.error("Failed to start Marble Fighter:", error);
});
