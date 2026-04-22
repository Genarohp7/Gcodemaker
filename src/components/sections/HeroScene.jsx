import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function generateParticlePositions(total = 140) {
  const points = [];

  for (let i = 0; i < total; i += 1) {
    const radius = 2.1 + Math.random() * 0.65;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    points.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  return new Float32Array(points);
}

const PARTICLE_POSITIONS = generateParticlePositions();

function CoreOrb() {
  const groupRef = useRef(null);
  const outerRef = useRef(null);
  const middleRef = useRef(null);
  const ringPrimaryRef = useRef(null);
  const ringSecondaryRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetX = state.pointer.y * 0.22;
    const targetY = state.pointer.x * 0.38;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.05
    );

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.05
    );

    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.85) * 0.08;

    if (outerRef.current) {
      outerRef.current.rotation.x += delta * 0.08;
      outerRef.current.rotation.y += delta * 0.16;
    }

    if (middleRef.current) {
      middleRef.current.rotation.y -= delta * 0.22;
      middleRef.current.rotation.z += delta * 0.06;
    }

    if (ringPrimaryRef.current) {
      ringPrimaryRef.current.rotation.z += delta * 0.18;
    }

    if (ringSecondaryRef.current) {
      ringSecondaryRef.current.rotation.x -= delta * 0.14;
      ringSecondaryRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={1.02}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_POSITIONS.length / 3}
            array={PARTICLE_POSITIONS}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9fd8ff"
          size={0.03}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.72, 1]} />
        <meshBasicMaterial
          color="#4da3ff"
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>

      <mesh ref={ringPrimaryRef} rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[2.08, 0.028, 20, 180]} />
        <meshStandardMaterial
          color="#4da3ff"
          emissive="#4da3ff"
          emissiveIntensity={0.3}
          metalness={0.45}
          roughness={0.18}
        />
      </mesh>

      <mesh ref={ringSecondaryRef} rotation={[-Math.PI / 4.8, 0, Math.PI / 8]}>
        <torusGeometry args={[1.36, 0.04, 20, 180]} />
        <meshStandardMaterial
          color="#ffcb4e"
          emissive="#ffcb4e"
          emissiveIntensity={0.22}
          metalness={0.35}
          roughness={0.24}
        />
      </mesh>

      <mesh ref={middleRef}>
        <icosahedronGeometry args={[0.96, 3]} />
        <meshPhysicalMaterial
          color="#b9deff"
          emissive="#4da3ff"
          emissiveIntensity={0.2}
          roughness={0.08}
          metalness={0.08}
          transmission={0.96}
          transparent
          opacity={0.9}
          thickness={1.4}
          ior={1.2}
        />
      </mesh>

      <mesh scale={0.52}>
        <icosahedronGeometry args={[0.96, 2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#4da3ff"
          emissiveIntensity={0.55}
          roughness={0.15}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3.5, 2.6, 4]} intensity={1.8} color="#d9ebff" />
      <pointLight position={[-2.5, -2.2, 2.4]} intensity={1.2} color="#ffcb4e" />
      <pointLight position={[2.8, 1.8, 2.8]} intensity={1.4} color="#4da3ff" />
    </>
  );
}

function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <SceneLights />
        <CoreOrb />
      </Canvas>
    </div>
  );
}

export default HeroScene;