'use client';
import React, { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: string;
  suffix: string;
  label: string;
  sublabel: string;
}

const stats: StatItem[] = [
  { value: '5', suffix: 'M€', label: 'Ticket minimum', sublabel: 'Montant de financement' },
  { value: '8', suffix: '', label: 'Modes de financement', sublabel: 'Solutions structurées' },
  { value: '5', suffix: '', label: 'Continents', sublabel: 'Couverture mondiale' },
  { value: '48', suffix: 'h', label: 'Délai de réponse', sublabel: 'Accusé de réception' },
];

export default function TrustBar() {
  const [counts, setCounts] = useState(stats.map(() => 0));
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated.current) {
          animated.current = true;
          stats.forEach((stat, i) => {
            const target = parseInt(stat.value);
            const duration = 1500;
            const steps = 40;
            const increment = target / steps;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              setCounts((prev) => {
                const next = [...prev];
                next[i] = Math.round(current);
                return next;
              });
            }, duration / steps);
          });
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#FFFFFF', borderTop: '1px solid #D8E0EC', borderBottom: '1px solid #D8E0EC' }} ref={ref}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center px-8 py-6" style={{ borderRight: '1px solid #D8E0EC' }}>
              <div className="text-4xl lg:text-5xl font-bold tabular-nums mb-1" style={{ color: '#1E2D4A' }}>
                {counts[i]}{stat.suffix}
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#B8912A' }}>{stat.label}</p>
              <p className="text-xs" style={{ color: '#4A5C7A' }}>{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
