import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CryptoTicker() {
  const { data: exchangeRates } = useQuery({
    queryKey: ['/api/exchange-rates'],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const formatPrice = (rate: number, currency: string) => {
    if (currency === 'BTC' || currency === 'ETH' || currency === 'SOL') {
      return rate.toFixed(6);
    }
    return rate.toFixed(2);
  };

  const getRandomChange = () => {
    // Mock price changes for demo
    return (Math.random() - 0.5) * 10;
  };

  if (!exchangeRates) return null;

  // Filter to show major currencies and crypto
  const tickerData = exchangeRates
    .filter((rate: any) => ['BTC', 'ETH', 'SOL', 'USD', 'EUR', 'JPY'].includes(rate.currency))
    .map((rate: any) => ({
      ...rate,
      change: getRandomChange()
    }));

  return (
    <div className="crypto-ticker border-b-2 border-matrix-green overflow-hidden py-2 bg-gradient-to-r from-matrix-bg via-matrix-dark to-matrix-bg">
      <div className="flex animate-ticker whitespace-nowrap">
        {tickerData.map((rate: any) => {
          const isPositive = rate.change >= 0;
          const isCrypto = ['BTC', 'ETH', 'SOL'].includes(rate.currency);
          
          return (
            <span 
              key={rate.currency} 
              className={`mx-8 flex items-center gap-2 ${
                isCrypto 
                  ? rate.currency === 'BTC' 
                    ? 'text-bitcoin' 
                    : rate.currency === 'ETH' 
                      ? 'text-ethereum' 
                      : 'text-solana'
                  : 'text-matrix-green'
              }`}
            >
              {isCrypto && (
                <>
                  {rate.currency === 'BTC' && <i className="fab fa-bitcoin"></i>}
                  {rate.currency === 'ETH' && <i className="fab fa-ethereum"></i>}
                  {rate.currency === 'SOL' && <span>◎</span>}
                </>
              )}
              {!isCrypto && rate.currency === 'USD' && <i className="fas fa-dollar-sign"></i>}
              {!isCrypto && rate.currency === 'EUR' && <span>€</span>}
              {!isCrypto && rate.currency === 'JPY' && <span>¥</span>}
              
              <span className="font-bold">
                {rate.currency}: {rate.symbol}{formatPrice(rate.rate, rate.currency)}
              </span>
              
              <span className={`flex items-center gap-1 ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}{rate.change.toFixed(1)}%
              </span>
            </span>
          );
        })}
        
        {/* Duplicate for seamless loop */}
        {tickerData.map((rate: any) => {
          const isPositive = rate.change >= 0;
          const isCrypto = ['BTC', 'ETH', 'SOL'].includes(rate.currency);
          
          return (
            <span 
              key={`${rate.currency}-2`} 
              className={`mx-8 flex items-center gap-2 ${
                isCrypto 
                  ? rate.currency === 'BTC' 
                    ? 'text-bitcoin' 
                    : rate.currency === 'ETH' 
                      ? 'text-ethereum' 
                      : 'text-solana'
                  : 'text-matrix-green'
              }`}
            >
              {isCrypto && (
                <>
                  {rate.currency === 'BTC' && <i className="fab fa-bitcoin"></i>}
                  {rate.currency === 'ETH' && <i className="fab fa-ethereum"></i>}
                  {rate.currency === 'SOL' && <span>◎</span>}
                </>
              )}
              {!isCrypto && rate.currency === 'USD' && <i className="fas fa-dollar-sign"></i>}
              {!isCrypto && rate.currency === 'EUR' && <span>€</span>}
              {!isCrypto && rate.currency === 'JPY' && <span>¥</span>}
              
              <span className="font-bold">
                {rate.currency}: {rate.symbol}{formatPrice(rate.rate, rate.currency)}
              </span>
              
              <span className={`flex items-center gap-1 ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}{rate.change.toFixed(1)}%
              </span>
            </span>
          );
        })}
      </div>

      <style jsx>{`
        .crypto-ticker {
          background: linear-gradient(90deg, #000 0%, #111 50%, #000 100%);
        }
        
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        
        .text-bitcoin {
          color: #F7931A;
        }
        
        .text-ethereum {
          color: #627EEA;
        }
        
        .text-solana {
          color: #9945FF;
        }
      `}</style>
    </div>
  );
}
