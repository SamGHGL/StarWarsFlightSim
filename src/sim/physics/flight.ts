import { Quaternion, Vector3 } from "three";
import { FlightInput, Settings, ShipState } from "../types";

export function createShipState(): ShipState {
  return {
    position: new Vector3(0, 0, 0),
    quaternion: new Quaternion(),
    velocity: new Vector3(),
    angularVelocity: new Vector3(),
    throttle: 0.3,
    speed: 0,
    shield: 100,
    energy: 100,
  };
}

const MAX_SPEED = 320;
const BOOST_MULT = 1.8;
const ACCEL = 55;         // thrust acceleration units/s^2
const DRAG = 0.35;        // linear drag toward throttle target (space-arcade feel)
const ANG_ACCEL = 3.2;    // rad/s^2 responsiveness
const ANG_DAMP = 2.4;     // angular damping

const _tmpQ = new Quaternion();
const _fwd = new Vector3();
const _target = new Vector3();

export function stepShip(
  ship: ShipState,
  input: FlightInput & { throttleAbsolute?: number },
  settings: Settings,
  dt: number,
) {
  // Throttle
  if (typeof input.throttleAbsolute === "number") {
    ship.throttle = input.throttleAbsolute;
  } else {
    ship.throttle = Math.min(1, Math.max(0, ship.throttle + input.throttleDelta * 0.6 * dt));
  }
  if (input.brake) ship.throttle = Math.max(0, ship.throttle - 1.5 * dt);

  // Angular target rates from input
  const sens = settings.sensitivity;
  const invP = settings.invertPitch ? -1 : 1;
  const targetPitch = input.pitch * sens.pitch * invP * 1.6;
  const targetYaw = input.yaw * sens.yaw * 1.2;
  const targetRoll = input.roll * sens.roll * 2.2;

  // Approach target angular velocity
  ship.angularVelocity.x += (targetPitch - ship.angularVelocity.x) * Math.min(1, ANG_ACCEL * dt);
  ship.angularVelocity.y += (targetYaw - ship.angularVelocity.y) * Math.min(1, ANG_ACCEL * dt);
  ship.angularVelocity.z += (targetRoll - ship.angularVelocity.z) * Math.min(1, ANG_ACCEL * dt);

  // Passive damping when no input
  if (input.pitch === 0) ship.angularVelocity.x *= Math.max(0, 1 - ANG_DAMP * dt);
  if (input.yaw === 0)   ship.angularVelocity.y *= Math.max(0, 1 - ANG_DAMP * dt);
  if (input.roll === 0)  ship.angularVelocity.z *= Math.max(0, 1 - ANG_DAMP * dt);

  // Apply angular velocity to quaternion (local axes)
  _tmpQ.setFromAxisAngle(new Vector3(1, 0, 0), ship.angularVelocity.x * dt);
  ship.quaternion.multiply(_tmpQ);
  _tmpQ.setFromAxisAngle(new Vector3(0, 1, 0), ship.angularVelocity.y * dt);
  ship.quaternion.multiply(_tmpQ);
  _tmpQ.setFromAxisAngle(new Vector3(0, 0, 1), ship.angularVelocity.z * dt);
  ship.quaternion.multiply(_tmpQ);
  ship.quaternion.normalize();

  // Forward vector (local -Z)
  _fwd.set(0, 0, -1).applyQuaternion(ship.quaternion);

  // Target speed based on throttle & boost
  const boostMul = input.boost && ship.energy > 5 ? BOOST_MULT : 1;
  const targetSpeed = MAX_SPEED * ship.throttle * boostMul;
  _target.copy(_fwd).multiplyScalar(targetSpeed);

  // Blend velocity toward target (inertial drag)
  const dragFactor = Math.min(1, DRAG * dt + ACCEL * dt / Math.max(1, MAX_SPEED));
  ship.velocity.lerp(_target, dragFactor);

  // Energy management
  if (input.boost) ship.energy = Math.max(0, ship.energy - 18 * dt);
  else ship.energy = Math.min(100, ship.energy + 6 * dt);

  // Integrate position
  ship.position.addScaledVector(ship.velocity, dt);
  ship.speed = ship.velocity.length();
}
