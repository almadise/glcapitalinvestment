'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface StatItem {
  id: string;
  value: string;
  suffixFr: string;
  suffixEn: string;
  labelFr: string;
  labelEn: string;
  sublabelFr: string;
  sublabelEn: string;
}

const stats: StatItem[] = [
  {
    id: 'ticket',
    value: '5',
    suffixFr: 'M€',
    suffixEn: 'M€',
    labelFr: 'Ticket minimum',
    labelEn: 'Minimum ticket',
    sublabelFr: 'Montant de financement',
    sublabelEn: 'Financing amount',
  },
  {
    id: 'modes',
    value: '8',
    suffixFr: '',
    suffixEn: '',
    labelFr: 'Modes de financement',
    labelEn: 'Financing modes',
    sublabelFr: 'Solutions structurées',
    sublabelEn: 'Structured solutions',
  },
  {
    id: 'continents',
    value: '5',
    suffixFr: '',
    suffixEn: '',
    labelFr: 'Continents',
    labelEn: 'Continents',
    sublabelFr: 'Couverture mondiale',
    sublabelEn: 'Global coverage',
  },
  {
    id: 'response',
    value: '48',
    suffixFr: 'h',
    suffixEn: 'h',
    labelFr: 'Délai de réponse',
    labelEn: 'Response time',
    sublabelFr: 'Accusé de réception',
    sublabelEn: 'Acknowledgement',
  },
];

export default function TrustBar() {
  const { t } = useLanguage();
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
    <div
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #D8E0EC',
        borderBottom: '1px solid #D8E0EC',
      }}
      ref={ref}
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.id}
              className="text-center px-8 py-6"
              style={{ borderRight: '1px solid #D8E0EC' }}
            >
              <div
                className="text-4xl lg:text-5xl font-bold tabular-nums mb-1"
                style={{ color: '#1E2D4A' }}
              >
                {counts[i]}
                {t(stat.suffixFr, stat.suffixEn)}
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#B8912A' }}>
                {t(stat.labelFr, stat.labelEn)}
              </p>
              <p className="text-xs" style={{ color: '#4A5C7A' }}>
                {t(stat.sublabelFr, stat.sublabelEn)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
