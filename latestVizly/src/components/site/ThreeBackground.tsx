import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * Smoothly tracks the normalized cursor (-1..1) across the viewport.
 * Lives in scene scope so multiple objects can share it.
 */
function useMouseLerp() {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useFrame(() => {
    current.current.x += (target.current.x - current.current.x) * 0.05;
    current.current.y += (target.current.y - current.current.y) * 0.05;
  });

  return { target, current };
}

function FloatingShape({
  position,
  color,
  scale = 1,
  speed = 1,
  distort = 0.35,
  mouse,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  speed?: number;
  distort?: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.15 * speed;
    ref.current.rotation.y = t * 0.2 * speed;
    ref.current.position.x = position[0] + mouse.current.x * 0.8 * speed;
    ref.current.position.y = position[1] + mouse.current.y * 0.6 * speed;
  });

  return (
    <Float speed={1.2 * speed} rotationIntensity={0.4} floatIntensity={0.8}>
      <Icosahedron ref={ref} args={[1, 4]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={1.6}
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.85}
        />
      </Icosahedron>
    </Float>
  );
}

function Particles({ count = 220, mouse }: { count?: number; mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.03 + mouse.current.x * 0.2;
    ref.current.rotation.x = mouse.current.y * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        color="#c7d2fe"
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  const { target, current } = useMouseLerp();
  const { camera } = useThree();

  useFrame(() => {
    // subtle camera parallax
    camera.position.x += (current.current.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (current.current.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  // Track pointer in normalized coords
  useFrame(({ pointer }) => {
    target.current.x = pointer.x;
    target.current.y = pointer.y;
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} color="#c4b5fd" />
      <pointLight position={[-6, -3, 2]} intensity={2.2} color="#3b82f6" />
      <pointLight position={[6, 4, 3]} intensity={1.8} color="#a855f7" />

      <FloatingShape
        position={[-4.2, 1.5, 0]}
        color="#6366f1"
        scale={1.8}
        speed={0.8}
        distort={0.45}
        mouse={current}
      />
      <FloatingShape
        position={[4.5, -1.2, -1]}
        color="#a855f7"
        scale={2.2}
        speed={1.1}
        distort={0.5}
        mouse={current}
      />
      <FloatingShape
        position={[0.8, 2.8, -2]}
        color="#3b82f6"
        scale={1.2}
        speed={0.6}
        distort={0.35}
        mouse={current}
      />
      <FloatingShape
        position={[-1.5, -2.6, -1]}
        color="#8b5cf6"
        scale={1.5}
        speed={0.9}
        distort={0.55}
        mouse={current}
      />

      <Particles mouse={current} />
    </>
  );
}

export function ThreeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 1 }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
