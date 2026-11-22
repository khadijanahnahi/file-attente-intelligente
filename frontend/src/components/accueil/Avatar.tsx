export type AvatarStyle = 'short' | 'long' | 'cap' | 'hijab';

export interface AvatarProps {
  bg: string;
  skin: string;
  hair: string;
  shirt: string;
  style: AvatarStyle;
  glasses?: boolean;
  beard?: boolean;
}

/** Citoyens dessinés en SVG (visage détaillé : oreilles, sourcils, yeux qui clignent, ombres). Aucune image externe. */
export const AVATARS = {
  a: { bg: '#ffe2b8', skin: '#e0a577', hair: '#2d2018', shirt: '#2b3fcb', style: 'short', glasses: true },
  b: { bg: '#d9f2e6', skin: '#f0c7a0', hair: '#0f6b53', shirt: '#0c7a5c', style: 'hijab' },
  c: { bg: '#ffd9d2', skin: '#bf7e55', hair: '#1f1a17', shirt: '#e0502f', style: 'cap', beard: true },
  d: { bg: '#e2dcff', skin: '#f2cfa8', hair: '#5b3420', shirt: '#6a4bd6', style: 'long' },
  e: { bg: '#cfe8ff', skin: '#b97d56', hair: '#222222', shirt: '#a15c00', style: 'short' },
  f: { bg: '#fde6f1', skin: '#f0c7a0', hair: '#c8c8d4', shirt: '#c2418a', style: 'hijab' },
} satisfies Record<string, AvatarProps>;

export default function Avatar({ bg, skin, hair, shirt, style, glasses, beard }: AvatarProps) {
  const hijab = style === 'hijab';
  const delai = `${(skin.charCodeAt(2) % 5) * -0.9}s`;

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="block size-full">
      <rect width="80" height="80" fill={bg} />
      <circle cx="62" cy="14" r="22" fill="#fff" opacity=".35" />

      {/* cheveux / voile derrière la tête */}
      {hijab && <path d="M21 41c0-18 7-28 19-28s19 10 19 28c0 9-2 14-4 17H25c-2-3-4-8-4-17z" fill={hair} />}
      {style === 'long' && <path d="M23.5 38c-3.5 14-2.5 29 0 36h9V50h15v24h9c2.5-7 3.5-22 0-36 0-15-6.5-24-16.5-24S23.5 23 23.5 38z" fill={hair} />}

      {/* buste */}
      <path d="M5 80c0-15 13-24 35-24s35 9 35 24z" fill={hijab ? hair : shirt} />
      <path d="M5 80c0-8 4-14 10-18-2 6-3 12-3 18z" fill="#fff" opacity=".14" />
      {hijab ? (
        <>
          <path d="M26 51c4 7 9 9 14 9s10-2 14-9l8 12c-4 8-12 12-22 12s-18-4-22-12z" fill={hair} />
          <path d="M30 62c4 3 8 4 10 4s6-1 10-4" stroke="#000" strokeOpacity=".18" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M20 70c6 2 12 3 20 3s14-1 20-3" stroke="#fff" strokeOpacity=".16" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="34.5" y="48" width="11" height="12" rx="4" fill={skin} />
          <path d="M34.5 54c3 3 8 3 11 0v-4h-11z" fill="#000" opacity=".14" />
          <path d="M32 57l8 11 8-11 5 3-13 17-13-17z" fill="#fff" opacity=".95" />
          <path d="M34.5 57.5L40 66l5.5-8.5" fill={skin} />
        </>
      )}

      {/* oreilles + tête */}
      <circle cx="25.8" cy="38.5" r="3.2" fill={skin} />
      <circle cx="54.2" cy="38.5" r="3.2" fill={skin} />
      <circle cx="25.8" cy="38.8" r="1.4" fill="#000" opacity=".1" />
      <circle cx="54.2" cy="38.8" r="1.4" fill="#000" opacity=".1" />
      <ellipse cx="40" cy="37" rx="13.8" ry="15.8" fill={skin} />
      <ellipse cx="34.5" cy="30" rx="6" ry="7.5" fill="#fff" opacity=".14" />
      <path d="M26.5 42c3 9 8 11 13.5 11s10.5-2 13.5-11c0 11-6 15.8-13.5 15.8S26.5 53 26.5 42z" fill="#000" opacity=".06" />

      {beard && <path d="M26.2 40c0 12.5 5 19 13.8 19s13.8-6.5 13.8-19c-2 5.5-6 7.5-13.8 7.5S28.2 45.5 26.2 40z" fill={hair} />}

      {/* visage */}
      <circle cx="32" cy="43.5" r="3.2" fill="#ff5d5d" opacity={beard ? 0 : 0.17} />
      <circle cx="48" cy="43.5" r="3.2" fill="#ff5d5d" opacity={beard ? 0 : 0.17} />
      <path d="M40.6 38.5c-2 4.5-.4 5.6.2 5.8 1 .3 2-.2 2.4-.9" stroke="#000" strokeOpacity=".3" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <g className="lp-blink" style={{ animationDelay: delai }}>
        <ellipse cx="34.5" cy="36.6" rx="3.1" ry="2.5" fill="#fff" />
        <ellipse cx="45.5" cy="36.6" rx="3.1" ry="2.5" fill="#fff" />
        <circle cx="34.8" cy="36.7" r="1.75" fill="#2a1d15" />
        <circle cx="45.2" cy="36.7" r="1.75" fill="#2a1d15" />
        <circle cx="35.4" cy="36" r=".55" fill="#fff" />
        <circle cx="45.8" cy="36" r=".55" fill="#fff" />
      </g>
      <path d="M30.2 31.8q4.3-3 8.4-.6M41.4 31.2q4.1-2.4 8.4.6" stroke={hijab ? skin : hair} strokeOpacity={hijab ? 0.55 : 1} strokeWidth="1.9" fill="none" strokeLinecap="round" />
      <path d="M35.2 46.6q4.8 4.4 9.6 0" stroke={beard ? '#f3c9b8' : '#8a3b3b'} strokeWidth="1.7" fill="none" strokeLinecap="round" />

      {/* cheveux devant */}
      {style === 'short' && <path d="M25.6 36.5c-1.6-14.5 5.2-22.5 14.4-22.5s16 8 14.4 22.5c-1.3-4.7-3.2-8.6-6-10.8-5 2.5-12.8 2.5-17.4 0-2.8 2.2-4.6 6.1-5.4 10.8z" fill={hair} />}
      {style === 'long' && <path d="M25.6 37c-1.6-15 5.2-23 14.4-23s16 8 14.4 23c-3-4.5-6.2-9.5-9.2-12.5-6.2 4.5-14 6.5-19.6 12.5z" fill={hair} />}
      {style === 'cap' && (
        <>
          <path d="M24.8 32c0-11.5 6.2-18 15.2-18s15.2 6.5 15.2 18z" fill={hair} />
          <path d="M23 31.5h34c3 0 4.5 1.5 4.5 3.5H21.5c0-2 .8-3.5 1.5-3.5z" fill={hair} />
          <path d="M28 20c3-3 7-4 11-4" stroke="#fff" strokeOpacity=".22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {glasses && (
        <g fill="#fff" fillOpacity=".18" stroke="#1b1b2f" strokeWidth="1.5">
          <rect x="28.5" y="32.6" width="12" height="8.5" rx="3.5" />
          <rect x="39.5" y="32.6" width="12" height="8.5" rx="3.5" />
          <path d="M40.5 36.2h-1M28.5 35.5l-2.5-1M51.5 35.5l2.5-1" fill="none" />
        </g>
      )}
    </svg>
  );
}
