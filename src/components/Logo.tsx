import { useState } from 'react';
import { BRAND } from '../config';
import { useAppConfig } from '../lib/appConfig';
import { fixImageUrl } from './Art';

/** Site logo with a clean fallback if the image cannot load. */
export function Logo({ size = 34, className = '' }: { size?: number; className?: string }) {
  // 0: the logo, 1: the built-in mark that ships with the site, 2: a plain initial
  const [step, setStep] = useState(0);
  const { ipfsGateway } = useAppConfig();
  if (step > 1) return <span className={`logo-fallback ${className}`} style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden="true">{BRAND.name.charAt(0)}</span>;
  const src = step === 0 ? fixImageUrl(BRAND.logo, ipfsGateway) : BRAND.logoFallback;
  return <img src={src} alt="" width={size} height={size} className={`logo-img ${className}`} onError={() => setStep((s) => (s === 0 && BRAND.logo !== BRAND.logoFallback ? 1 : 2))} />;
}
