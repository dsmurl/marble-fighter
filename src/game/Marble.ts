import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
  Quaternion,
  Mesh,
  ShadowGenerator,
} from "@babylonjs/core";

export interface MarbleOptions {
  name: string;
  color: Color3;
  startPosition: Vector3;
  radius?: number;
}

/**
 * A physics-driven sphere. Movement is applied as forces/impulses on the
 * rigid body rather than by moving the mesh directly, so it collides and
 * knocks into other marbles believably.
 */
export class Marble {
  readonly mesh: Mesh;
  readonly body: PhysicsAggregate;
  readonly radius: number;

  private readonly scene: Scene;
  private readonly shadowGenerator?: ShadowGenerator;
  private grounded = false;
  private lastGroundedAt = 0;
  private isCastingShadow = true;

  constructor(scene: Scene, options: MarbleOptions, shadowGenerator?: ShadowGenerator) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.radius = options.radius ?? 0.6;

    this.mesh = MeshBuilder.CreateSphere(
      options.name,
      { diameter: this.radius * 2, segments: 24 },
      scene,
    );
    this.mesh.position = options.startPosition.clone();

    const material = new StandardMaterial(`${options.name}Mat`, scene);
    material.diffuseColor = options.color;
    material.specularColor = new Color3(0.6, 0.6, 0.6);
    material.specularPower = 32;
    this.mesh.material = material;

    shadowGenerator?.addShadowCaster(this.mesh);

    this.body = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.SPHERE,
      { mass: 1, friction: 0.4, restitution: 0.5 },
      scene,
    );
    // A little damping keeps the marble from sliding forever.
    this.body.body.setLinearDamping(0.15);
    this.body.body.setAngularDamping(0.2);

    // Track ground contact via a simple raycast check each physics step,
    // updated externally from the game loop (see Game.ts).
  }

  /** Call once per physics tick with a raycast-based grounded flag. */
  setGrounded(isGrounded: boolean, now: number): void {
    this.grounded = isGrounded;
    if (isGrounded) this.lastGroundedAt = now;
  }

  isGrounded(): boolean {
    return this.grounded;
  }

  /**
   * Stops casting a shadow once the marble has fallen off the platform.
   * A directional light keeps projecting a shadow onto the platform from
   * whatever XZ the caster is under, no matter how far below it's fallen —
   * so without this, a marble plummeting out of the arena drags a shadow
   * sliding across the platform behind it.
   */
  updateShadowVisibility(): void {
    if (!this.shadowGenerator) return;
    const shouldCastShadow = this.mesh.position.y > -1;
    if (shouldCastShadow === this.isCastingShadow) return;
    this.isCastingShadow = shouldCastShadow;
    if (shouldCastShadow) {
      this.shadowGenerator.addShadowCaster(this.mesh);
    } else {
      this.shadowGenerator.removeShadowCaster(this.mesh);
    }
  }

  /** Coyote-time aware jump eligibility check. */
  canJump(now: number, coyoteMs = 120): boolean {
    return this.grounded || now - this.lastGroundedAt < coyoteMs;
  }

  applyRollForce(direction: Vector3, strength: number): void {
    if (direction.lengthSquared() === 0) return;
    this.body.body.applyForce(
      direction.normalize().scale(strength),
      this.mesh.getAbsolutePosition(),
    );
  }

  applyJumpImpulse(strength: number): void {
    this.body.body.applyImpulse(new Vector3(0, strength, 0), this.mesh.getAbsolutePosition());
  }

  /** A one-shot knock in `direction`, used by punches — an impulse rather than a sustained force. */
  applyPunchImpulse(direction: Vector3, strength: number): void {
    if (direction.lengthSquared() === 0) return;
    this.body.body.applyImpulse(direction.normalize().scale(strength), this.mesh.getAbsolutePosition());
  }

  getPosition(): Vector3 {
    return this.mesh.position;
  }

  /** Vertical component of the current linear velocity — used to detect a jump's apex (rising to falling). */
  getVerticalVelocity(): number {
    return this.body.body.getLinearVelocity().y;
  }

  /** Overwrites just the vertical component of velocity, leaving horizontal motion untouched. */
  setVerticalVelocity(vy: number): void {
    const velocity = this.body.body.getLinearVelocity();
    velocity.y = vy;
    this.body.body.setLinearVelocity(velocity);
  }

  /** 0 cancels gravity entirely (used by the Halo item's hover); 1 is normal. */
  setGravityFactor(factor: number): void {
    this.body.body.setGravityFactor(factor);
  }

  /** Teleports the marble back to a start position and zeroes out its motion. */
  reset(position: Vector3): void {
    this.mesh.position.copyFrom(position);
    this.mesh.rotationQuaternion = Quaternion.Identity();
    this.body.body.setLinearVelocity(Vector3.Zero());
    this.body.body.setAngularVelocity(Vector3.Zero());
    this.body.body.setGravityFactor(1);
    this.grounded = false;
    this.lastGroundedAt = 0;

    // disablePreStep defaults to true (physics ignores mesh.position writes,
    // for perf) so a plain position assignment above does nothing on its
    // own. Flip it off for exactly one render pass so the engine picks up
    // the new transform as a hard teleport, then flip it back — leaving it
    // off permanently makes physics re-clamp the body to the mesh every
    // frame, which fights gravity/forces and freezes the marble in place.
    this.body.body.disablePreStep = false;
    this.scene.onAfterRenderObservable.addOnce(() => {
      this.body.body.disablePreStep = true;
    });
  }

  /** Stops all motion in place without moving the marble — used to freeze the scene when a round ends. */
  freeze(): void {
    this.body.body.setLinearVelocity(Vector3.Zero());
    this.body.body.setAngularVelocity(Vector3.Zero());
  }

  dispose(): void {
    this.body.dispose();
    this.mesh.dispose();
  }
}
