import { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, ExternalLink, Gamepad2, ArrowLeft, X, Play, Loader2 } from 'lucide-react';
import { fetchGames, Game } from '../data/games';

interface GamesPageProps {
  games: Game[];
}

export function GamesPage({ games: initialGames }: GamesPageProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gamesPerRow] = useState(5);
  const [showGameNames] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'id'>('id');

  useEffect(() => {
    async function loadGames() {
      try {
        const fetchedGames = await fetchGames();
        setGames(fetchedGames);
        setError(null);
      } catch (err) {
        setError('Failed to load games. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, []);

  const sortedGames = useMemo(() => {
    const sorted = [...games];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => {
        if (typeof a.id === 'number' && typeof b.id === 'number') {
          return a.id - b.id;
        }
        return String(a.id).localeCompare(String(b.id));
      });
    }
    return sorted;
  }, [games, sortBy]);

  const filteredGames = useMemo(() => {
    return sortedGames.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedGames, searchQuery]);

  const getGridCols = () => {
    switch (gamesPerRow) {
      case 3: return 'grid-cols-2 sm:grid-cols-3';
      case 4: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
      case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 6: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
  };

  const playGame = async (game: Game) => {
    setSelectedGame(game);
  };

  const closeGame = () => {
    setSelectedGame(null);
  };

  if (selectedGame) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a] bg-[#12121a]">
          <div className="flex items-center gap-3">
            <button
              onClick={closeGame}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a26] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5] hover:bg-[#1f1f2e] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>
            <span className="text-lg font-semibold text-[#f0f0f5]">{selectedGame.name}</span>
            {selectedGame.author && (
              <span className="text-sm text-[#6b6b7a]">by {selectedGame.author}</span>
            )}
          </div>
          <a
            href={selectedGame.gameUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-medium hover:bg-[#60a5fa] transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
        </div>
        <iframe
          src={selectedGame.gameUrl}
          className="flex-1 w-full border-0"
          title={selectedGame.name}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f0f5]">
              gn-math <span className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">Games</span>
            </h1>
          </div>
          <p className="text-[#a0a0b0] ml-13">
            {loading ? 'Loading games...' : `${filteredGames.length} games available`}
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b7a]" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#16161f] border border-[#2a2a3a] text-[#f0f0f5] placeholder-[#6b6b7a] focus:outline-none focus:border-[#3b82f6] transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b7a] hover:text-[#f0f0f5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'id')}
            className="px-4 py-3 rounded-xl bg-[#16161f] border border-[#2a2a3a] text-[#f0f0f5] focus:outline-none focus:border-[#3b82f6] transition-all duration-300"
          >
            <option value="id">Sort by ID</option>
            <option value="name">Sort by Name</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#16161f] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5]'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#16161f] border border-[#2a2a3a] text-[#a0a0b0] hover:text-[#f0f0f5]'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#3b82f6] animate-spin mb-4" />
            <p className="text-[#a0a0b0]">Loading games from gn-math...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 mx-auto text-[#ef4444] mb-4" />
            <h3 className="text-xl font-semibold text-[#f0f0f5] mb-2">Failed to load games</h3>
            <p className="text-[#a0a0b0] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-[#3b82f6] text-white font-medium hover:bg-[#60a5fa] transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Games Grid/List */}
        {!loading && !error && viewMode === 'grid' ? (
          <div className={`grid ${getGridCols()} gap-4 sm:gap-6`}>
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => playGame(game)}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#2a2a3a] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#3b82f6] bg-[#16161f]"
              >
                <img
                  src={game.coverUrl}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/0.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  {showGameNames && (
                    <h3 className="text-sm sm:text-base font-semibold text-[#f0f0f5] truncate">
                      {game.name}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play className="w-3 h-3" />
                    <span>Click to Play</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : !loading && !error && (
          <div className="space-y-3">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => playGame(game)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#16161f] border border-[#2a2a3a] transition-all duration-300 hover:bg-[#1f1f2e] hover:border-[#3b82f6] text-left"
              >
                <img
                  src={game.coverUrl}
                  alt={game.name}
                  className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/gn-math/covers@main/0.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#f0f0f5] truncate">{game.name}</h3>
                  <p className="text-sm text-[#6b6b7a] mt-1">
                    {game.author && `by ${game.author}`} • ID: {game.id}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-medium flex-shrink-0">
                  <Play className="w-4 h-4" />
                  <span>Play</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 mx-auto text-[#6b6b7a] mb-4" />
            <h3 className="text-xl font-semibold text-[#f0f0f5] mb-2">No games found</h3>
            <p className="text-[#a0a0b0]">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
