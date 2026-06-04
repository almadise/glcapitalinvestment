'use client';

import React from 'react';

type ServiceHeroBackgroundProps = {
  backgroundImage: string;
};

/** Couches d'overlay sur l'image de fond (lisibilité du texte blanc). */
export function ServiceHeroBackground({ backgroundImage }: ServiceHeroBackgroundProps) {
  return (
    <>
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-navy/55" aria-hidden="true" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(6,15,30,0.82) 0%, rgba(30,45,74,0.75) 50%, rgba(6,15,30,0.85) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-navy-dark/90 via-navy/80 to-navy-light/85"
        aria-hidden="true"
      />
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold blur-3xl" />
      </div>
    </>
  );
}
