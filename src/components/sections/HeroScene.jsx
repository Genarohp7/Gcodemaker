import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function generateParticlePositions(total = 180) {
  const points = [];

  for (let i = 0; i < total; i += 1) {
    const radius = 2 + Math.random() * 0.75;
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
  const shellRef = useRef(null);
  const coreRef = useRef(null);
  const ringPrimaryRef = useRef(null);
  const ringSecondaryRef = useRef(null);
  const haloRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetX = state.pointer.y * 0.28;
    const targetY = state.pointer.x * 0.45;

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

    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.08;

    if (shellRef.current) {
      shellRef.current.rotation.x += delta * 0.12;
      shellRef.current.rotation.y += delta * 0.18;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.26;
      coreRef.current.rotation.z += delta * 0.08;
    }

    if (ringPrimaryRef.current) {
      ringPrimaryRef.current.rotation.z += delta * 0.22;
    }

    if (ringSecondaryRef.current) {
      ringSecondaryRef.current.rotation.x -= delta * 0.16;
      ringSecondaryRef.current.rotation.y += delta * 0.1;
    }

    if (haloRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.035;
      haloRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} scale={1.04}>
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
          color="#bfe4ff"
          size={0.032}
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <mesh ref={haloRef} scale={1.1}>
        <sphereGeometry args={[1.35, 48, 48]} />
        <meshBasicMaterial
          color="#4da3ff"
          transparent
          opacity={0.05}
        />
      </mesh>

      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.72, 1]} />
        <meshBasicMaterial
          color="#4da3ff"
          wireframe
          transparent
          opacity={0.32}
        />
      </mesh>

      <mesh ref={ringPrimaryRef} rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[2.04, 0.028, 20, 200]} />
        <meshStandardMaterial
          color="#4da3ff"
          emissive="#4da3ff"
          emissiveIntensity={0.42}
          metalness={0.5}
          roughness={0.16}
        />
      </mesh>

      <mesh ref={ringSecondaryRef} rotation={[-Math.PI / 4.8, 0, Math.PI / 8]}>
        <torusGeometry args={[1.34, 0.04, 20, 180]} />
        <meshStandardMaterial
          color="#ffcb4e"
          emissive="#ffcb4e"
          emissiveIntensity={0.28}
          metalness={0.35}
          roughness={0.22}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.98, 3]} />
        <meshPhysicalMaterial
          color="#d8eeff"
          emissive="#4da3ff"
          emissiveIntensity={0.24}
          roughness={0.06}
          metalness={0.08}
          transmission={0.98}
          transparent
          opacity={0.94}
          thickness={1.6}
          ior={1.22}
        />
      </mesh>

      <mesh scale={0.5}>
        <icosahedronGeometry args={[0.96, 2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#4da3ff"
          emissiveIntensity={0.72}
          roughness={0.14}
          metalness={0.14}
        />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[3.6, 2.8, 4]} intensity={2} color="#e4f2ff" />
      <pointLight position={[-2.6, -2.1, 2.5]} intensity={1.25} color="#ffcb4e" />
      <pointLight position={[2.8, 1.9, 2.9]} intensity={1.6} color="#4da3ff" />
    </>
  );
}

function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <SceneLights />
        <CoreOrb />
      </Canvas>
    </div>
  );
}

export default HeroScene;