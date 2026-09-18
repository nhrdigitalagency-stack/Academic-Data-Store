/**
 * Color utility for generating CSS variables and shades dynamically
 */

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

// Map of default color palettes based on primaryColor choice
export const DEFAULT_PALETTES = {
  blue: {
    primary: '#3b82f6',
    secondary: '#1e293b',
    accent: '#f59e0b',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#0f172a',
    accent: '#8b5cf6',
  },
  indigo: {
    primary: '#6366f1',
    secondary: '#1e1b4b',
    accent: '#f43f5e',
  },
  rose: {
    primary: '#f43f5e',
    secondary: '#4c0519',
    accent: '#fbbf24',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#451a03',
    accent: '#3b82f6',
  },
  violet: {
    primary: '#8b5cf6',
    secondary: '#2e1065',
    accent: '#10b981',
  }
};

function hexToRgb(hex: string) {
  const cleanHex = hex.replace(/^#/, '');
  const num = parseInt(cleanHex, 16);
  let r, g, b;
  if (cleanHex.length === 3) {
    r = ((num >> 8) & 0xf) * 17;
    g = ((num >> 4) & 0xf) * 17;
    b = (num & 0xf) * 17;
  } else {
    r = (num >> 16) & 0xff;
    g = (num >> 8) & 0xff;
    b = num & 0xff;
  }
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
    const s = x.toString(16);
    return s.length === 1 ? '0' + s : s;
  }).join('');
}

function blend(rgb: { r: number; g: number; b: number }, target: { r: number; g: number; b: number }, weight: number) {
  return {
    r: target.r + (rgb.r - target.r) * weight,
    g: target.g + (rgb.g - target.g) * weight,
    b: target.b + (rgb.b - target.b) * weight
  };
}

export function generateShades(baseHex: string): ColorShades {
  const rgb = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: rgbToHex(blend(rgb, white, 0.05).r, blend(rgb, white, 0.05).g, blend(rgb, white, 0.05).b),
    100: rgbToHex(blend(rgb, white, 0.15).r, blend(rgb, white, 0.15).g, blend(rgb, white, 0.15).b),
    200: rgbToHex(blend(rgb, white, 0.3).r, blend(rgb, white, 0.3).g, blend(rgb, white, 0.3).b),
    300: rgbToHex(blend(rgb, white, 0.5).r, blend(rgb, white, 0.5).g, blend(rgb, white, 0.5).b),
    400: rgbToHex(blend(rgb, white, 0.7).r, blend(rgb, white, 0.7).g, blend(rgb, white, 0.7).b),
    500: baseHex,
    600: rgbToHex(blend(rgb, black, 0.85).r, blend(rgb, black, 0.85).g, blend(rgb, black, 0.85).b),
    700: rgbToHex(blend(rgb, black, 0.7).r, blend(rgb, black, 0.7).g, blend(rgb, black, 0.7).b),
    800: rgbToHex(blend(rgb, black, 0.55).r, blend(rgb, black, 0.55).g, blend(rgb, black, 0.55).b),
    900: rgbToHex(blend(rgb, black, 0.4).r, blend(rgb, black, 0.4).g, blend(rgb, black, 0.4).b),
    950: rgbToHex(blend(rgb, black, 0.25).r, blend(rgb, black, 0.25).g, blend(rgb, black, 0.25).b),
  };
}

export interface PredefinedPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  preset: 'blue' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet';
  description: string;
}

export const PREDEFINED_PALETTES: PredefinedPalette[] = [
  {
    name: 'Corporate Blue',
    primary: '#2563eb',
    secondary: '#1e3a8a',
    accent: '#f59e0b',
    preset: 'blue',
    description: 'Un bleu d\'entreprise digne, moderne et hautement professionnel.'
  },
  {
    name: 'Academic Burgundy',
    primary: '#881337',
    secondary: '#310d1c',
    accent: '#d97706',
    preset: 'rose',
    description: 'Un rouge bordeaux classique, prestigieux et traditionnel pour les grandes académies.'
  },
  {
    name: 'Modern Forest',
    primary: '#065f46',
    secondary: '#022c22',
    accent: '#10b981',
    preset: 'emerald',
    description: 'Un vert forêt rafraîchissant, écologique et axé sur l\'avenir.'
  },
  {
    name: 'Élégance',
    primary: '#4f46e5', // Indigo deep
    secondary: '#0f172a', // Dark slate
    accent: '#be123c', // Deep rose
    preset: 'indigo',
    description: 'Ton académique raffiné, idéal pour les collèges bilingues.'
  },
  {
    name: 'Dynamique',
    primary: '#e11d48', // Vibrant rose/red
    secondary: '#1e1b4b', // Very dark indigo
    accent: '#10b981', // Energetic emerald
    preset: 'rose',
    description: 'Énergie créative, parfait pour les établissements de sport et d\'art.'
  },
  {
    name: 'Minimaliste',
    primary: '#334155', // Slate dark
    secondary: '#f8fafc', // Extra light slate
    accent: '#06b6d4', // Modern cyan
    preset: 'blue',
    description: 'Design épuré et moderne pour les instituts techniques.'
  },
  {
    name: 'Classique',
    primary: '#1d4ed8', // Royal blue
    secondary: '#1e293b', // Slate
    accent: '#f59e0b', // Gold amber
    preset: 'blue',
    description: 'Combinaison traditionnelle et rassurante du système éducatif.'
  },
  {
    name: 'Académie Violette',
    primary: '#8b5cf6', // Violet
    secondary: '#111827', // Obsidian dark
    accent: '#fb7185', // Soft rose
    preset: 'violet',
    description: 'Moderne et prestigieux pour l\'excellence académique.'
  }
];

