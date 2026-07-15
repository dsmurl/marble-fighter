import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsAggregate,
  PhysicsShapeType,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  ShadowGenerator,
  Mesh,
} from "@babylonjs/core";

export interface Arena {
  platform: Mesh;
  shadowGenerator: ShadowGenerator;
  /** Radius of the circular platform — used for out-of-bounds checks. */
  radius: number;
}

export function createArena(scene: Scene): Arena {
  const radius = 12;

  // --- Platform -----------------------------------------------------------
  const platform = MeshBuilder.CreateCylinder(
    "platform",
    { diameter: radius * 2, height: 1, tessellation: 48 },
    scene,
  );
  platform.position.y = -0.5;

  const platformMaterial = new StandardMaterial("platformMat", scene);
  platformMaterial.diffuseColor = Color3.FromHexString("#3a3f58");
  platformMaterial.specularColor = Color3.FromHexString("#1a1a1a");
  platform.material = platformMaterial;
  platform.receiveShadows = true;

  // Static physics body — mass 0 means immovable.
  new PhysicsAggregate(
    platform,
    PhysicsShapeType.CYLINDER,
    { mass: 0, friction: 0.6, restitution: 0.3 },
    scene,
  );

  // --- Lighting -------------------------------------------------------------
  const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.55;

  const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
  sun.position = new Vector3(20, 30, 20);
  sun.intensity = 0.9;

  const shadowGenerator = new ShadowGenerator(1024, sun);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  return { platform, shadowGenerator, radius };
}
