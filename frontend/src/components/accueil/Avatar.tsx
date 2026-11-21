export type AvatarStyle = 'short' | 'long' | 'cap' | 'hijab';

export interface AvatarProps {
  bg: string;
  skin: string;
  hair: string;
  shirt: string;
  style: AvatarStyle;
}

/** Quelques citoyens dessinés en SVG, utilisés par l'accueil (aucune image externe). */
export const AVATARS = {
  a: { bg: '#ffe2b8', skin: '#e8b48a', hair: '#3b2a20', shirt: '#2b3fcb', style: 'short' },
  b: { bg: '#d9f2e6', skin: '#f0c7a0', hair: '#5a3b2e', shirt: '#0c7a5c', style: 'hijab' },
  c: { bg: '#ffd9d2', skin: '#c98a62', hair: '#1f1a17', shirt: '#e0502f', style: 'cap' },
  d: { bg: '#e2dcff', skin: '#f2cfa8', hair: '#7a4a2a', shirt: '#6a4bd6', style: 'long' },
  e: { bg: '#cfe8ff', skin: '#b97d56', hair: '#222222', shirt: '#a15c00', style: 'short' },
  f: { bg: '#fde6f1', skin: '#f0c7a0', hair: '#c8c8d4', shirt: '#c2418a', style: 'hijab' },
} satisfies Record<string, AvatarProps>;

export default function Avatar({ bg, skin, hair, shirt, style }: AvatarProps) {
  const arriere =
    style === 'hijab' ? (
      <path d="M14 44c0-18 8-28 26-28s26 10 26 28v14H14z" fill={hair} />
    ) : style === 'long' ? (
      <path d="M16 42c0-18 8-26 24-26s24 8 24 26v22H52V40H28v24H16z" fill={hair} />
    ) : null;

  const avant =
    style === 'cap' ? (
      <>
        <path d="M22 34c0-12 7-18 18-18s18 6 18 18z" fill={hair} />
        <rect x="18" y="32" width="44" height="5" rx="2.5" fill={hair} />
      </>
    ) : style === 'short' ? (
      <path d="M23 36c0-13 7-19 17-19s17 6 17 19c-6-5-12-7-17-7s-11 2-17 7z" fill={hair} />
    ) : style === 'hijab' ? (
      <path d="M24 38c0-12 6-18 16-18s16 6 16 18c0-5-7-9-16-9s-16 4-16 9z" fill={hair} />
    ) : null;

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="block size-full">
      <rect width="80" height="80" fill={bg} />
      {arriere}
      <path d="M8 80c0-16 14-24 32-24s32 8 32 24z" fill={shirt} />
      <rect x="35" y="50" width="10" height="9" rx="3" fill={skin} />
      <circle cx="40" cy="38" r="15" fill={skin} />
      {avant}
      <circle cx="34.5" cy="38" r="1.7" fill="#1b1b2f" />
      <circle cx="45.5" cy="38" r="1.7" fill="#1b1b2f" />
      <path d="M35 44.5q5 4 10 0" stroke="#1b1b2f" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
