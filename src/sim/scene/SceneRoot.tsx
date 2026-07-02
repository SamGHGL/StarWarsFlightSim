import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Nebula, Starfield } from "./Starfield";
import { Asteroids, Planets, PLANETS } from "./Planets";
import { Ship } from "./Ship";
import { CameraMode, ShipState } from "../types";

type Props = {
  ship: ShipState;
  cameraMode: CameraMode;
  targetIndex: number;
};

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _off = new THREE.Vector3();

export function SceneRoot({ ship, cameraMode, targetIndex }: Props) {
  const shipRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.near = 0.1;
    camera.far = 5000;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame(() => {
    if (!shipRef.current) return;
    shipRef.current.position.copy(ship.position);
    shipRef.current.quaternion.copy(ship.quaternion);

    // Camera follow
    if (cameraMode === "cockpit") {
      _off.set(0, 0.15, -0.15).applyQuaternion(ship.quaternion);
      camera.position.copy(ship.position).add(_off);
      _v.set(0, 0, -1).applyQuaternion(ship.quaternion).add(camera.position);
      camera.up.set(0, 1, 0).applyQuaternion(ship.quaternion);
      camera.lookAt(_v);
    } else {
      _off.set(0, 1.6, 5.5).applyQuaternion(ship.quaternion);
      const desired = _v.copy(ship.position).add(_off);
      camera.position.lerp(desired, 0.12);
      camera.up.set(0, 1, 0).applyQuaternion(ship.quaternion);
      camera.lookAt(ship.position);
    }
  });

  const targetPlanet = PLANETS[targetIndex % PLANETS.length];

  return (
    <>
      <color attach="background" args={["#03030a"]} />
      <fog attach="fog" args={["#03030a", 800, 3000]} />

      <Nebula />
      <Starfield count={3500} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[100, 200, 100]} intensity={1.4} color="#fff2d9" />
      <pointLight position={[-500, 0, -500]} intensity={0.6} color="#8ab4ff" distance={2000} />

      <Planets />
      <Asteroids count={180} />

      <group ref={shipRef}>
        <Ship />
      </group>

      {/* Target lock marker */}
      <TargetMarker position={targetPlanet.position} radius={targetPlanet.radius} />
    </>
  );
}

function TargetMarker({ position, radius }: { position: [number, number, number]; radius: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.6;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[radius * 1.35, 2, 8, 64]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
