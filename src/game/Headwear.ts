import { Scene, TransformNode, MeshBuilder, StandardMaterial, Color3, Vector3 } from "@babylonjs/core";

/**
 * Purely cosmetic — a hat sitting on top of a marble. Kept unparented from
 * the marble mesh (like the boxing glove) so it doesn't spin wildly with
 * the ball's rolling rotation; the caller repositions it above the ball
 * each frame instead.
 */
export function createCrown(scene: Scene, name: string, ballRadius: number): TransformNode {
  const root = new TransformNode(`${name}Root`, scene);

  const goldMat = new StandardMaterial(`${name}GoldMat`, scene);
  goldMat.diffuseColor = Color3.FromHexString("#e6b800");
  goldMat.specularColor = new Color3(1, 0.9, 0.5);
  goldMat.specularPower = 64;

  const gemMat = new StandardMaterial(`${name}GemMat`, scene);
  gemMat.diffuseColor = Color3.FromHexString("#c81e3a");
  gemMat.specularColor = new Color3(0.8, 0.8, 0.8);

  const bandHeight = ballRadius * 0.35;
  const bandDiameter = ballRadius * 1.3;

  const band = MeshBuilder.CreateCylinder(
    `${name}Band`,
    { diameterTop: bandDiameter, diameterBottom: bandDiameter * 0.9, height: bandHeight, tessellation: 16 },
    scene,
  );
  band.position.y = bandHeight / 2;
  band.material = goldMat;
  band.parent = root;

  const spikeCount = 5;
  const spikeHeight = ballRadius * 0.45;
  const ringRadius = bandDiameter / 2;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i / spikeCount) * Math.PI * 2;
    const spike = MeshBuilder.CreateCylinder(
      `${name}Spike${i}`,
      { diameterTop: 0.001, diameterBottom: ballRadius * 0.28, height: spikeHeight, tessellation: 8 },
      scene,
    );
    spike.position.set(Math.cos(angle) * ringRadius * 0.75, bandHeight + spikeHeight / 2, Math.sin(angle) * ringRadius * 0.75);
    spike.material = goldMat;
    spike.parent = root;

    const gem = MeshBuilder.CreateSphere(`${name}Gem${i}`, { diameter: ballRadius * 0.18, segments: 8 }, scene);
    gem.position.set(Math.cos(angle) * ringRadius * 0.75, bandHeight + spikeHeight + ballRadius * 0.05, Math.sin(angle) * ringRadius * 0.75);
    gem.material = gemMat;
    gem.parent = root;
  }

  return root;
}

export function createDunceCap(scene: Scene, name: string, ballRadius: number): TransformNode {
  const root = new TransformNode(`${name}Root`, scene);

  const capMat = new StandardMaterial(`${name}CapMat`, scene);
  capMat.diffuseColor = Color3.FromHexString("#e8dcc0");
  capMat.specularColor = new Color3(0.15, 0.15, 0.15);

  const brimHeight = ballRadius * 0.08;
  const brimDiameter = ballRadius * 1.5;
  const brim = MeshBuilder.CreateCylinder(
    `${name}Brim`,
    { diameterTop: brimDiameter, diameterBottom: brimDiameter, height: brimHeight, tessellation: 20 },
    scene,
  );
  brim.position.y = brimHeight / 2;
  brim.material = capMat;
  brim.parent = root;

  const coneHeight = ballRadius * 1.6;
  const cone = MeshBuilder.CreateCylinder(
    `${name}Cone`,
    { diameterTop: 0.001, diameterBottom: brimDiameter * 0.85, height: coneHeight, tessellation: 20 },
    scene,
  );
  cone.position.y = brimHeight + coneHeight / 2;
  cone.material = capMat;
  cone.parent = root;

  return root;
}

/** Positions a hat directly on top of the ball, ignoring the ball's roll rotation. */
export function updateHeadwearPosition(headwear: TransformNode, ballPosition: Vector3, ballRadius: number): void {
  headwear.position.set(ballPosition.x, ballPosition.y + ballRadius, ballPosition.z);
}
