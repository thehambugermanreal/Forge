import { Palette, Monitor, Sparkles, Layout, RotateCcw, Check, Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function SettingsPage() {
  const { settings, updateSettings, accentColors } = useSettings();

  const resetToDefaults = () => {
    updateSettings({
      accentColor: '#3b82f6',
      accentGlow: 'rgba(59, 130, 246, 0.3)',
      animationsEnabled: true,
      compactMode: false,
      showGameNames: true,
      gamesPerRow: 5,
    });
  };

  return (
    <div className="relative min-h-screen pt-20 noise-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/images/forge.png"
              alt="Forge v0"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              <span className="gradient-text">Settings</span>
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] ml-13">
            Customize your Forge v0 experience
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-fadeIn stagger-1">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h2>
            </div>

            <div className="space-y-6">
              {/* Accent Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)]">Accent Color</label>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Choose your preferred theme accent</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {Object.entries(accentColors).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => updateSettings({ accentColor: value.color, accentGlow: value.glow })}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                        settings.accentColor === value.color
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: value.color }}
                        />
                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{value.name}</span>
                      </div>
                      {settings.accentColor === value.color && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Section */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-fadeIn stagger-2">
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Display</h2>
            </div>

            <div className="space-y-5">
              {/* Animations Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)]">Enable Animations</label>
                    <p className="text-xs text-[var(--text-muted)]">Smooth transitions and animations</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ animationsEnabled: !settings.animationsEnabled })}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    settings.animationsEnabled
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                      settings.animationsEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Compact Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layout className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)]">Compact Mode</label>
                    <p className="text-xs text-[var(--text-muted)]">Reduce padding and spacing</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    settings.compactMode
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                      settings.compactMode ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Game Names Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)]">Show Game Names</label>
                    <p className="text-xs text-[var(--text-muted)]">Display titles under game cards</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ showGameNames: !settings.showGameNames })}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                    settings.showGameNames
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                      settings.showGameNames ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Games Per Row */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Layout className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <label className="text-sm font-medium text-[var(--text-primary)]">Games Per Row</label>
                    <p className="text-xs text-[var(--text-muted)]">Adjust the grid layout density</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateSettings({ gamesPerRow: num })}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        settings.gamesPerRow === num
                          ? 'bg-[var(--accent-primary)] text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-fadeIn stagger-3">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">About</h2>
            </div>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p><span className="text-[var(--text-primary)] font-medium">Forge v0</span> - Your gateway to unlimited access.</p>
              <p>Games sourced from the <span className="text-[var(--accent-primary)]">gn-math</span> library.</p>
              <p className="text-xs text-[var(--text-muted)] mt-4">
                Cover images: github.com/gn-math/covers | HTML games: github.com/gn-math/html
              </p>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end animate-fadeIn stagger-4">
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent-primary)] transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
