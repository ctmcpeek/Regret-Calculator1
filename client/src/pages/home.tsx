import { useAuth } from "@/hooks/useAuth";
import RegretCalculator from "@/components/regret-calculator-fixed";
import MemeCommunity from "@/components/meme-community";
import CryptoTicker from "@/components/crypto-ticker";
import AdminPanel from "@/components/admin-panel";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-matrix-bg text-matrix-green font-terminal">
      <CryptoTicker />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="font-impact text-3xl sm:text-6xl md:text-8xl terminal-glow mb-2 sm:mb-4 animate-pulse">
            REGRET CALCULATOR
          </h1>
          <p className="text-xl text-green-400 mb-4">
            Community Edition - Now with Memes & Crypto!
          </p>
          
          <div className="flex justify-center items-center gap-4 mb-6">
            {user && (
              <div className="text-green-400">
                Welcome, {user.firstName || user.email || 'User'}!
              </div>
            )}
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-black"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Simple Calculator Layout */}
        <div className="max-w-2xl mx-auto">
          <RegretCalculator />
        </div>

        {/* Meme Community Section - Below Calculator */}
        <div className="mt-16 max-w-4xl mx-auto">
          <MemeCommunity />
        </div>
      </div>
      
      {/* Admin Panel */}
      <AdminPanel />

      {/* Footer */}
      <footer className="mt-12 border-t-2 border-matrix-green p-6 text-center">
        <p className="text-green-400 mb-2">© 2025 Regret Calculator Community | Version 3.0</p>
        <p className="text-sm">If it flies, fucks, or floats - calculate before you commit!</p>
      </footer>

      <style>{`
        .terminal-glow {
          text-shadow: 0 0 10px #0f0;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        }
        
        .font-impact {
          font-family: 'Impact', 'Arial Black', sans-serif;
        }
        
        .font-terminal {
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}
