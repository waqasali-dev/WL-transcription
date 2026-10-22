import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (p: P) => ({
  width: p.size ?? 16,
  height: p.size ?? 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconWave = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 12h2.5M19.5 12H22M6.5 8.5v7M10 5v14M13.5 7.5v9M17 10v4" />
  </svg>
);
export const IconFilm = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
    <path d="M7 4v16M17 4v16M2.5 9.5h4.5M2.5 14.5h4.5M17 9.5h4.5M17 14.5h4.5" />
  </svg>
);
export const IconPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M7.5 4.8v14.4a.6.6 0 0 0 .92.5l11.2-7.2a.6.6 0 0 0 0-1L8.42 4.3a.6.6 0 0 0-.92.5Z" />
  </svg>
);
export const IconPause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="4.5" width="3.6" height="15" rx="1.1" />
    <rect x="13.9" y="4.5" width="3.6" height="15" rx="1.1" />
  </svg>
);
export const IconSkipBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 5.5v13L8.5 12 19 5.5ZM5 5v14" />
  </svg>
);
export const IconSkipFwd = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 5.5v13L15.5 12 5 5.5ZM19 5v14" />
  </svg>
);
export const IconUpload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 16.5V4m0 0 4.5 4.5M12 4 7.5 8.5M4 16.5v2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v12.5m0 0L16.5 12M12 16.5 7.5 12M4 16.5v2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-2" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4A1.3 1.3 0 0 1 14.5 4.8V7M18.5 7l-.9 12.2a1.5 1.5 0 0 1-1.5 1.3H7.9a1.5 1.5 0 0 1-1.5-1.3L5.5 7M10 11v6M14 11v6" />
  </svg>
);
export const IconKey = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12 20 3m-3 0 3.5 3.5M14.5 5.5 18 9" />
  </svg>
);
export const IconSliders = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h9M17 7h3M4 17h4M12 17h8" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);
export const IconActivity = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12h3.5l2.5-7 4.5 14 2.5-7H21" />
  </svg>
);
export const IconScissors = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8.2 7.5 20 18M8.2 16.5 20 6" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L20 6.5" />
  </svg>
);
export const IconWarn = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.8 19.5h18.4L12 3.5Zm0 5.5v4.5m0 3v.01" />
  </svg>
);
export const IconSun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
);
export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 20.5h7M12 17v3.5" />
  </svg>
);
export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </svg>
);
export const IconRepeat = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 9V8a3 3 0 0 1 3-3h11l-3-3m3 3-3 3M20 15v1a3 3 0 0 1-3 3H6l3 3m-3-3 3-3" />
  </svg>
);
export const IconKeyboard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5" />
  </svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1M20.5 4v5h-5" />
  </svg>
);
export const IconStop = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="1.8" />
  </svg>
);
export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 8.5 4.7L12 12.4 3.5 7.7 12 3ZM3.5 12.2 12 16.9l8.5-4.7M3.5 16.7 12 21.4l8.5-4.7" />
  </svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);
export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 2.5 4.5 13.5H11L9.5 21.5 19.5 10.5H13L13 2.5Z" />
  </svg>
);
export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6.5h13M8 12h13M8 17.5h13M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01" />
  </svg>
);

export const IconVolume = (p: P) => (
  <svg {...base(p)}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const IconVolumeLow = (p: P) => (
  <svg {...base(p)}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const IconVolumeMute = (p: P) => (
  <svg {...base(p)}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

export const IconMaximize = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

export const IconMinimize = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 14h6m0 0v6m0-6-7 7m17-11h-6m0 0V4m0 6 7-7" />
  </svg>
);

export const IconSparkles = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </svg>
);

export const IconFilter = (p: P) => (
  <svg {...base(p)}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export const IconArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

