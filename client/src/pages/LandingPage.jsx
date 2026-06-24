import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, Environment, MeshTransmissionMaterial, Wireframe } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import AdminOversightCard from "../components/AdminOversightCard.jsx";

// Invisible 3D mesh that lives inside ScrollControls and relays tier-3 scroll
// progress (scroll.range(2/3, 1/3)) back up to React state via a callback.
function Tier3ScrollBridge({ onProgress }) {
  const scroll = useScroll();
  useFrame(() => {
    const p = scroll.range(2 / 3, 1 / 3);
    onProgress(p);
  });
  return null;
}

// Geometric core for AI Agent
function AICore(props) {
  const ref = useRef();
  const scroll = useScroll();

  useFrame((state, delta) => {
    const r1 = scroll.range(0, 1 / 3);
    const r2 = scroll.range(1 / 3, 1 / 3);

    // Rotate and scale based on scroll
    ref.current.rotation.x += delta * 0.5;
    ref.current.rotation.y += delta * 0.2;
    ref.current.scale.setScalar(1 + r1 * 0.5 - r2 * 1);
    ref.current.position.y = r1 * 2 - r2 * 5;
    ref.current.material.opacity = 1 - r2;
  });

  return (
    <mesh ref={ref} {...props}>
      <icosahedronGeometry args={[1.5, 2]} />
      <MeshTransmissionMaterial
        samples={8} thickness={2} roughness={0.1} chromaticAberration={0.1}
        color="#0d9488" transparent
      />
    </mesh>
  );
}

// Nodes for Escalation
function HumanNodes(props) {
  const ref = useRef();
  const scroll = useScroll();

  useFrame((state, delta) => {
    const r1 = scroll.range(0, 1 / 3);
    const r2 = scroll.range(1 / 3, 1 / 3);
    const r3 = scroll.range(2 / 3, 1 / 3);

    ref.current.rotation.z += delta * 0.1;
    ref.current.position.y = -5 + r2 * 5 - r3 * 5;
    ref.current.material.opacity = r2 - r3;

    // Start invisible, appear in second third
    if (r1 < 0.9) ref.current.visible = false;
    else ref.current.visible = true;
  });

  return (
    <mesh ref={ref} {...props}>
      <torusGeometry args={[2, 0.4, 16, 100]} />
      <meshPhysicalMaterial
        color="#6366f1" metalness={0.8} roughness={0.2} transparent
      />
    </mesh>
  );
}

// ── Tier 3: Oversight Orrery ──────────────────────────────────────────────
// Central surveillance sphere + 3 tilted orbital rings + orbiting data nodes.
// Every transform is driven purely by scroll (r3 = 0→1 over the 3rd page).

function OrreryCore({ scrollR3 }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.4;
    ref.current.rotation.x += delta * 0.15;
    // bloom-like scale pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    const base = scrollR3 * pulse;
    ref.current.scale.setScalar(base);
    ref.current.material.opacity = scrollR3;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.9, 64, 64]} />
      <MeshTransmissionMaterial
        samples={6} thickness={1.8} roughness={0.05}
        chromaticAberration={0.12} color="#10b981" transparent
      />
    </mesh>
  );
}

// One orbital ring that tilts into position as scroll advances
function OrbitalRing({ tiltX, tiltZ, radius, tubeR, color, scrollR3, phase = 0 }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    // continuous spin around its own axis
    ref.current.rotation.y += delta * (0.3 + phase * 0.15);
    // unroll tilt from 0 → final angle driven by scroll
    ref.current.rotation.x = tiltX * scrollR3;
    ref.current.rotation.z = tiltZ * scrollR3;
    // fade + scale in
    ref.current.material.opacity = Math.min(scrollR3 * 1.4, 1);
    ref.current.scale.setScalar(0.1 + scrollR3 * 0.9);
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, tubeR, 16, 120]} />
      <meshPhysicalMaterial
        color={color} metalness={0.9} roughness={0.1} transparent
        emissive={color} emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// One small data-node sphere orbiting on a ring
function DataNode({ ringRadius, speed, color, startAngle, scrollR3 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const angle = startAngle + state.clock.elapsedTime * speed;
    // spiral outward from center as scroll comes in
    const r = ringRadius * scrollR3;
    ref.current.position.x = Math.cos(angle) * r;
    ref.current.position.z = Math.sin(angle) * r;
    ref.current.position.y = Math.sin(angle * 0.7) * 0.4 * scrollR3;
    ref.current.material.opacity = scrollR3;
    const s = 0.05 + scrollR3 * 0.09;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={color} emissive={color}
        emissiveIntensity={1.2 * scrollR3} transparent
      />
    </mesh>
  );
}

