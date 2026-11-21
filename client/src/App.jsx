import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LiveNotificationToast from './components/LiveNotificationToast';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailsPage from './pages/AuctionDetailsPage';
import AdminDashboard from './pages/AdminDashboard';
import WinnerPage from './pages/WinnerPage';

function MainApp() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'auctions' | 'details' | 'admin' | 'winners'
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSelectAuction = (id) => {
    setSelectedAuctionId(id);
    setActivePage('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAuctions = () => {
    setActivePage('auctions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Page Viewport */}
      <main className="flex-grow">
        {activePage === 'home' && (
          <HomePage
            onSelectAuction={handleSelectAuction}
            onExploreAll={() => setActivePage('auctions')}
            onGoToAdmin={() => setActivePage('admin')}
            onGoToWinners={() => setActivePage('winners')}
          />
        )}

        {activePage === 'auctions' && (
          <AuctionsPage onSelectAuction={handleSelectAuction} />
        )}

        {activePage === 'details' && (
          <AuctionDetailsPage
            auctionId={selectedAuctionId}
            onBack={handleBackToAuctions}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard onSelectAuction={handleSelectAuction} />
        )}

        {activePage === 'winners' && (
          <WinnerPage onSelectAuction={handleSelectAuction} />
        )}
      </main>

      {/* Global Live Toast Alerts */}
      <LiveNotificationToast />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
