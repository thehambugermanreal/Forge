import { X, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DiscordPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenDiscordPopup');
    if (!hasSeenPopup) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenDiscordPopup', 'true');
    setIsVisible(false);
  };

  const handleJoinDiscord = () => {
    localStorage.setItem('hasSeenDiscordPopup', 'true');
    window.open('https://discord.gg/cAg6atkxms', '_blank');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#6b6b7a] hover:text-[#f0f0f5] hover:bg-[#1f1f2e] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center mb-6 animate-float">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-[#f0f0f5] mb-3">
            Join our Discord server!
          </h2>

          <p className="text-[#a0a0b0] mb-8">
            Connect with our community, get updates, and chat with fellow gamers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleJoinDiscord}
              className="flex-1 px-6 py-3 rounded-xl bg-[#5865F2] text-white font-semibold transition-all duration-300 hover:bg-[#4752C4] hover:scale-105"
            >
              Join Discord
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl bg-[#1a1a26] border border-[#2a2a3a] text-[#a0a0b0] font-semibold transition-all duration-300 hover:bg-[#1f1f2e] hover:text-[#f0f0f5]"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
