import { Vec3, Mat4, clamp } from "./math.js";

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;

    this.fov = 60;
    this.eye = new Vec3(16, 3.0, 28);
    this.up  = new Vec3(0, 1, 0);

    this.yaw = 0;
    this.pitch = -5;   // slight downward tilt so ground is visible


    this.view = new Mat4();
    this.proj = new Mat4().perspective(this.fov, canvas.width/canvas.height, 0.1, 1000);

    this.speed = 0.20;
    this.turnDeg = 2.8;
    this.mouseSensitivity = 0.15;

    this._forward = new Vec3(0,0,-1);
    this._right = new Vec3(1,0,0);

    this.updateBasis();
    this.updateView();
  }

  resize() {
    this.proj.perspective(this.fov, this.canvas.width/this.canvas.height, 0.1, 1000);
  }

  updateBasis() {
    const yawRad = this.yaw * Math.PI/180;
    const pitchRad = this.pitch * Math.PI/180;

    const fx = Math.sin(yawRad) * Math.cos(pitchRad);
    const fy = Math.sin(pitchRad);
    const fz = -Math.cos(yawRad) * Math.cos(pitchRad);


    this._forward.set(fx, fy, fz).normalize();
    this._right = Vec3.cross(this._forward, this.up).normalize(); // right-handed
  }

  updateView() {
    const at = this.eye.copy().add(this._forward.copy());
    this.view.lookAt(this.eye, at, this.up);
  }

  look(dx, dy) {
    this.yaw += dx * this.mouseSensitivity;
    this.pitch -= dy * this.mouseSensitivity;
    this.pitch = clamp(this.pitch, -89, 89);
    this.updateBasis();
  }

  panLeft()  { this.yaw -= this.turnDeg; this.updateBasis(); }
  panRight() { this.yaw += this.turnDeg; this.updateBasis(); }

  moveForward()  { this.eye.add(this._forward.copy().mul(this.speed)); }
  moveBack()     { this.eye.sub(this._forward.copy().mul(this.speed)); }
  moveLeft()     { this.eye.sub(this._right.copy().mul(this.speed)); }
  moveRight()    { this.eye.add(this._right.copy().mul(this.speed)); }

  // For Minecraft add/remove: cell in front of camera (x,z)
  cellInFront(dist=1.2) {
    const p = this.eye.copy().add(this._forward.copy().mul(dist));
    return { x: Math.floor(p.x), z: Math.floor(p.z) };
  }
}
