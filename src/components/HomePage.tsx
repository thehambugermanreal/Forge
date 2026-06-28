import { Gamepad2, Play, Sparkles, Zap, Users, Trophy } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: Play,
      title: 'Instant Play',
      description: 'No downloads required. Launch games instantly in your browser.',
    },
    {
      icon: Sparkles,
      title: 'Curated Collection',
      description: 'Hundreds of hand-picked games from the gn-math library.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for speed with CDN-delivered content.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built with love by the community, for the community.',
    },
  ];

  const stats = [
    { label: 'Games', value: '200+' },
  ];

  return (
    <div className="relative min-h-screen noise-bg">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--accent-primary)] rounded-full blur-[120px] opacity-20 animate-pulse-slow" />
          <div className="absolute top-60 -left-20 w-60 h-60 bg-[var(--accent-secondary)] rounded-full blur-[100px] opacity-15 animate-pulse-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] mb-8">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm text-[var(--text-secondary)]">Welcome to the future of gaming</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="block text-[var(--text-primary)]">Your Gateway to</span>
              <span className="gradient-text">Unlimited Access</span>
            </h1>

            <img
              src="/images/forge.png"
              alt="Forge v0"
              className="w-32 h-32 mx-auto mb-8 rounded-3xl glow-effect animate-float"
            />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('games')}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 glow-effect"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Browse Games
                </span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="px-8 py-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-lg transition-all duration-300 hover:bg-[var(--bg-hover)] hover:border-[var(--accent-primary)]"
              >
                Customize
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 flex justify-center animate-fadeIn stagger-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fadeIn stagger-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Why Choose <span className="gradient-text">Forge</span>?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Experience gaming like never before with our cutting-edge platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] card-hover animate-fadeIn"
                  style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden animate-fadeIn">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-primary)] rounded-full blur-[80px] opacity-30" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Trophy className="w-6 h-6 text-[var(--accent-primary)]" />
                  <span className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wide">
                    Ready to Play?
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Start Your Gaming Adventure
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Jump in now and discover your next favorite game.
                </p>
              </div>
              <button
                onClick={() => onNavigate('games')}
                className="flex-shrink-0 px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-lg transition-all duration-300 hover:bg-[var(--accent-secondary)] hover:scale-105 glow-effect"
              >
                Explore Games
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
