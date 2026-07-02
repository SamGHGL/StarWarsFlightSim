import { Vector3, Quaternion } from "three";

export type ShipState = {
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  angularVelocity: Vector3; // pitch, yaw, roll rates (local)
  throttle: number; // 0..1
  speed: number;
  shield: number; // 0..100
  energy: number; // 0..100
};

export type FlightInput = {
  pitch: number; // -1..1 (nose up positive)
  yaw: number;   // -1..1 (nose right positive)
  roll: number;  // -1..1 (right wing down positive)
  throttleDelta: number; // -1..1 per second scale
  boost: boolean;
  brake: boolean;
  fire: boolean;
  cycleTarget: boolean;
  toggleView: boolean;
};

export const ZERO_INPUT: FlightInput = {
  pitch: 0, yaw: 0, roll: 0, throttleDelta: 0,
  boost: false, brake: false, fire: false,
  cycleTarget: false, toggleView: false,
};

export type CameraMode = "cockpit" | "third";

export type Settings = {
  sensitivity: { pitch: number; yaw: number; roll: number };
  deadzone: number;
  invertPitch: boolean;
  keyBindings: Record<string, string>; // action -> key code
  gamepadAxes: { pitch: number; yaw: number; roll: number; throttle: number };
  gamepadInvert: { pitch: boolean; yaw: boolean; roll: boolean; throttle: boolean };
};

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: { pitch: 1, yaw: 1, roll: 1.2 },
  deadzone: 0.08,
  invertPitch: false,
  keyBindings: {
    pitchUp: "KeyS",
    pitchDown: "KeyW",
    yawLeft: "KeyA",
    yawRight: "KeyD",
    rollLeft: "ArrowLeft",
    rollRight: "ArrowRight",
    throttleUp: "ShiftLeft",
    throttleDown: "ControlLeft",
    boost: "Space",
    brake: "KeyX",
    fire: "KeyF",
    cycleTarget: "KeyT",
    toggleView: "KeyV",
  },
  gamepadAxes: { pitch: 1, yaw: 2, roll: 0, throttle: 3 },
  gamepadInvert: { pitch: false, yaw: false, roll: false, throttle: true },
};
