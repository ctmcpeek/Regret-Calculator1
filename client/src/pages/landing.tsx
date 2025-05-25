import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, Users, Globe } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-matrix-bg text-matrix-green font-terminal">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-matrix-bg via-matrix-dark to-matrix-bg"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <h1 className="font-impact text-6xl md:text-8xl mb-6 terminal-glow animate-pulse">
            REGRET CALCULATOR
          </h1>
          <p className="text-xl md:text-2xl text-green-400 mb-8">
            Community Edition - Calculate, Compete, and Share Your Financial Regrets!
          </p>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users calculating their biggest financial mistakes. 
            Upload memes, vote on community content, and compete in daily contests!
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-matrix-green text-black hover:bg-green-400 text-xl px-8 py-4 terminal-glow"
          >
            Enter the Matrix
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-matrix-dark border-matrix-green border-2 terminal-glow">
            <CardHeader className="text-center">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-matrix-green" />
              <CardTitle className="text-matrix-green">Smart Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-400">
                Calculate rent vs own costs for yachts, jets, marriages, and more with advanced modifiers
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-matrix-dark border-matrix-green border-2 terminal-glow">
            <CardHeader className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-matrix-green" />
              <CardTitle className="text-matrix-green">Crypto Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-400">
                Real-time Bitcoin, Ethereum, and Solana prices with 20+ currency support
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-matrix-dark border-matrix-green border-2 terminal-glow">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-matrix-green" />
              <CardTitle className="text-matrix-green">Meme Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-400">
                Upload financial regret memes, vote on community content, and win daily contests
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-matrix-dark border-matrix-green border-2 terminal-glow">
            <CardHeader className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-matrix-green" />
              <CardTitle className="text-matrix-green">Global Community</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-400">
                Available in 20 languages with users from 195+ countries worldwide
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-matrix-green p-6 text-center">
        <p className="text-green-400 mb-2">© 2025 Regret Calculator Community | Version 3.0</p>
        <p className="text-sm">If it flies, fucks, or floats - calculate before you commit!</p>
      </footer>

      <style jsx>{`
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
