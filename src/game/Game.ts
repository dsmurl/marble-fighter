import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HavokPlugin,
  ArcRotateCamera,
  Ray,
  Matrix,
  Plane,
  PointerEventTypes,
  TransformNode,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { createArena } from "./Arena";
import type { Arena } from "./Arena";
import { Marble } from "./Marble";
import { InputManager } from "./InputManager";
import { createCameraRig, updateCameraTarget } from "./CameraRig";
import { AIController } from "./AIController";
import { EndGameOverlay } from "./EndGameOverlay";
import { Glove } from "./Glove";
import { createCrown, createDunceCap, updateHeadwearPosition } from "./Headwear";
import { SoundEffects } from "./SoundEffects";
import { TouchControls } from "./TouchControls";
import * as Store from "./Store";

const ROLL_FORCE = 9;
// Calibrated so the apex lands ~1.75x the ball's diameter above the ground
// (diameter 1.2 → ~2.1 units, half the previous jump height), verified with
// a fixed-timestep physics step.
const JUMP_IMPULSE = 8.95;
const PUNCH_IMPULSE = 8;
const GROUND_RAY_LENGTH = 0.85;
const PLAYER_START_POSITION = new Vector3(-3, 2, 0);
const OPPONENT_START_POSITION = new Vector3(3, 2, 0);

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly canvas: HTMLCanvasElement;
  private readonly input = new InputManager();
  private readonly touchControls = new TouchControls(this.input);
  private readonly endGameOverlay = new EndGameOverlay(
    () => this.resetRound(),
    () => this.onItemPurchased(),
  );
  private readonly sounds = new SoundEffects();
  private readonly moneyDisplay = document.getElementById("hud-money") as HTMLDivElement;
  private readonly resetButton = document.getElementById("hud-reset") as HTMLButtonElement;

  private camera!: ArcRotateCamera;
  private arena!: Arena;
  private player!: Marble;
  private opponent!: Marble;
  private opponentAI!: AIController;
  private playerGlove!: Glove;
  private opponentGlove!: Glove;
  private playerCrown!: TransformNode;
  private opponentDunceCap!: TransformNode;

  private roundOver = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { stencil: true }, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.04, 0.04, 0.07, 1);
  }

  async start(): Promise<void> {
    await this.initPhysics();
    this.buildScene();
    this.registerPunchInput();
    this.registerResetButton();
    this.registerLoop();
    window.addEventListener("resize", () => this.engine.resize());
  }

  /** Only clears store money/items — must never touch round state (player/opponent position, roundOver). */
  private registerResetButton(): void {
    this.resetButton.addEventListener("click", () => {
      if (!confirm("Reset your money and items?")) return;
      Store.reset();
      this.updateMoneyDisplay();
    });
  }

  private async initPhysics(): Promise<void> {
    // Havok ships as a wasm module; @babylonjs/havok wraps loading it.
    const havokInstance = await HavokPhysics();
    const plugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -18, 0), plugin);
  }

  private buildScene(): void {
    this.camera = createCameraRig(this.scene, this.canvas);
    this.arena = createArena(this.scene);

    this.player = new Marble(
      this.scene,
      {
        name: "player",
        color: Color3.FromHexString("#4fc3f7"),
        startPosition: PLAYER_START_POSITION,
      },
      this.arena.shadowGenerator,
    );

    this.opponent = new Marble(
      this.scene,
      {
        name: "opponent",
        color: Color3.FromHexString("#ff6f6f"),
        startPosition: OPPONENT_START_POSITION,
      },
      this.arena.shadowGenerator,
    );

    this.playerGlove = new Glove({ scene: this.scene, name: "playerGlove", ballRadius: this.player.radius });
    this.opponentGlove = new Glove({ scene: this.scene, name: "opponentGlove", ballRadius: this.opponent.radius });
    this.opponentAI = new AIController(this.opponent, this.opponentGlove);

    this.playerCrown = createCrown(this.scene, "playerCrown", this.player.radius);
    this.opponentDunceCap = createDunceCap(this.scene, "opponentDunceCap", this.opponent.radius);

    this.updateMoneyDisplay();
    this.applyOwnedItemEffects();
  }

  /**
   * Re-applies every owned item's effect to the player's already-built
   * glove/marble — called once on scene build and again after every
   * purchase, since the glove is never rebuilt by resetRound. Never touches
   * opponentGlove/opponent.
   */
  private applyOwnedItemEffects(): void {
    this.playerGlove.setReachMultiplier(Store.ownsItem("long-spring") ? 2 : 1);
  }

  /** Refreshes the HUD's money readout from the Store — call after any change to money. */
  private updateMoneyDisplay(): void {
    this.moneyDisplay.textContent = `$${Store.getState().money}`;
  }

  /** Fired by EndGameOverlay after every successful win-dialog purchase. */
  private onItemPurchased(): void {
    this.updateMoneyDisplay();
    this.applyOwnedItemEffects();
  }

  /** Left-click throws a punch toward wherever the pointer is on the arena plane. */
  private registerPunchInput(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
      if (pointerInfo.event.button !== 0 || this.roundOver) return;
      this.tryPlayerPunch();
    });
  }

  private tryPlayerPunch(): void {
    if (!this.playerGlove.canPunch()) return;

    const direction = this.pointerGroundDirectionFromPlayer();
    if (!direction) return;
    this.playerGlove.punch(direction);
  }

  /** World-space direction from the player to wherever the pointer ray meets the player's height plane. */
  private pointerGroundDirectionFromPlayer(): Vector3 | null {
    const playerPosition = this.player.getPosition();
    const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.camera);
    const plane = Plane.FromPositionAndNormal(new Vector3(0, playerPosition.y, 0), Vector3.Up());

    const distance = ray.intersectsPlane(plane);
    if (distance === null) return null;

    const point = ray.origin.add(ray.direction.scale(distance));
    const direction = point.subtract(playerPosition);
    direction.y = 0;
    if (direction.lengthSquared() < 0.0001) return null;

    return direction.normalize();
  }

  private registerLoop(): void {
    this.engine.runRenderLoop(() => {
      const now = performance.now();
      this.updateGrounded(now);
      this.updateShadows();
      this.updateHeadwear();
      if (!this.roundOver) {
        this.handlePlayerInput();
        this.opponentAI.update(this.player.getPosition());
        this.checkRingOut();
        updateCameraTarget(this.camera, this.player.getPosition());

        if (this.playerGlove.consumeJustStarted()) this.sounds.playWhoosh();
        if (this.opponentGlove.consumeJustStarted()) this.sounds.playWhoosh();

        const deltaMs = this.engine.getDeltaTime();
        this.playerGlove.update(deltaMs, this.player.getPosition(), this.opponent, (direction) => {
          this.opponent.applyPunchImpulse(direction, PUNCH_IMPULSE);
          this.sounds.playHit();
          Store.addMoney(5);
          this.updateMoneyDisplay();
        });
        this.opponentGlove.update(deltaMs, this.opponent.getPosition(), this.player, (direction) => {
          this.player.applyPunchImpulse(direction, PUNCH_IMPULSE);
          this.sounds.playHit();
        });
      }
      // Always clear "just pressed" edge state, even while the round-over
      // modal is up — otherwise a Space press during that window (e.g. right
      // as the player fell off) sits stale and fires a phantom jump the
      // instant the round resets and input handling resumes.
      this.input.endFrame();
      this.scene.render();
    });
  }

  /** Raycasts straight down from each marble to know if it's touching the platform. */
  private updateGrounded(now: number): void {
    for (const marble of [this.player, this.opponent]) {
      const origin = marble.getPosition().add(new Vector3(0, 0.05, 0));
      const ray = new Ray(origin, Vector3.Down(), marble.radius + GROUND_RAY_LENGTH);
      const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.arena.platform);
      marble.setGrounded(Boolean(hit?.hit), now);
    }
  }

  private updateShadows(): void {
    this.player.updateShadowVisibility();
    this.opponent.updateShadowVisibility();
  }

  /** Keeps the crown/dunce cap sitting on top of their ball, unaffected by its rolling rotation. */
  private updateHeadwear(): void {
    updateHeadwearPosition(this.playerCrown, this.player.getPosition(), this.player.radius);
    updateHeadwearPosition(this.opponentDunceCap, this.opponent.getPosition(), this.opponent.radius);
  }

  private handlePlayerInput(): void {
    const forwardAxis =
      this.input.getAxis("KeyS", "KeyW") ||
      this.input.getAxis("ArrowDown", "ArrowUp") ||
      this.touchControls.forwardAxis;
    const rightAxis =
      this.input.getAxis("KeyA", "KeyD") ||
      this.input.getAxis("ArrowLeft", "ArrowRight") ||
      this.touchControls.rightAxis;

    if (forwardAxis !== 0 || rightAxis !== 0) {
      // Move relative to camera yaw so "forward" always means "away from camera".
      const forward = this.camera.getDirection(Vector3.Forward());
      forward.y = 0;
      forward.normalize();
      const right = Vector3.Cross(Vector3.Up(), forward);

      const moveDirection = forward.scale(forwardAxis).add(right.scale(rightAxis));
      this.player.applyRollForce(moveDirection, ROLL_FORCE);
    }

    // wasJustPressed (not isDown) — otherwise holding Space re-fires the
    // impulse every frame the ball is still technically grounded/coyote-
    // eligible, before physics has had a chance to actually lift it off,
    // stacking several jumps' worth of velocity into one launch.
    if (this.input.wasJustPressed("Space") && this.player.canJump(performance.now())) {
      this.player.applyJumpImpulse(JUMP_IMPULSE);
      this.sounds.playBoing();
    }
  }

  private checkRingOut(): void {
    const fellOff = (marble: Marble) => marble.getPosition().y < -6;

    if (fellOff(this.opponent)) {
      this.endRound("win", "The opponent fell off the platform.");
    } else if (fellOff(this.player)) {
      this.endRound("lose", "You fell off the platform.");
    }
  }

  private endRound(outcome: "win" | "lose", message: string): void {
    this.roundOver = true;
    // Stop any residual momentum so nothing keeps sliding around behind the modal.
    this.player.freeze();
    this.opponent.freeze();
    this.endGameOverlay.show(outcome, message);
  }

  private resetRound(): void {
    this.player.reset(PLAYER_START_POSITION.clone());
    this.opponent.reset(OPPONENT_START_POSITION.clone());
    this.roundOver = false;
  }
}
