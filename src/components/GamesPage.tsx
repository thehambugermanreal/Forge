import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, Grid, List, Maximize, ExternalLink, Gamepad2,
  ArrowLeft, X, Play, Loader2, Star, Heart,
  Zap, Sparkles, Monitor, Gamepad, Compass,
  Grid3X3, SlidersHorizontal
} from 'lucide-react';
import { fetchGames, Game } from '../data/games';


interface GamesPageProps {
  games: Game[];
}

type Category = 'all' | 'featured' | 'ports' | 'flash' | 'emulators' | 'tools';

function getCategory(game: Game): Category[] {
  const cats: Category[] = [];
  if (game.featured) cats.push('featured');
  const special = game.special || [];
  if (special.includes('port')) cats.push('ports');
  if (special.includes('flash')) cats.push('flash');
  if (special.includes('emulator')) cats.push('emulators');
  if (special.includes('tools')) cats.push('tools');
  if (cats.length === 0) cats.push('all');
  return cats;
}

const categoryLabels: Record<Category, { label: string; icon: typeof Star }> = {
  all: { label: 'All Games', icon: Grid3X3 },
  featured: { label: 'Featured', icon: Star },
  ports: { label: 'Ports', icon: Monitor },
  flash: { label: 'Flash', icon: Zap },
  emulators: { label: 'Emulators', icon: Gamepad },
  tools: { label: 'Tools', icon: SlidersHorizontal },
};

