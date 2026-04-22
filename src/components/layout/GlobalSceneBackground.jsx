import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function generateParticlePositions(total = 120) {
  const points = [];

  for (let i = 0; i < total; i += 1) {
    const radius = 2.6 + Math.random() * 1.1;
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

function AmbientCore() {
  const groupRef = useRef(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const ringRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.035;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.35) * 0.12;

    if (outerRef.current) {
      outerRef.current.rotation.x += delta * 0.03;
      outerRef.current.rotation.y += delta * 0.05;
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.08;
      innerRef.current.rotation.z += delta * 0.02;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.045;
      ringRef.current.rotation.x -= delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} scale={1.6} position={[0, 0.2, 0]}>
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
          size={0.022}
          transparent
          opacity={0.22}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.9, 1]} />
        <meshBasicMaterial
          color="#4da3ff"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[0.6, 0, 0.2]}>
        <torusGeometry args={[2.3, 0.018, 16, 180]} />
        <meshStandardMaterial
          color="#4da3ff"
          emissive="#4da3ff"
          emissiveIntensity={0.08}
          metalness={0.35}
          roughness={0.22}
          transparent
          opacity={0.65}
        />
      </mesh>

      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.02, 2]} />
        <meshPhysicalMaterial
          color="#b9deff"
          emissive="#4da3ff"
          emissiveIntensity={0.08}
          roughness={0.1}
          metalness={0.04}
          transmission={0.96}
          transparent
          opacity={0.18}
          thickness={1}
          ior={1.2}
        />
      </mesh>

      <mesh scale={0.44}>
        <icosahedronGeometry args={[0.96, 2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#4da3ff"
          emissiveIntensity={0.2}
          roughness={0.18}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[3.2, 2.4, 4]}
        intensity={0.75}
        color="#d9ebff"
      />
      <pointLight
        position={[-2.5, -1.8, 2.2]}
        intensity={0.42}
        color="#ffcb4e"
      />
      <pointLight
        position={[2.6, 1.6, 2.6]}
        intensity={0.52}
        color="#4da3ff"
      />
    </>
  );
}

function GlobalSceneBackground() {
  return (
    <div className="global-scene-background" aria-hidden="true">
      <Canvas
        dpr={[1, 1.35]}
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneLights />
        <AmbientCore />
      </Canvas>
    </div>
  );
}

export default GlobalSceneBackground;