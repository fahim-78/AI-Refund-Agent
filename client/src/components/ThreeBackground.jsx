import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap,
  MessageCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react';

const FloatingCard = ({ children, delay = 0, style = {} }) => {
  return (
    <div 
      className="fintech-floating-card"
      style={{ 
        animationDelay: `${delay}s`,
        animationDuration: '6s',
        ...style
      }}
    >
      {children}
    </div>
  );
};

const Particle = ({ delay = 0 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    setPosition({
      x: Math.random() * 100,
      y: Math.random() * 100
    });
  }, []);

  return (
    <div
      className="fintech-particle"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: `${delay}s`,
        animationDuration: '3s'
      }}
    />
  );
};

export default function ThreeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
        ctx.fill();

        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(124, 58, 237, ${0.2 * (1 - distance / 150)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fintech-bg-container">
      <style>{`
        .fintech-bg-container {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #0b0f19 0%, #171d2f 50%, #0b0f19 100%);
          z-index: -2;
          pointer-events: none;
        }
        .fintech-bg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .fintech-bg-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05), rgba(6, 182, 212, 0.05));
        }
        .fintech-bg-grid-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image: 
            linear-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .fintech-bg-glow-orb-1 {
          position: absolute;
          top: 10%;
          left: 10%;
          width: 384px;
          height: 384px;
          background: rgba(37, 99, 235, 0.12);
          border-radius: 50%;
          filter: blur(80px);
          animation: fintech-pulse 8s infinite alternate;
        }
        .fintech-bg-glow-orb-2 {
          position: absolute;
          bottom: 10%;
          right: 10%;
          width: 384px;
          height: 384px;
          background: rgba(124, 58, 237, 0.12);
          border-radius: 50%;
          filter: blur(80px);
          animation: fintech-pulse 10s infinite alternate;
          animation-delay: 2s;
        }
        .fintech-bg-glow-orb-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: rgba(6, 182, 212, 0.05);
          border-radius: 50%;
          filter: blur(100px);
          animation: fintech-pulse 12s infinite alternate;
          animation-delay: 4s;
        }
        .fintech-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(96, 165, 250, 0.3);
          border-radius: 50%;
          animation: fintech-pulse 3s infinite;
        }
        .fintech-floating-card {
          position: absolute;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
          animation: fintech-float 6s ease-in-out infinite;
          color: #fff;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          pointer-events: none;
        }
        .fintech-floating-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          transform: scale(1.02);
        }
        @keyframes fintech-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fintech-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .ft-flex-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ft-flex-start {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .ft-flex-1 {
          flex: 1;
        }
        .ft-justify-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ft-badge {
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ft-badge-green {
          background: rgba(16, 185, 129, 0.15);
        }
        .ft-badge-purple {
          background: rgba(124, 58, 237, 0.15);
        }
        .ft-badge-blue {
          background: rgba(37, 99, 235, 0.15);
        }
        .ft-badge-cyan {
          background: rgba(6, 182, 212, 0.15);
        }
        .ft-text-green {
          color: #34d399;
          font-weight: 600;
        }
        .ft-text-purple {
          color: #c084fc;
        }
        .ft-text-blue {
          color: #60a5fa;
        }
        .ft-text-cyan {
          color: #22d3ee;
        }
        .ft-text-yellow {
          color: #fbbf24;
        }
        .ft-text-white-90 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }
        .ft-text-white-70 {
          color: rgba(255, 255, 255, 0.7);
        }
        .ft-text-white-60 {
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }
        .ft-bold {
          font-weight: 700;
        }
        .ft-semibold {
          font-weight: 600;
        }
        .ft-text-xs {
          font-size: 11px;
        }
        .ft-text-sm {
          font-size: 13px;
        }
        .ft-text-lg {
          font-size: 18px;
        }
        .ft-text-xl {
          font-size: 22px;
        }
        .ft-space-y-2 > * + * {
          margin-top: 8px;
        }
        .ft-space-y-3 > * + * {
          margin-top: 12px;
        }
        .ft-center {
          text-align: center;
        }
        .ft-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .ft-pulse-circle {
          animation: fintech-pulse 2s infinite;
        }
      `}</style>
      <canvas ref={canvasRef} className="fintech-bg-canvas" />
      <div className="fintech-bg-gradient-overlay" />
      <div className="fintech-bg-grid-overlay" />
      
      <div className="fintech-bg-glow-orb-1" />
      <div className="fintech-bg-glow-orb-2" />
      <div className="fintech-bg-glow-orb-3" />

      {[...Array(20)].map((_, i) => (
        <Particle key={i} delay={i * 0.25} />
      ))}

      {/* Card 1: Refund Approved */}
      <FloatingCard delay={0} style={{ top: "12%", left: "6%", width: "300px" }}>
        <div className="ft-flex-start">
          <div className="ft-badge ft-badge-green">
            <CheckCircle className="ft-text-green" style={{ width: "20px", height: "20px" }} />
          </div>
          <div className="ft-flex-1">
            <div className="ft-justify-between" style={{ marginBottom: "6px" }}>
              <span className="ft-text-white-90 ft-semibold">Refund Approved</span>
              <span className="ft-text-white-60">2m ago</span>
            </div>
            <p className="ft-text-white-70 ft-text-xs" style={{ margin: "0 0 6px" }}>Transaction #RF-8472</p>
            <div className="ft-justify-between">
              <span className="ft-text-white-90 ft-bold ft-text-xl">$249.99</span>
              <span className="ft-text-green ft-text-xs ft-flex-row" style={{ gap: "4px" }}>
                <TrendingUp style={{ width: "12px", height: "12px" }} />
                Processed
              </span>
            </div>
          </div>
        </div>
      </FloatingCard>

      {/* Card 2: AI Assistant */}
      <FloatingCard delay={1} style={{ top: "42%", right: "5%", width: "260px" }}>
        <div className="ft-space-y-3">
          <div className="ft-flex-row">
            <Bot className="ft-text-blue" style={{ width: "18px", height: "18px" }} />
            <span className="ft-text-white-90 ft-semibold ft-text-sm">AI Assistant</span>
          </div>
          <div style={{ background: "rgba(37, 99, 235, 0.12)", borderRadius: "8px", padding: "10px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
            <p className="ft-text-white-90 ft-text-xs" style={{ margin: 0, lineHeight: 1.4 }}>
              "I've processed your refund request. The amount will be credited within 3-5 business days."
            </p>
          </div>
          <div className="ft-flex-row ft-text-white-60 ft-text-xs" style={{ gap: "6px" }}>
            <Clock style={{ width: "12px", height: "12px" }} />
            <span>Instant response</span>
          </div>
        </div>
      </FloatingCard>

      {/* Card 3: Payment Status */}
      <FloatingCard delay={2} style={{ bottom: "18%", left: "8%", width: "240px" }}>
        <div className="ft-space-y-3">
          <div className="ft-justify-between">
            <span className="ft-text-white-90 ft-semibold ft-text-sm">Payment Status</span>
            <Shield className="ft-text-cyan" style={{ width: "18px", height: "18px" }} />
          </div>
          <div className="ft-space-y-2">
            <div className="ft-justify-between ft-text-xs">
              <span className="ft-text-white-70">Security Check</span>
              <span className="ft-text-green">✓ Verified</span>
            </div>
            <div className="ft-justify-between ft-text-xs">
              <span className="ft-text-white-70">Fraud Detection</span>
              <span className="ft-text-green">✓ Clear</span>
            </div>
            <div className="ft-justify-between ft-text-xs">
              <span className="ft-text-white-70">AI Analysis</span>
              <span className="ft-text-green">✓ Complete</span>
            </div>
          </div>
        </div>
      </FloatingCard>

      {/* Card 4: Total Recovered */}
      <FloatingCard delay={3} style={{ top: "60%", right: "20%", width: "220px" }}>
        <div className="ft-flex-row" style={{ gap: "12px" }}>
          <div className="ft-badge ft-badge-purple" style={{ padding: "10px", borderRadius: "50%" }}>
            <CreditCard className="ft-text-purple" style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <p className="ft-text-white-60 ft-text-xs" style={{ margin: 0 }}>Total Recovered</p>
            <p className="ft-text-white-90 ft-bold ft-text-lg" style={{ margin: "2px 0 0" }}>$12,847</p>
            <p className="ft-text-green ft-text-xs ft-flex-row" style={{ gap: "4px", margin: 0 }}>
              <ArrowRight style={{ width: "10px", height: "10px" }} />
              +23% this month
            </p>
          </div>
        </div>
      </FloatingCard>

      {/* Card 5: AI Insights */}
      <FloatingCard delay={4} style={{ top: "22%", right: "12%", width: "230px" }}>
        <div className="ft-space-y-2">
          <div className="ft-flex-row" style={{ marginBottom: "6px" }}>
            <Sparkles className="ft-text-yellow" style={{ width: "16px", height: "16px" }} />
            <span className="ft-text-white-90 ft-semibold ft-text-sm">AI Insights</span>
          </div>
          <div className="ft-space-y-2 ft-text-xs ft-text-white-70">
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#60a5fa" }} />
              <span>98% success rate</span>
            </div>
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#c084fc" }} />
              <span>Avg. 2.3 min resolution</span>
            </div>
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#22d3ee" }} />
              <span>24/7 automated support</span>
            </div>
          </div>
        </div>
      </FloatingCard>

      {/* Card 6: Fast Processing */}
      <FloatingCard delay={5} style={{ bottom: "32%", right: "38%", width: "180px" }}>
        <div className="ft-center ft-space-y-2">
          <div className="ft-badge ft-badge-blue" style={{ display: "inline-flex", padding: "10px", borderRadius: "50%" }}>
            <Zap className="ft-text-yellow" style={{ width: "20px", height: "20px" }} />
          </div>
          <p className="ft-text-white-90 ft-semibold ft-text-sm" style={{ margin: 0 }}>Fast Processing</p>
          <p className="ft-text-white-60 ft-text-xs" style={{ margin: 0 }}>Powered by AI</p>
        </div>
      </FloatingCard>

      {/* Card 7: Recent Activity */}
      <FloatingCard delay={6} style={{ bottom: "12%", right: "10%", width: "250px" }}>
        <div className="ft-space-y-3">
          <div className="ft-flex-row">
            <MessageCircle className="ft-text-cyan" style={{ width: "16px", height: "16px" }} />
            <span className="ft-text-white-90 ft-semibold ft-text-sm">Recent Activity</span>
          </div>
          <div className="ft-space-y-2 ft-text-white-70 ft-text-xs">
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#34d399" }} />
              <span>Refund initiated</span>
            </div>
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#60a5fa" }} />
              <span>AI verification complete</span>
            </div>
            <div className="ft-flex-row" style={{ gap: "8px" }}>
              <div className="ft-dot" style={{ background: "#c084fc" }} />
              <span>Payment processed</span>
            </div>
          </div>
        </div>
      </FloatingCard>

      {/* Floating SVGs */}
      <div className="ft-pulse-circle" style={{ position: "absolute", top: "35%", left: "32%", width: "120px", height: "120px", pointerEvents: "none", opacity: 0.15 }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient1)" strokeWidth="2" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#gradient1)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="url(#gradient1)" strokeWidth="1" />
        </svg>
      </div>

      <div className="ft-pulse-circle" style={{ position: "absolute", bottom: "42%", left: "22%", width: "96px", height: "96px", pointerEvents: "none", opacity: 0.2, animationDelay: "1s" }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="url(#gradient2)" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