export function GamesPage({ games: initialGames }: GamesPageProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [favorites, setFavorites] = useState<Set<number | string>>(new Set());

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('forge-favorites');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch { /* ignore */ }
  }, []);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('forge-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Load games
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

  // Inject game HTML into iframe
  useEffect(() => {
    if (iframeRef.current && gameHtml) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(gameHtml);
        doc.close();
      }
    }
  }, [gameHtml]);

  // Filter games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(g => getCategory(g).includes(activeCategory));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.author && g.author.toLowerCase().includes(q))
      );
    }

    // Sort by featured first, then by name
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [games, activeCategory, searchQuery]);

  // Featured games
  const featuredGames = useMemo(() => {
    return games.filter(g => g.featured).sort((a, b) => a.name.localeCompare(b.name));
  }, [games]);

  const toggleFavorite = useCallback((e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(game.id)) {
        next.delete(game.id);
      } else {
        next.add(game.id);
      }
      return next;
    });
  }, []);

  const playGame = async (game: Game) => {
    setSelectedGame(game);
    setGameLoading(true);
    setGameHtml(null);
    try {
      const response = await fetch(game.gameUrl);
      const html = await response.text();
      setGameHtml(html);
    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      setGameLoading(false);
    }
  };

  const closeGame = () => {
    setSelectedGame(null);
    setGameHtml(null);
  };

  const enterFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const el: any = iframe;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const openInNewTab = () => {
    if (selectedGame && gameHtml) {
      const blob = new Blob([gameHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank');
      if (newWindow) {
        newWindow.addEventListener('unload', () => URL.revokeObjectURL(blobUrl), { once: true });
      }
    }
  };

  // Active game overlay
  if (selectedGame) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0e0e18] flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a40] bg-[#16162a]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={closeGame}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e32] border border-[#2a2a40] text-[#a0a0b8] hover:text-white hover:bg-[#252542] hover:border-[#3b82f6]/40 transition-all duration-300 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>
            <span className="text-base font-semibold text-white truncate">{selectedGame.name}</span>
            {selectedGame.author && (
              <span className="text-xs text-[#6b6b80] hidden md:inline flex-shrink-0">by {selectedGame.author}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] text-[#6b6b80] hidden lg:inline mr-2">
              Not working? Try new tab
            </span>
            <button
              onClick={openInNewTab}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e32] border border-[#2a2a40] text-[#a0a0b8] hover:text-white hover:bg-[#252542] hover:border-[#3b82f6]/40 transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">New Tab</span>
            </button>
            <button
              onClick={enterFullscreen}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3b82f6] text-white font-medium hover:bg-[#4a8ff7] transition-all duration-300"
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {gameLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-[#3b82f6] animate-spin" />
                <div className="absolute inset-0 w-10 h-10 rounded-full bg-[#3b82f6]/10 animate-ping" />
              </div>
              <p className="text-[#a0a0b8] text-sm">Loading game...</p>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src="about:blank"
          className="flex-1 w-full border-0"
          title={selectedGame.name}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-16 bg-[#0e0e18]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/60 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3b82f6]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#60a5fa]/5 rounded-full blur-[80px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Forge <span className="text-[#3b82f6]">Games</span>
                </h1>
              </div>
              <p className="text-[#6b6b80] text-sm sm:text-base ml-14">
                {loading ? 'Loading games...' : `${filteredGames.length} of ${games.length} games`}
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full sm:w-auto sm:min-w-[320px] lg:min-w-[400px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b80]" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#16162a] border border-[#2a2a40] text-white placeholder-[#6b6b80] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20 transition-all duration-300 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b80] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-16 z-40 bg-[#0e0e18]/90 backdrop-blur-xl border-b border-[#2a2a40]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Category Pills */}
            {(Object.keys(categoryLabels) as Category[]).map((cat) => {
              const { label, icon: Icon } = categoryLabels[cat];
              const isActive = activeCategory === cat;
              const count = cat === 'all'
                ? games.length
                : games.filter(g => getCategory(g).includes(cat)).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/15'
                      : 'bg-[#16162a] border border-[#2a2a40] text-[#a0a0b8] hover:text-white hover:border-[#3b82f6]/30 hover:bg-[#1e1e32]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20' : 'bg-[#2a2a40] text-[#6b6b80]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-[#16162a] border border-[#2a2a40] rounded-xl p-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#6b6b80] hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#6b6b80] hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={scrollRef}>
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-4">
              <Loader2 className="w-10 h-10 text-[#3b82f6] animate-spin" />
              <div className="absolute inset-0 w-10 h-10 rounded-full bg-[#3b82f6]/10 animate-ping" />
            </div>
            <p className="text-[#6b6b80] text-sm">Loading games...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-[#ef4444]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Failed to load</h3>
            <p className="text-[#6b6b80] mb-6 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-[#3b82f6] text-white font-medium hover:bg-[#4a8ff7] transition-all text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Featured Section (only on 'all' or 'featured') */}
        {!loading && !error && (activeCategory === 'all' || activeCategory === 'featured') && featuredGames.length > 0 && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#3b82f6]" />
              <h2 className="text-lg font-semibold text-white">Featured</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredGames.map((game) => (
                <button
                  key={`featured-${game.id}`}
                  onClick={() => playGame(game)}
                  className="group relative rounded-2xl overflow-hidden border border-[#2a2a40] bg-[#16162a] transition-all duration-400 hover:border-[#3b82f6]/30 hover:shadow-2xl hover:shadow-blue-500/5 text-left"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={game.coverUrl}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/images/forge.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-[#0e0e18]/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#3b82f6]/90 text-white text-xs font-medium backdrop-blur-sm">
                        Featured
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-base font-semibold text-white mb-0.5">{game.name}</h3>
                      {game.author && (
                        <p className="text-xs text-[#a0a0b8]">by {game.author}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Games Grid */}
        {!loading && !error && viewMode === 'grid' && (
          <>
            {activeCategory === 'all' && !searchQuery && featuredGames.length > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <Compass className="w-4 h-4 text-[#3b82f6]" />
                <h2 className="text-lg font-semibold text-white">All Games</h2>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {filteredGames.map((game, idx) => (
                <button
                  key={game.id}
                  onClick={() => playGame(game)}
                  className="group relative rounded-2xl overflow-hidden border border-[#2a2a40] bg-[#16162a] transition-all duration-400 hover:border-[#3b82f6]/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 text-left"
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  {/* Card Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={game.coverUrl}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/images/forge.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-transparent to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-transparent to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300" />

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(e, game)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-[#0e0e18]/60 backdrop-blur-sm border border-[#2a2a40]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#0e0e18]/80 hover:border-[#3b82f6]/40"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          favorites.has(game.id) ? 'text-[#ef4444] fill-[#ef4444]' : 'text-white/70'
                        }`}
                      />
                    </button>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-[#3b82f6]/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-blue-500/20 scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Category Tags */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {game.special?.map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-[#0e0e18]/60 backdrop-blur-sm text-[10px] font-medium text-[#a0a0b8] border border-[#2a2a40]/40"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-white truncate leading-snug">{game.name}</h3>
                    {game.author && (
                      <p className="text-[11px] text-[#6b6b80] mt-0.5 truncate">{game.author}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* List View */}
        {!loading && !error && viewMode === 'list' && (
          <div className="space-y-3">
            {filteredGames.map((game) => (
              <button
                key={game.id}
                onClick={() => playGame(game)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-[#16162a] border border-[#2a2a40] transition-all duration-300 hover:bg-[#1e1e32] hover:border-[#3b82f6]/30 text-left group"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={game.coverUrl}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/images/forge.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{game.name}</h3>
                  <p className="text-xs text-[#6b6b80] mt-0.5">
                    {game.author && `by ${game.author}`}
                    {game.special && game.special.length > 0 && (
                      <span className="ml-2">{game.special.join(', ')}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => toggleFavorite(e, game)}
                    className="p-2 rounded-xl hover:bg-[#2a2a40] transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.has(game.id) ? 'text-[#ef4444] fill-[#ef4444]' : 'text-[#6b6b80]'
                      }`}
                    />
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#3b82f6] text-white font-medium text-sm group-hover:bg-[#4a8ff7] transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Play</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-[#2a2a40] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#6b6b80]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No games found</h3>
            <p className="text-[#6b6b80] text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
