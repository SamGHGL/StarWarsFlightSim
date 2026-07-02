import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

export type PlanetSpec = {
  name: string;
  position: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
  ring?: { inner: number; outer: number; color: string };
};

export const PLANETS: PlanetSpec[] = [
  { name: "Auros",  position: [500, 100, -800],  radius: 180, color: "#c48b4a", emissive: "#3a1f08" },
  { name: "Cyanix", position: [-900, -50, 400],  radius: 140, color: "#3fa3c7", emissive: "#082033",
    ring: { inner: 200, outer: 340, color: "#8ac6dd" } },
  { name: "Vermil", position: [200, -300, 1200], radius: 90,  color: "#a63a3a", emissive: "#2a0808" },
  { name: "Nyx",    position: [-1500, 400, -1500], radius: 260, color: "#4a3a6e", emissive: "#120a24" },
];

function Planet({ spec }: { spec: PlanetSpec }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.04;
  });
  return (
    <group position={spec.position}>
      <mesh ref={ref}>
        <sphereGeometry args={[spec.radius, 48, 48]} />
        <meshStandardMaterial
          color={spec.color}
          emissive={spec.emissive ?? "#000000"}
          emissiveIntensity={0.35}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {spec.ring && (
        <mesh rotation={[-Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[spec.ring.inner, spec.ring.outer, 96]} />
          <meshBasicMaterial color={spec.ring.color} side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  );
}

export function Planets() {
  return <>{PLANETS.map(p => <Planet key={p.name} spec={p} />)}</>;
}

export function Asteroids({ count = 220 }: { count?: number }) {
  const { positions, scales, rotations } = useMemo(() => {
    const positions: [number, number, number][] = [];
    const scales: number[] = [];
    const rotations: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      // Ring-belt cluster around origin
      const angle = Math.random() * Math.PI * 2;
      const r = 350 + Math.random() * 400;
      const y = (Math.random() - 0.5) * 80;
      positions.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
      scales.push(1.5 + Math.random() * 8);
      rotations.push([Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]);
    }
    return { positions, scales, rotations };
  }, [count]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    for (let i = 0; i < positions.length; i++) {
      rotations[i][1] += dt * 0.1;
      dummy.position.set(...positions[i]);
      dummy.rotation.set(...rotations[i]);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#5a5148" roughness={0.95} metalness={0.1} />
    </instancedMesh>
  );
}
