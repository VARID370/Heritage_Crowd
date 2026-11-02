'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse state
    const mouse = {
      x: null,
      y: null,
      radius: 140, // Interaction radius
      isActive: false,
    };

    // Responsive particle count based on viewport area
    const getParticleCount = (w, h) => {
      const area = w * h;
      if (w < 640) return 32;
      if (w < 1024) return 55;
      return Math.min(85, Math.floor(area / 20000));
    };

    let particleCount = getParticleCount(width, height);
    let particles = [];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? 0 : width);
        this.y = initial ? Math.random() * height : Math.random() * height;
        // Slow organic drift velocities
        const speed = Math.random() * 0.4 + 0.15;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.baseRadius = Math.random() * 1.5 + 1.0;
        this.radius = this.baseRadius;
        // Warm gold / champagne hues with soft luminescence
        this.alpha = Math.random() * 0.35 + 0.2;
        this.baseAlpha = this.alpha;
        this.hue = Math.random() > 0.6 ? 42 : 38; // Gold to amber tones
      }

      update() {
        // Base movement
        this.x += this.vx;
        this.y += this.vy;

        // Screen boundary wrapping
        if (this.x < -10) this.x = width + 10;
        else if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        else if (this.y > height + 10) this.y = -10;

        // Gentle cursor interaction
        if (mouse.isActive && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            // Smooth repulsion push
            const force = (1 - dist / mouse.radius) * 1.8;
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force;
            this.y -= Math.sin(angle) * force;

            // Subtle glow boost near cursor
            this.alpha = Math.min(0.85, this.baseAlpha + (1 - dist / mouse.radius) * 0.4);
            this.radius = this.baseRadius * (1 + (1 - dist / mouse.radius) * 0.6);
          } else {
            // Decay back to base state smoothly
            this.alpha += (this.baseAlpha - this.alpha) * 0.05;
            this.radius += (this.baseRadius - this.radius) * 0.05;
          }
        } else {
          this.alpha += (this.baseAlpha - this.alpha) * 0.05;
          this.radius += (this.baseRadius - this.radius) * 0.05;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 85%, 65%, ${this.alpha})`;
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    initParticles();

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particleCount = getParticleCount(width, height);
      initParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Mouse & Touch listeners (passive for maximum scroll performance)
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.x = null;
      mouse.y = null;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.isActive = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.isActive = false;
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Render loop
    const connectMaxDist = 110;
    const connectMaxDistSq = connectMaxDist * connectMaxDist;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const pLen = particles.length;

      // Update & Draw particles
      for (let i = 0; i < pLen; i++) {
        const p = particles[i];
        p.update();
        p.draw();

        // Connect nearby particles with delicate glowing web
        for (let j = i + 1; j < pLen; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectMaxDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / connectMaxDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(246, 205, 85, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Connect particles to active cursor
        if (mouse.isActive && mouse.x !== null && mouse.y !== null) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          const mRadiusSq = mouse.radius * mouse.radius;

          if (mDistSq < mRadiusSq) {
            const mDist = Math.sqrt(mDistSq);
            const mLineAlpha = (1 - mDist / mouse.radius) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(230, 168, 23, ${mLineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // If prefers-reduced-motion is enabled, draw once statically
    if (prefersReducedMotion) {
      particles.forEach((p) => p.draw());
    } else {
      render();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Dynamic Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full opacity-70"
      />

      {/* Subtle deep ambient glow gradients (luxury navy/gold) */}
      <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-gold-500/[0.04] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-navy-600/[0.15] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[50vw] rounded-full bg-gradient-to-t from-gold-600/[0.03] to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}

