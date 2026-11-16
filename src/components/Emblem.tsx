/** Placeholder Mandir Mandal emblem — to be replaced with the Mandal-approved mark (BRD A-01). */
export function Emblem({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill="#7c2d12" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#f5c76b" strokeWidth="1.5" />
      <path d="M32 14c-4 7-9 10-9 17a9 9 0 0 0 18 0c0-7-5-10-9-17Z" fill="#f59e0b" />
      <path d="M32 22c-2 4-4.5 6-4.5 9.5a4.5 4.5 0 0 0 9 0C36.5 28 34 26 32 22Z" fill="#fde68a" />
      <path d="M16 44h32l-3 6H19z" fill="#f5c76b" />
    </svg>
  );
}

export function YatraMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0f766e" />
      <path d="M14 44c8-14 14-20 18-20s10 6 18 20" stroke="#ccfbf1" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="20" r="5" fill="#fbbf24" />
    </svg>
  );
}
