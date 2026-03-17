/**
 * Renders an avatar as an inline SVG from a config object.
 * ViewBox: 0 0 100 120
 */
export default function AvatarSVG({ config = {}, size = 80, className = '' }) {
  const {
    body = 'round',
    head = 'round',
    primaryColor = '#6366f1',
    secondaryColor = '#a5b4fc',
    accentColor = '#fbbf24',
    accessory = 'none',
  } = config

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <BodyLayer type={body} primary={primaryColor} secondary={secondaryColor} />
      {/* Head */}
      <HeadLayer type={head} primary={primaryColor} accent={accentColor} />
      {/* Accessory (rendered on top of head) */}
      <AccessoryLayer type={accessory} accent={accentColor} primary={primaryColor} />
    </svg>
  )
}

function BodyLayer({ type, primary, secondary }) {
  switch (type) {
    case 'square':
      return (
        <g>
          {/* Torso */}
          <rect x="30" y="60" width="40" height="35" rx="4" fill={secondary} />
          {/* Left arm */}
          <rect x="14" y="60" width="14" height="26" rx="7" fill={primary} />
          {/* Right arm */}
          <rect x="72" y="60" width="14" height="26" rx="7" fill={primary} />
          {/* Left leg */}
          <rect x="33" y="91" width="12" height="18" rx="6" fill={primary} />
          {/* Right leg */}
          <rect x="55" y="91" width="12" height="18" rx="6" fill={primary} />
        </g>
      )
    case 'slim':
      return (
        <g>
          <ellipse cx="50" cy="75" rx="13" ry="20" fill={secondary} />
          <ellipse cx="32" cy="70" rx="5" ry="15" fill={primary} transform="rotate(-8,32,70)" />
          <ellipse cx="68" cy="70" rx="5" ry="15" fill={primary} transform="rotate(8,68,70)" />
          <rect x="40" y="91" width="9" height="18" rx="4" fill={primary} />
          <rect x="51" y="91" width="9" height="18" rx="4" fill={primary} />
        </g>
      )
    case 'wide':
      return (
        <g>
          <ellipse cx="50" cy="75" rx="30" ry="22" fill={secondary} />
          <ellipse cx="16" cy="72" rx="8" ry="16" fill={primary} transform="rotate(-18,16,72)" />
          <ellipse cx="84" cy="72" rx="8" ry="16" fill={primary} transform="rotate(18,84,72)" />
          <rect x="33" y="93" width="13" height="17" rx="6" fill={primary} />
          <rect x="54" y="93" width="13" height="17" rx="6" fill={primary} />
        </g>
      )
    default: // round
      return (
        <g>
          <ellipse cx="50" cy="75" rx="22" ry="20" fill={secondary} />
          <ellipse cx="24" cy="72" rx="7" ry="14" fill={primary} transform="rotate(-14,24,72)" />
          <ellipse cx="76" cy="72" rx="7" ry="14" fill={primary} transform="rotate(14,76,72)" />
          <rect x="36" y="91" width="11" height="17" rx="5" fill={primary} />
          <rect x="53" y="91" width="11" height="17" rx="5" fill={primary} />
        </g>
      )
  }
}

