export const COUNTRIES = [
  {
    id: 'japan', name: 'Japan', emoji: '🇯🇵', native: '日本',
    c1: '#F59E0B', c2: '#FDE68A', c3: '#92400E', bg: '#FFFBF0',
    cities: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Sapporo'],
    translateLang: 'JA',
    weatherSuffix: 'JP',
    vibe: ['Cherry blossoms', 'Ramen & sushi', 'Ancient temples'],
    sparkHeights: [40, 70, 55, 80, 60, 90, 45, 75],
  },
  {
    id: 'thailand', name: 'Thailand', emoji: '🇹🇭', native: 'ไทย',
    c1: '#10B981', c2: '#D1FAE5', c3: '#065F46', bg: '#F0FFF8',
    cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui', 'Ayutthaya'],
    translateLang: 'TH',
    weatherSuffix: 'TH',
    vibe: ['Street food paradise', 'Golden temples', 'Tropical beaches'],
    sparkHeights: [80, 55, 90, 65, 75, 50, 85, 60],
  },
  {
    id: 'italy', name: 'Italy', emoji: '🇮🇹', native: 'Italia',
    c1: '#EF4444', c2: '#FEE2E2', c3: '#7F1D1D', bg: '#FFF5F5',
    cities: ['Rome', 'Florence', 'Venice', 'Milan', 'Amalfi'],
    translateLang: 'IT',
    weatherSuffix: 'IT',
    vibe: ['Pasta & gelato', 'Renaissance art', 'Ancient ruins'],
    sparkHeights: [65, 80, 50, 90, 70, 55, 85, 45],
  },
  {
    id: 'france', name: 'France', emoji: '🇫🇷', native: 'France',
    c1: '#3B82F6', c2: '#DBEAFE', c3: '#1E3A8A', bg: '#F0F8FF',
    cities: ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille'],
    translateLang: 'FR',
    weatherSuffix: 'FR',
    vibe: ['Eiffel Tower', 'Wine & cheese', 'Haute cuisine'],
    sparkHeights: [55, 75, 45, 85, 60, 80, 50, 70],
  },
  {
    id: 'morocco', name: 'Morocco', emoji: '🇲🇦', native: 'المغرب',
    c1: '#F97316', c2: '#FFEDD5', c3: '#7C2D12', bg: '#FFFAF5',
    cities: ['Marrakech', 'Fes', 'Casablanca', 'Chefchaouen', 'Essaouira'],
    translateLang: 'AR',
    weatherSuffix: 'MA',
    vibe: ['Medina souks', 'Sahara desert', 'Tagine & mint tea'],
    sparkHeights: [70, 50, 85, 60, 75, 45, 90, 55],
  },
  {
    id: 'india', name: 'India', emoji: '🇮🇳', native: 'भारत',
    c1: '#8B5CF6', c2: '#EDE9FE', c3: '#4C1D95', bg: '#FAF8FF',
    cities: ['Delhi', 'Mumbai', 'Jaipur', 'Goa', 'Varanasi'],
    translateLang: 'HI',
    weatherSuffix: 'IN',
    vibe: ['Taj Mahal', 'Spice markets', 'Yoga & spirituality'],
    sparkHeights: [60, 85, 45, 75, 55, 90, 50, 80],
  },
];

export const DESTINATIONS = COUNTRIES; // backward compat

export function applyPalette(dest) {
  if (!dest) return;
  const root = document.documentElement;
  root.style.setProperty('--c1', dest.c1);
  root.style.setProperty('--c2', dest.c2);
  root.style.setProperty('--c3', dest.c3);
  root.style.setProperty('--bg', dest.bg);
}
