import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function FloatingOrb({ position, color, speed, distort, scale }) {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.4) * 0.3;
      meshRef.current.rotation.y += 0.005 * speed;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[scale, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={2}
          roughness={0.1}
          metalness={0.3}
          opacity={0.7}
          transparent
        />
      </Sphere>
    </Float>
  );
}

function ParticleField() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const pointsRef = useRef();
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#a78bfa" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function LoginScene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#818cf8" />
      <pointLight position={[-5, -5, 3]} intensity={1} color="#34d399" />

      <Stars radius={50} depth={20} count={500} factor={2} fade speed={0.5} />
      <ParticleField />

      <FloatingOrb position={[-3, 1.5, -2]} color="#6366f1" speed={1.2} distort={0.5} scale={1.2} />
      <FloatingOrb position={[3, -1, -1]} color="#34d399" speed={0.8} distort={0.4} scale={0.9} />
      <FloatingOrb position={[0, -2.5, -3]} color="#a78bfa" speed={1.5} distort={0.6} scale={0.7} />
      <FloatingOrb position={[-2, -1.5, 1]} color="#60a5fa" speed={1.0} distort={0.35} scale={0.5} />
      <FloatingOrb position={[2.5, 2, -2]} color="#f472b6" speed={1.3} distort={0.45} scale={0.6} />
    </Canvas>
  );
}
