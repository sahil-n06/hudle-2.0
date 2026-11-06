// Small line icons drawn on a 24px grid. They use currentColor, so they take on the text colour.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const SPORT_PATHS = {
  football: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 4 3-1.5 4.5h-5L8 10z" />
      <path d="M12 3v4M21 10.5l-5-.5M18 19l-3.5-4.5M6 19l3.5-4.5M3 10.5l5-.5" />
    </>
  ),
  badminton: (
    <>
      <path d="M7 17 17 7" />
      <path d="M14 4l6 6-3 1-4-4z" />
      <circle cx="6" cy="18" r="2.5" />
    </>
  ),
  tennis: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5c3.5 3.5 3.5 9.5 0 13M18.5 5.5c-3.5 3.5-3.5 9.5 0 13" />
    </>
  ),
  cricket: (
    <>
      <path d="m4 20 3-3M7 17l10-10 2 2-10 10z" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5.6 5.6c3 2.5 3 10.3 0 12.8M18.4 5.6c-3 2.5-3 10.3 0 12.8" />
    </>
  ),
  swimming: (
    <>
      <path d="M2 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M2 14c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0" />
      <circle cx="16" cy="6" r="2" />
      <path d="m6 11 4-4 3 3" />
    </>
  ),
};
const STADIUM = (
  <>
    <ellipse cx="12" cy="12" rx="9" ry="6" />
    <ellipse cx="12" cy="12" rx="4" ry="2.5" />
    <path d="M12 6v12" />
  </>
);

export function SportIcon({ sport = '', className = 'h-5 w-5' }) {
  return (
    <svg {...base} className={className}>
      {SPORT_PATHS[sport.toLowerCase()] || STADIUM}
    </svg>
  );
}

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <path d="M14 7v10" strokeDasharray="2 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  stadium: STADIUM,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};

export function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg {...base} className={className}>
      {ICONS[name]}
    </svg>
  );
}
