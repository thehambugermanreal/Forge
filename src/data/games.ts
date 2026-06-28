export interface Game {
  id: number | string;
  name: string;
  author?: string;
  authorLink?: string;
  coverUrl: string;
  gameUrl: string;
  featured?: boolean;
}

let cachedGames: Game[] | null = null;

export async function fetchGames(): Promise<Game[]> {
  if (cachedGames) return cachedGames;

  try {
    const response = await fetch('./games.json');
    const data = await response.json();

    cachedGames = data.map((game: any) => ({
      id: game.id,
      name: game.name,
      author: game.author,
      authorLink: game.authorLink,
      coverUrl: game.coverUrl || game.cover,
      gameUrl: game.gameUrl || game.url,
      featured: game.featured
    }));

    return cachedGames;
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return [];
  }
}

export const games: Game[] = [];
