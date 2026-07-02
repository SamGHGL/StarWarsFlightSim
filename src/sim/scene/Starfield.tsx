import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Two-layer star field: distant sphere + closer parallax points. */
export function Starfield({ count = 4000 }: { count?: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random point on sphere
      const r = 1800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      // Slight color variation (blueish/white/yellow)
      const t = Math.random();
      const c = new THREE.Color().setHSL(0.55 + (t - 0.5) * 0.2, 0.4 + Math.random() * 0.4, 0.7 + Math.random() * 0.3);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () => new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }),
    [],
  );

  const ref = useRef<THREE.Points>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

/** Nebula background — simple color gradient via giant sphere. */
export function Nebula() {
  return (
    <mesh>
      <sphereGeometry args={[2400, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={{
          top: { value: new THREE.Color("#050818") },
          mid: { value: new THREE.Color("#0a1030") },
          glow: { value: new THREE.Color("#3a1e6b") },
        }}
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos;
          uniform vec3 top; uniform vec3 mid; uniform vec3 glow;
          void main() {
            float y = vPos.y * 0.5 + 0.5;
            vec3 c = mix(mid, top, smoothstep(0.3, 1.0, y));
            float n = pow(1.0 - abs(vPos.y), 3.0) * 0.6;
            c += glow * n * smoothstep(-0.2, 0.6, vPos.x);
            gl_FragColor = vec4(c, 1.0);
          }
        `}
      />
    </mesh>
  );
}
