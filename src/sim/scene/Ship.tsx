import { forwardRef } from "react";
import * as THREE from "three";

/** Simple procedural starfighter model (no copyrighted design). */
export const Ship = forwardRef<THREE.Group>((_, ref) => {
  return (
    <group ref={ref}>
      {/* Fuselage */}
      <mesh>
        <capsuleGeometry args={[0.35, 1.6, 6, 12]} />
        <meshStandardMaterial color="#8892a0" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 0.9, 12]} />
        <meshStandardMaterial color="#5a6572" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.05, 0.1]}>
        <boxGeometry args={[2.6, 0.06, 0.7]} />
        <meshStandardMaterial color="#3d4652" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Wing tips (engines) */}
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[x, 0, 0.15]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 0.7, 12]} />
            <meshStandardMaterial color="#2a2f38" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.11, 0.14, 0.15, 12]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.2} />
          </mesh>
        </group>
      ))}
      {/* Cockpit canopy */}
      <mesh position={[0, 0.18, -0.35]}>
        <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#0a1a2a" transmission={0.5} thickness={0.4} roughness={0.15} metalness={0.2} emissive="#0088aa" emissiveIntensity={0.2} />
      </mesh>
      {/* Engine glow behind */}
      <mesh position={[0, 0, 0.95]}>
        <cylinderGeometry args={[0.18, 0.28, 0.1, 12]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
});
Ship.displayName = "Ship";
