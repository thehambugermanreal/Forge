import { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { GamesPage } from './components/GamesPage';
import { SettingsPage } from './components/SettingsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'games':
        return <GamesPage games={[]} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </SettingsProvider>
  );
}

export default App;
