import { Vector3 } from "@babylonjs/core";
import { Marble } from "./Marble";
import { Glove } from "./Glove";

/**
 * Intentionally simple: this is a starting point, not a serious opponent AI.
 * It charges straight at the player once within `aggroRange`, otherwise
 * ambles toward the arena center, and throws a punch whenever the player is
 * within its glove's reach and the glove is off cooldown. Swap this out for
 * steering behaviors, a state machine, or nav-mesh pathing as the game grows.
 */
export class AIController {
  private readonly marble: Marble;
  private readonly glove: Glove;
  private readonly aggroRange: number;
  private readonly rollForce: number;
  private readonly punchRange: number;

  constructor(marble: Marble, glove: Glove, aggroRange = 9, rollForce = 6) {
    this.marble = marble;
    this.glove = glove;
    this.aggroRange = aggroRange;
    this.rollForce = rollForce;
    // Slightly under the glove's full reach so it's usually still in range
    // by the time the swing finishes extending.
    this.punchRange = glove.reach * 0.85;
  }

  update(playerPosition: Vector3): void {
    const selfPosition = this.marble.getPosition();
    const toPlayer = playerPosition.subtract(selfPosition);
    toPlayer.y = 0;

    const distance = toPlayer.length();
    const target = distance <= this.aggroRange ? toPlayer : Vector3.Zero().subtract(selfPosition);

    target.y = 0;
    if (target.lengthSquared() > 0.0001) {
      this.marble.applyRollForce(target, this.rollForce);
    }

    if (distance <= this.punchRange && distance > 0.0001 && this.glove.canPunch()) {
      this.glove.punch(toPlayer.normalize());
    }
  }
}
