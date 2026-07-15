import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, TransformNode } from "@babylonjs/core";

export interface GloveOptions {
  scene: Scene;
  name: string;
  /** Radius of the ball this glove is mounted on — everything else scales from it. */
  ballRadius: number;
}

export interface PunchTarget {
  getPosition(): Vector3;
  radius: number;
}

const EXTEND_DURATION_MS = 130;
const RETRACT_DURATION_MS = 190;

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

type PunchState = "idle" | "extending" | "retracting";

/**
 * A spring-loaded boxing glove mounted on a marble. Shoots out from the
 * ball's center toward a direction on punch(), and retracts automatically.
 * Owns its own meshes but is positioned by the caller each frame — kept
 * unparented from the marble mesh so it doesn't spin with the rolling ball.
 */
export class Glove {
  private readonly gloveRadius: number;
  readonly reach: number;

  private readonly spring: Mesh;
  private readonly gloveRoot: TransformNode;

  private state: PunchState = "idle";
  private elapsedMs = 0;
  private direction = new Vector3(0, 0, 1);
  private hasHitThisPunch = false;
  private justStarted = false;

  constructor(options: GloveOptions) {
    this.gloveRadius = options.ballRadius * 0.5;
    this.reach = options.ballRadius * 2 * 2; // twice the ball's diameter

    this.spring = this.buildSpring(options.scene, options.name);
    this.gloveRoot = this.buildGlove(options.scene, options.name);
    this.setVisible(false);
  }

  /** A new punch can start as soon as the previous one has fully retracted. */
  canPunch(): boolean {
    return this.state === "idle";
  }

  punch(direction: Vector3): void {
    if (!this.canPunch()) return;
    this.direction = direction.clone();
    this.direction.y = 0;
    if (this.direction.lengthSquared() < 0.0001) return;
    this.direction.normalize();

    this.state = "extending";
    this.elapsedMs = 0;
    this.hasHitThisPunch = false;
    this.justStarted = true;
    this.setVisible(true);
  }

  /** True exactly once, the first time this is called after a punch starts — for one-shot effects like a whoosh sound. */
  consumeJustStarted(): boolean {
    if (!this.justStarted) return false;
    this.justStarted = false;
    return true;
  }

  /** Advances the punch animation and reports a hit at most once per punch. */
  update(deltaMs: number, ownerPosition: Vector3, target: PunchTarget, onHit: (direction: Vector3) => void): void {
    if (this.state === "idle") return;

    this.elapsedMs += deltaMs;
    let currentLength: number;

    if (this.state === "extending") {
      const t = Math.min(this.elapsedMs / EXTEND_DURATION_MS, 1);
      currentLength = this.reach * easeOut(t);
      if (t >= 1) {
        this.state = "retracting";
        this.elapsedMs = 0;
      }
    } else {
      const t = Math.min(this.elapsedMs / RETRACT_DURATION_MS, 1);
      currentLength = this.reach * (1 - easeIn(t));
      if (t >= 1) {
        this.state = "idle";
        this.setVisible(false);
        return;
      }
    }

    const yaw = Math.atan2(this.direction.x, this.direction.z);
    this.spring.position.copyFrom(ownerPosition);
    this.spring.rotation.y = yaw;
    this.spring.scaling.z = Math.max(currentLength / this.reach, 0.001);

    const tipPosition = ownerPosition.add(this.direction.scale(currentLength));
    this.gloveRoot.position.copyFrom(tipPosition);
    this.gloveRoot.rotation.y = yaw;

    if (!this.hasHitThisPunch && this.state === "extending") {
      const hitDistance = this.gloveRadius + target.radius;
      const toTarget = target.getPosition().subtract(tipPosition);
      if (toTarget.length() <= hitDistance) {
        this.hasHitThisPunch = true;
        // Knock the target along the line from the glove's contact point to
        // its center, not the raw swing direction — a glancing hit deflects
        // it sideways instead of always shoving it straight along the punch.
        toTarget.y = 0;
        const impactDirection = toTarget.lengthSquared() > 0.0001 ? toTarget.normalize() : this.direction;
        onHit(impactDirection);
      }
    }
  }

  private setVisible(visible: boolean): void {
    this.spring.setEnabled(visible);
    this.gloveRoot.setEnabled(visible);
  }

  private buildSpring(scene: Scene, name: string): Mesh {
    const segments = 48;
    const turns = 5;
    const coilRadius = this.gloveRadius * 0.4;
    const path: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      path.push(new Vector3(Math.cos(angle) * coilRadius, Math.sin(angle) * coilRadius, t * this.reach));
    }

    const spring = MeshBuilder.CreateTube(
      `${name}Spring`,
      { path, radius: this.gloveRadius * 0.12, tessellation: 8, updatable: false },
      scene,
    );
    const material = new StandardMaterial(`${name}SpringMat`, scene);
    material.diffuseColor = Color3.FromHexString("#2b2b2f");
    material.specularColor = new Color3(0.3, 0.3, 0.3);
    spring.material = material;
    return spring;
  }

  private buildGlove(scene: Scene, name: string): TransformNode {
    const root = new TransformNode(`${name}Root`, scene);

    const fistMat = new StandardMaterial(`${name}FistMat`, scene);
    fistMat.diffuseColor = Color3.FromHexString("#d81e2c");
    fistMat.specularColor = new Color3(0.4, 0.2, 0.2);

    const cuffMat = new StandardMaterial(`${name}CuffMat`, scene);
    cuffMat.diffuseColor = Color3.FromHexString("#f2ece1");
    cuffMat.specularColor = new Color3(0.2, 0.2, 0.2);

    const fist = MeshBuilder.CreateSphere(`${name}Fist`, { diameter: this.gloveRadius * 2, segments: 14 }, scene);
    fist.scaling.z = 1.25;
    fist.material = fistMat;
    fist.parent = root;

    const thumb = MeshBuilder.CreateSphere(`${name}Thumb`, { diameter: this.gloveRadius * 0.9, segments: 10 }, scene);
    thumb.material = fistMat;
    thumb.parent = root;
    thumb.position.set(this.gloveRadius * 0.75, this.gloveRadius * 0.15, -this.gloveRadius * 0.1);

    const cuff = MeshBuilder.CreateCylinder(
      `${name}Cuff`,
      {
        diameterTop: this.gloveRadius * 1.7,
        diameterBottom: this.gloveRadius * 2.1,
        height: this.gloveRadius * 1.3,
        tessellation: 14,
      },
      scene,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.z = -this.gloveRadius * 1.1;
    cuff.material = cuffMat;
    cuff.parent = root;

    return root;
  }
}
