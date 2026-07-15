import { Scene, ArcRotateCamera, Vector3 } from "@babylonjs/core";

/**
 * An ArcRotateCamera pre-configured as a fixed-angle follow cam. Mouse-drag
 * orbiting is removed entirely — the mouse is dedicated to punching — so the
 * only camera control left is the scroll-wheel zoom.
 */
export function createCameraRig(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 3,
    28,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 12;
  camera.upperRadiusLimit = 48;
  camera.lowerBetaLimit = 0.2;
  camera.upperBetaLimit = Math.PI / 2.1;
  camera.wheelPrecision = 40;
  camera.panningSensibility = 0; // disable right-click panning, it fights the follow target
  camera.inputs.remove(camera.inputs.attached.pointers); // mouse is for punching, not orbiting

  return camera;
}

export function updateCameraTarget(camera: ArcRotateCamera, targetPosition: Vector3, lerpFactor = 0.15): void {
  camera.target = Vector3.Lerp(camera.target, targetPosition, lerpFactor);
}