// Wrapper that reads scroll and composes the whole orrery
function OversightOrrery() {
  const scroll = useScroll();
  const groupRef = useRef();
  const [r3, setR3] = useState(0);

  useFrame((state, delta) => {
    const val = scroll.range(2 / 3, 1 / 3);
    setR3(val);
    if (!groupRef.current) return;
    // float the whole group down into frame
    groupRef.current.position.y = -10 + val * 10;
    groupRef.current.rotation.y += delta * 0.08;
  });

  const nodes = [
    { r: 1.8, spd: 0.8, col: "#10b981", a: 0.0 },
    { r: 1.8, spd: 0.8, col: "#34d399", a: 1.0 },
    { r: 1.8, spd: 0.8, col: "#6ee7b7", a: 2.2 },
    { r: 1.8, spd: 0.8, col: "#10b981", a: 3.5 },
    { r: 2.6, spd: -0.5, col: "#6366f1", a: 0.5 },
    { r: 2.6, spd: -0.5, col: "#818cf8", a: 1.8 },
    { r: 2.6, spd: -0.5, col: "#a5b4fc", a: 3.2 },
    { r: 2.6, spd: -0.5, col: "#6366f1", a: 4.8 },
    { r: 3.4, spd: 0.35, col: "#f59e0b", a: 1.2 },
    { r: 3.4, spd: 0.35, col: "#fbbf24", a: 2.7 },
    { r: 3.4, spd: 0.35, col: "#fcd34d", a: 4.1 },
    { r: 3.4, spd: 0.35, col: "#f59e0b", a: 5.6 },
  ];

  return (
    <group ref={groupRef}>
      <OrreryCore scrollR3={r3} />
      {/* Three tilted orbital rings */}
      <OrbitalRing tiltX={Math.PI / 2.2} tiltZ={0} radius={1.8} tubeR={0.025} color="#10b981" scrollR3={r3} phase={0} />
      <OrbitalRing tiltX={Math.PI / 5} tiltZ={Math.PI / 3.5} radius={2.6} tubeR={0.02} color="#6366f1" scrollR3={r3} phase={1} />
      <OrbitalRing tiltX={-Math.PI / 7} tiltZ={-Math.PI / 4} radius={3.4} tubeR={0.015} color="#f59e0b" scrollR3={r3} phase={2} />
      {/* Orbiting data nodes on each ring */}
      {nodes.map((n, i) => (
        <DataNode key={i} ringRadius={n.r} speed={n.spd} color={n.col} startAngle={n.a} scrollR3={r3} />
      ))}
      {/* Point lights for glow */}
      <pointLight color="#10b981" intensity={2 * r3} distance={8} />
      <pointLight color="#6366f1" intensity={1.5 * r3} distance={6} position={[3, 0, 0]} />
    </group>
  );
}


function Scene({ onTier3Progress }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Environment preset="city" />

      <AICore position={[2, 0, 0]} />
      <HumanNodes position={[-2, -5, 0]} />
      <OversightOrrery />
      <Tier3ScrollBridge onProgress={onTier3Progress} />
    </>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [tier3Progress, setTier3Progress] = useState(0);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#0b0f19" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ScrollControls pages={3} damping={0.2}>
          <Scene onTier3Progress={setTier3Progress} />

          <Scroll html style={{ width: '100vw' }}>
            <div style={{ height: "100vh", padding: "10vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h1 style={{ fontSize: "4rem", color: "#f8fafc", margin: 0, fontFamily: "Space Grotesk" }}>
                Tier 1: <span style={{ color: "#0d9488" }}>AI Agent</span>
              </h1>
              <p style={{ fontSize: "1.5rem", color: "#94a3b8", maxWidth: "500px", fontFamily: "Inter", marginTop: "20px" }}>
                Instant resolution. Handling 80% of refunds autonomously, powered by advanced LLMs without human intervention.
              </p>
            </div>

            <div style={{ height: "100vh", padding: "10vw", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", textAlign: "right" }}>
              <h1 style={{ fontSize: "4rem", color: "#f8fafc", margin: 0, fontFamily: "Space Grotesk" }}>
                Tier 2: <span style={{ color: "#6366f1" }}>Human Escalation</span>
              </h1>
              <p style={{ fontSize: "1.5rem", color: "#94a3b8", maxWidth: "500px", fontFamily: "Inter", marginTop: "20px" }}>
                Seamless escalation. High-value orders and complex policies are intelligently and instantly routed to human experts.
              </p>
            </div>

            <div style={{
              height: "100vh",
              padding: "6vw 10vw",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "4vw",
              flexWrap: "wrap"
            }}>
              {/* Left: Text + CTA */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 100, padding: "6px 14px", marginBottom: 20
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <span style={{ fontSize: "0.75rem", color: "#10b981", fontFamily: "Inter", fontWeight: 600, letterSpacing: "0.05em" }}>TIER 3</span>
                </div>

                <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.5rem)", color: "#f8fafc", margin: "0 0 16px", fontFamily: "Space Grotesk", lineHeight: 1.1 }}>
                  Admin<br /><span style={{ color: "#10b981" }}>Oversight</span>
                </h1>

                <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: "380px", fontFamily: "Inter", lineHeight: 1.7, margin: "0 0 32px" }}>
                  Total control. Live monitoring with real-time fraud-flag enforcement and complete AI reasoning visibility for every session.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
                  {[
                    { icon: "", text: "" },
                    { icon: "", text: "" },
                    { icon: "", text: "" },
                  ].map((f) => (
                    <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1rem" }}>{f.icon}</span>
                      <span style={{ fontSize: "0.9rem", color: "#cbd5e1", fontFamily: "Inter" }}>{f.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/chat')}
                  style={{
                    padding: "15px 36px", fontSize: "1rem", fontWeight: 700,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff", border: "none", borderRadius: 100,
                    cursor: "pointer", fontFamily: "Inter",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px) scale(1.04)";
                    e.currentTarget.style.boxShadow = "0 16px 36px rgba(16,185,129,0.5)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.35)";
                  }}
                >
                  Experience the Agent →
                </button>
              </div>

              {/* Right: Live Dashboard Card — scroll progress wired from ScrollControls */}
              <div style={{ flex: 1, minWidth: 300, maxWidth: 490, display: "flex", justifyContent: "center" }}>
                <AdminOversightCard scrollProgress={tier3Progress} />
              </div>
            </div>
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}