function HeadLayer({ type, primary, accent }) {
  switch (type) {
    case 'square':
      return (
        <g>
          <rect x="27" y="13" width="46" height="44" rx="6" fill={primary} />
          {/* Eyes */}
          <rect x="34" y="25" width="12" height="9" rx="3" fill={accent} opacity="0.9" />
          <rect x="54" y="25" width="12" height="9" rx="3" fill={accent} opacity="0.9" />
          {/* Pupils */}
          <circle cx="40" cy="29" r="3" fill="#1e1b4b" />
          <circle cx="60" cy="29" r="3" fill="#1e1b4b" />
          {/* Mouth */}
          <rect x="36" y="42" width="28" height="6" rx="3" fill={accent} opacity="0.7" />
        </g>
      )
    case 'cat':
      return (
        <g>
          {/* Left ear */}
          <polygon points="28,18 22,4 40,16" fill={primary} />
          <polygon points="30,17 26,7 38,15" fill={accent} opacity="0.6" />
          {/* Right ear */}
          <polygon points="72,18 78,4 60,16" fill={primary} />
          <polygon points="70,17 74,7 62,15" fill={accent} opacity="0.6" />
          {/* Head */}
          <ellipse cx="50" cy="32" rx="23" ry="21" fill={primary} />
          {/* Eyes */}
          <ellipse cx="41" cy="29" rx="4" ry="5" fill={accent} />
          <ellipse cx="59" cy="29" rx="4" ry="5" fill={accent} />
          <ellipse cx="41" cy="29" rx="2" ry="4" fill="#1e1b4b" />
          <ellipse cx="59" cy="29" rx="2" ry="4" fill="#1e1b4b" />
          {/* Nose */}
          <polygon points="50,36 47,40 53,40" fill={accent} />
          {/* Whiskers */}
          <line x1="27" y1="39" x2="46" y2="38" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="27" y1="42" x2="46" y2="41" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="73" y1="39" x2="54" y2="38" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          <line x1="73" y1="42" x2="54" y2="41" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'robot':
      return (
        <g>
          {/* Antenna */}
          <line x1="50" y1="8" x2="50" y2="15" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="7" r="4" fill={accent} />
          {/* Head */}
          <rect x="26" y="15" width="48" height="44" rx="5" fill={primary} />
          {/* Eye screens */}
          <rect x="33" y="24" width="14" height="10" rx="2" fill={accent} opacity="0.9" />
          <rect x="53" y="24" width="14" height="10" rx="2" fill={accent} opacity="0.9" />
          {/* Pupils */}
          <circle cx="40" cy="29" r="3.5" fill="#1e1b4b" />
          <circle cx="60" cy="29" r="3.5" fill="#1e1b4b" />
          {/* Mouth grille */}
          <rect x="34" y="40" width="32" height="11" rx="3" fill={accent} opacity="0.5" />
          <line x1="41" y1="40" x2="41" y2="51" stroke={primary} strokeWidth="1.5" />
          <line x1="50" y1="40" x2="50" y2="51" stroke={primary} strokeWidth="1.5" />
          <line x1="59" y1="40" x2="59" y2="51" stroke={primary} strokeWidth="1.5" />
        </g>
      )
    default: // round
      return (
        <g>
          <ellipse cx="50" cy="32" rx="23" ry="22" fill={primary} />
          {/* Eyes */}
          <circle cx="41" cy="28" r="4.5" fill="white" />
          <circle cx="59" cy="28" r="4.5" fill="white" />
          <circle cx="42" cy="29" r="2.5" fill="#1e1b4b" />
          <circle cx="60" cy="29" r="2.5" fill="#1e1b4b" />
          {/* Shine */}
          <circle cx="43" cy="28" r="1" fill="white" />
          <circle cx="61" cy="28" r="1" fill="white" />
          {/* Smile */}
          <path d="M41 39 Q50 46 59 39" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )
  }
}

function AccessoryLayer({ type, accent, primary }) {
  switch (type) {
    case 'hat':
      return (
        <g>
          {/* Brim */}
          <ellipse cx="50" cy="12" rx="30" ry="6" fill={accent} />
          {/* Cone */}
          <polygon points="50,-18 28,12 72,12" fill={accent} />
          {/* Band */}
          <rect x="28" y="9" width="44" height="5" rx="2" fill={primary} opacity="0.8" />
          {/* Star */}
          <text x="50" y="3" textAnchor="middle" fontSize="9" fill="white" opacity="0.9">✦</text>
        </g>
      )
    case 'glasses':
      return (
        <g>
          {/* Frames */}
          <circle cx="41" cy="29" r="9" fill="none" stroke={accent} strokeWidth="2.5" />
          <circle cx="59" cy="29" r="9" fill="none" stroke={accent} strokeWidth="2.5" />
          {/* Bridge */}
          <line x1="50" y1="29" x2="50" y2="29" stroke={accent} strokeWidth="2.5" />
          <path d="M50 29 Q50 27 50 29" fill="none" stroke={accent} strokeWidth="2" />
          {/* Arms */}
          <line x1="27" y1="28" x2="32" y2="28" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="28" x2="73" y2="28" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M24,14 L24,0 L37,9 L50,-2 L63,9 L76,0 L76,14 Z" fill={accent} />
          <rect x="24" y="12" width="52" height="5" rx="2" fill={accent} opacity="0.8" />
          {/* Gems */}
          <circle cx="50" cy="5" r="3.5" fill="#ef4444" />
          <circle cx="36" cy="10" r="2.5" fill="#3b82f6" />
          <circle cx="64" cy="10" r="2.5" fill="#22c55e" />
        </g>
      )
    default:
      return null
  }
}
