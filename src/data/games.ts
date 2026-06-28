export interface Game {
  id: number;
  name: string;
  author: string;
  authorLink?: string;
  coverUrl: string;
  gameUrl: string;
  featured?: boolean;
}

const ZONES_URL = 'https://cdn.jsdelivr.net/npm/gn-math.github.io-main@1.0.1/zones.json';
const COVER_URL = 'https://cdn.jsdelivr.net/gh/gn-math/covers@main';
const HTML_URL = 'https://cdn.jsdelivr.net/npm/gn-math.github.io-main@1.0.4/html-main';

let cachedGames: Game[] | null = null;

export async function fetchGames(): Promise<Game[]> {
  if (cachedGames) return cachedGames;

  try {
    const response = await fetch(ZONES_URL);
    const zones = await response.json();

    cachedGames = zones.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      author: zone.author || 'Unknown',
      authorLink: zone.authorLink,
      coverUrl: zone.cover.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL),
      gameUrl: zone.url.replace('{COVER_URL}', COVER_URL).replace('{HTML_URL}', HTML_URL),
      featured: zone.featured
    }));

    return cachedGames;
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return [];
  }
}

export const games: Game[] = [];
