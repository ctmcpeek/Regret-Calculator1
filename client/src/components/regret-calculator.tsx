import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2, Coins, Heart, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AssetData {
  rent: number;
  rentDuration: string;
  own: number;
  ownUpkeep: number;
  ownDuration: string;
  marry?: number;
  marryDuration?: string;
  divorceMarry?: number;
}

const assetData: { [key: string]: AssetData } = {
  yacht: {
    rent: 8000,
    rentDuration: "1:0:0",
    own: 1500000,
    ownUpkeep: 180000,
    ownDuration: "365:0:0"
  },
  jet: {
    rent: 12000,
    rentDuration: "1:0:0",
    own: 4500000,
    ownUpkeep: 450000,
    ownDuration: "365:0:0"
  },
  lambo: {
    rent: 800,
    rentDuration: "1:0:0",
    own: 350000,
    ownUpkeep: 35000,
    ownDuration: "365:0:0"
  },
  mansion: {
    rent: 15000,
    rentDuration: "30:0:0",
    own: 8500000,
    ownUpkeep: 150000,
    ownDuration: "365:0:0"
  },
  marriage: {
    rent: 300,
    rentDuration: "1:0:0",
    marry: 75000,
    marryDuration: "365:0:0",
    divorceMarry: 400000,
    own: 0,
    ownUpkeep: 0,
    ownDuration: "365:0:0"
  }
};

const exchangeRates = {
  USD: { rate: 1, symbol: '$' },
  EUR: { rate: 0.85, symbol: '€' },
  GBP: { rate: 0.73, symbol: '£' },
  JPY: { rate: 110, symbol: '¥' },
  BTC: { rate: 0.000025, symbol: '₿' },
  ETH: { rate: 0.0004, symbol: 'Ξ' },
  SOL: { rate: 0.008, symbol: '◎' }
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  const rate = exchangeRates[currency as keyof typeof exchangeRates] || exchangeRates.USD;
  const convertedAmount = amount * rate.rate;
  
  if (currency === 'BTC' || currency === 'ETH' || currency === 'SOL') {
    return `${rate.symbol}${convertedAmount.toFixed(6)}`;
  }
  
  return `${rate.symbol}${Math.round(convertedAmount).toLocaleString()}`;
};

export default function RegretCalculator() {
  const { toast } = useToast();
  
  // State variables
  const [selectedAsset, setSelectedAsset] = useState("yacht");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [result, setResult] = useState<any>(null);
  
  // Custom pricing
  const [rentPrice, setRentPrice] = useState(0);
  const [rentDuration, setRentDuration] = useState("");
  const [ownPrice, setOwnPrice] = useState(0);
  const [ownUpkeep, setOwnUpkeep] = useState(0);
  const [ownDuration, setOwnDuration] = useState("");
  const [marryPrice, setMarryPrice] = useState(0);
  const [marryDuration, setMarryDuration] = useState("");
  
  // UI state
  const [showMarriageModifiers, setShowMarriageModifiers] = useState(false);
  const [showCustomAsset, setShowCustomAsset] = useState(false);
  const [customAssetName, setCustomAssetName] = useState("");
  const [customAssetEmoji, setCustomAssetEmoji] = useState("");
  
  // Marriage modifiers
  const [simpTax, setSimpTax] = useState(false);
  const [divorceMode, setDivorceMode] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childSupport, setChildSupport] = useState(0);
  const [childSupportYears, setChildSupportYears] = useState(18);

  // Initialize asset data when selection changes
  useEffect(() => {
    if (selectedAsset && assetData[selectedAsset]) {
      const asset = assetData[selectedAsset];
      setShowMarriageModifiers(selectedAsset === 'marriage');
      
      // Convert prices to selected currency
      const rate = exchangeRates[selectedCurrency as keyof typeof exchangeRates]?.rate || 1;
      
      if (selectedAsset === 'marriage') {
        setRentPrice(Math.round(asset.rent * rate));
        setRentDuration(asset.rentDuration);
        setMarryPrice(Math.round((divorceMode ? (asset.divorceMarry || 0) : (asset.marry || 0)) * rate));
        setMarryDuration(asset.marryDuration || "");
      } else {
        setRentPrice(Math.round(asset.rent * rate));
        setRentDuration(asset.rentDuration);
        setOwnPrice(Math.round(asset.own * rate));
        setOwnUpkeep(Math.round(asset.ownUpkeep * rate));
        setOwnDuration(asset.ownDuration);
      }
    }
  }, [selectedAsset, divorceMode, selectedCurrency]);

  // Calculate results
  const calculateRegret = () => {
    // Parse durations
    const parseDuration = (duration: string) => {
      const [days, hours, minutes] = duration.split(':').map(Number);
      return days + (hours / 24) + (minutes / 1440);
    };
    
    const rentDays = parseDuration(rentDuration);
    const ownDays = selectedAsset === 'marriage' ? parseDuration(marryDuration) : parseDuration(ownDuration);
    
    // Calculate costs
    let rentCost = rentPrice * (365 / rentDays);
    let ownCost = selectedAsset === 'marriage' ? marryPrice : (ownPrice + ownUpkeep);
    
    // Marriage modifiers
    if (selectedAsset === 'marriage') {
      if (simpTax) {
        ownCost += ownCost * 0.3; // 30% simp tax
      }
      
      if (divorceMode) {
        ownCost = marryPrice; // Use divorce cost
      }
    }
    
    const savings = Math.abs(rentCost - ownCost);
    const rentBetter = rentCost < ownCost;
    const worst = rentBetter ? 'own' : 'rent';
    
    // Generate roast
    const roasts = {
      yacht: [
        "Your yacht will spend more time in the marina than the ocean, collecting barnacles and your tears.",
        "Congratulations! You've just bought the world's most expensive way to get seasick.",
        "That yacht will depreciate faster than your relationship with money."
      ],
      jet: [
        "Your private jet will mostly fly you to bankruptcy court.",
        "Enjoy explaining to the IRS why you need a $500K/year flying metal tube.",
        "That jet will be grounded more often than a teenager who stole dad's car."
      ],
      lambo: [
        "Your Lambo will spend more time at the mechanic than on the road.",
        "Congratulations on buying the world's most expensive way to get stuck in traffic.",
        "That supercar will be super expensive to maintain, super impractical, and super regrettable."
      ],
      mansion: [
        "Your mansion will have more empty rooms than a haunted house.",
        "Enjoy heating a house the size of a small country while eating ramen noodles.",
        "That mansion will drain your bank account faster than a broken dam."
      ],
      marriage: divorceMode ? [
        "Divorce is like ripping off a band-aid... if the band-aid cost half your net worth.",
        "Congratulations! You've just paid for the world's most expensive life lesson.",
        "That divorce settlement will hurt more than stepping on LEGO barefoot."
      ] : [
        "Marriage: where 'for richer or poorer' usually ends up being poorer.",
        "Congratulations! You've just signed up for a lifetime subscription to compromise.",
        "That wedding ring comes with a hidden subscription fee called 'joint bank accounts'."
      ]
    };
    
    const assetRoasts = roasts[selectedAsset as keyof typeof roasts] || roasts.yacht;
    const roast = assetRoasts[Math.floor(Math.random() * assetRoasts.length)];
    
    setResult({
      rentCost,
      ownCost,
      savings,
      rentBetter,
      worst,
      roast
    });
  };

  // Export functionality - simplified for mobile compatibility
  const exportResults = () => {
    if (!result) {
      toast({ title: "No results to download", variant: "destructive" });
      return;
    }
    
    try {
      // Create downloadable text content
      const resultText = `🚨 REGRET CALCULATOR RESULTS 🚨

Asset: ${selectedAsset.toUpperCase()}
Currency: ${selectedCurrency}

WORST OPTION: ${result.worst.toUpperCase()}

💰 FINANCIAL BREAKDOWN:
• Rent Cost: ${formatCurrency(result.rentCost, selectedCurrency)}
• ${selectedAsset === 'marriage' ? 'Marriage' : 'Own'} Cost: ${formatCurrency(result.ownCost, selectedCurrency)}
• Potential Savings: ${formatCurrency(result.savings, selectedCurrency)}

📊 ROAST:
${result.roast}

💡 BOTTOM LINE:
IF IT FLIES, FUCKS, OR FLOATS - IT'S CHEAPER TO $RENT!

Generated by Regret Calculator v4.20
$RENT #CheaperToRent #RegretCalculator
`;

      // Create and download the file
      const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `regret-calculator-${selectedAsset}-${Date.now()}.txt`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Results downloaded successfully! 📄" });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Download failed. Please try again.", variant: "destructive" });
    }
  };

  // Share functionality
  const shareResults = (platform?: string) => {
    if (!result) {
      toast({ title: "No results to share", variant: "destructive" });
      return;
    }

    const text = `🚨 REGRET CALCULATOR RESULTS 🚨\n\nAsset: ${selectedAsset.toUpperCase()}\nWorst Option: ${result.worst.toUpperCase()}\nRent Cost: ${formatCurrency(result.rentCost, selectedCurrency)}\n${selectedAsset === 'marriage' ? 'Marriage' : 'Own'} Cost: ${formatCurrency(result.ownCost, selectedCurrency)}\nPotential Savings: ${formatCurrency(result.savings, selectedCurrency)}\n\n${result.roast}\n\nIF IT FLIES, FUCKS, OR FLOATS - IT'S CHEAPER TO $RENT!\n\n$RENT #CheaperToRent #RegretCalculator`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`
    };
    
    if (platform && shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    }
  };

  const resetCalculator = () => {
    setSelectedAsset("yacht");
    setSelectedCurrency("USD");
    setResult(null);
    setRentPrice(assetData.yacht.rent);
    setRentDuration(assetData.yacht.rentDuration);
    setOwnPrice(assetData.yacht.own);
    setOwnUpkeep(assetData.yacht.ownUpkeep);
    setOwnDuration(assetData.yacht.ownDuration);
    setMarryPrice(0);
    setMarryDuration("");
    setSimpTax(false);
    setDivorceMode(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-black border-green-500 border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-green-400 font-mono">
            REGRET CALCULATOR v4.20
          </CardTitle>
          <CardDescription className="text-green-300 text-lg">
            Calculate your financial regrets with brutal honesty
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Asset Selection */}
      <Card className="bg-gray-900 border-green-400">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Choose Your Financial Nightmare
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { id: 'yacht', icon: '🛥️', label: 'Yacht' },
            { id: 'jet', icon: '✈️', label: 'Private Jet' },
            { id: 'lambo', icon: '🏎️', label: 'Lambo' },
            { id: 'mansion', icon: '🏰', label: 'Mansion' },
            { id: 'marriage', icon: '💍', label: 'Marriage' }
          ].map((asset) => (
            <Button
              key={asset.id}
              variant={selectedAsset === asset.id ? "default" : "outline"}
              className={`h-20 flex flex-col gap-2 ${
                selectedAsset === asset.id 
                  ? "bg-green-600 text-black border-green-400" 
                  : "bg-gray-800 text-green-400 border-green-600 hover:bg-gray-700"
              }`}
              onClick={() => {
                setSelectedAsset(asset.id);
                setShowCustomAsset(false);
                if (asset.id === 'marriage') {
                  setShowMarriageModifiers(true);
                } else {
                  setShowMarriageModifiers(false);
                }
              }}
            >
              <span className="text-2xl">{asset.icon}</span>
              <span className="text-sm">{asset.label}</span>
            </Button>
          ))}
          
          {/* Custom Asset Button */}
          <Button
            variant={selectedAsset === 'custom' ? "default" : "outline"}
            className={`h-20 flex flex-col gap-2 ${
              selectedAsset === 'custom' 
                ? "bg-purple-600 text-white border-purple-400" 
                : "bg-gray-800 text-purple-400 border-purple-600 hover:bg-gray-700"
            }`}
            onClick={() => {
              setSelectedAsset('custom');
              setShowCustomAsset(true);
              setShowMarriageModifiers(false);
            }}
          >
            <span className="text-2xl">{customAssetEmoji || '✨'}</span>
            <span className="text-sm">{customAssetName || 'Custom'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Currency Selection */}
      <Card className="bg-gray-900 border-green-400">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="bg-gray-800 border-green-600 text-green-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-green-600">
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
              <SelectItem value="BTC">BTC (₿)</SelectItem>
              <SelectItem value="ETH">ETH (Ξ)</SelectItem>
              <SelectItem value="SOL">SOL (◎)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Custom Asset Creator */}
      {selectedAsset === 'custom' && (
        <Card className="bg-gray-900 border-purple-400">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Create Custom Asset (Temporary)
            </CardTitle>
            <CardDescription className="text-purple-300">
              Create a temporary asset for calculation - won't be saved when you leave
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-purple-300">Asset Name</Label>
              <Input
                value={customAssetName}
                onChange={(e) => setCustomAssetName(e.target.value)}
                placeholder="e.g., Gaming PC, Boat, etc."
                className="bg-gray-800 border-purple-600 text-purple-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-purple-300">Emoji</Label>
              <Input
                value={customAssetEmoji}
                onChange={(e) => setCustomAssetEmoji(e.target.value)}
                placeholder="🎮"
                className="bg-gray-800 border-purple-600 text-purple-400"
                maxLength={2}
              />
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <Button
                onClick={() => {
                  if (customAssetName && customAssetEmoji) {
                    setShowCustomAsset(false);
                    toast({ title: `Custom asset "${customAssetName}" created! 🎉` });
                  } else {
                    toast({ title: "Please enter both name and emoji", variant: "destructive" });
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create Asset
              </Button>
              
              <Button
                onClick={() => setShowCustomAsset(false)}
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marriage Modifiers */}
      {showMarriageModifiers && (
        <Card className="bg-gray-900 border-pink-400">
          <CardHeader>
            <CardTitle className="text-pink-400 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Marriage Modifiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="simpTax" 
                checked={simpTax} 
                onCheckedChange={(checked) => setSimpTax(checked === true)}
                className="border-pink-400"
              />
              <Label htmlFor="simpTax" className="text-pink-300">
                Apply Simp Tax (+30% emotional damage)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="divorceMode" 
                checked={divorceMode} 
                onCheckedChange={(checked) => setDivorceMode(checked === true)}
                className="border-pink-400"
              />
              <Label htmlFor="divorceMode" className="text-pink-300">
                Divorce Mode (calculate separation costs)
              </Label>
            </div>
            
            {/* Child Support Calculator */}
            <div className="space-y-4 pt-4 border-t border-pink-600">
              <Label className="text-pink-300 font-bold">Child Support Calculator</Label>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-pink-200">Number of Children</Label>
                  <span className="text-pink-400 font-bold">{childrenCount}</span>
                </div>
                <Slider
                  value={[childrenCount]}
                  onValueChange={(value) => setChildrenCount(value[0])}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-pink-200">Monthly Child Support</Label>
                  <span className="text-pink-400 font-bold">${childSupport.toLocaleString()}</span>
                </div>
                <Slider
                  value={[childSupport]}
                  onValueChange={(value) => setChildSupport(value[0])}
                  max={5000}
                  min={0}
                  step={50}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-pink-200">Years of Support</Label>
                  <span className="text-pink-400 font-bold">{childSupportYears} years</span>
                </div>
                <Slider
                  value={[childSupportYears]}
                  onValueChange={(value) => setChildSupportYears(value[0])}
                  max={25}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Pricing */}
      <Card className="bg-gray-900 border-green-400">
        <CardHeader>
          <CardTitle className="text-green-400">Marriage Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-green-300">Hooker Price by the Hour</Label>
              <Input
                type="number"
                value={rentPrice}
                onChange={(e) => setRentPrice(Number(e.target.value))}
                className="bg-gray-800 border-green-600 text-green-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-green-300">Rent Duration (days:hours:minutes)</Label>
              <Input
                value={rentDuration}
                onChange={(e) => setRentDuration(e.target.value)}
                placeholder="7:0:0"
                className="bg-gray-800 border-green-600 text-green-400"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {selectedAsset === 'marriage' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-green-300">
                    {divorceMode ? 'Divorce Cost' : 'Marriage Cost'}
                  </Label>
                  <Input
                    type="number"
                    value={marryPrice}
                    onChange={(e) => setMarryPrice(Number(e.target.value))}
                    className="bg-gray-800 border-green-600 text-green-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-green-300">Marriage Duration</Label>
                  <Input
                    value={marryDuration}
                    onChange={(e) => setMarryDuration(e.target.value)}
                    placeholder="365:0:0"
                    className="bg-gray-800 border-green-600 text-green-400"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-green-300">Own Price</Label>
                  <Input
                    type="number"
                    value={ownPrice}
                    onChange={(e) => setOwnPrice(Number(e.target.value))}
                    className="bg-gray-800 border-green-600 text-green-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-green-300">Annual Upkeep</Label>
                  <Input
                    type="number"
                    value={ownUpkeep}
                    onChange={(e) => setOwnUpkeep(Number(e.target.value))}
                    className="bg-gray-800 border-green-600 text-green-400"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={calculateRegret}
          className="bg-green-600 hover:bg-green-700 text-black font-bold px-8 py-3 text-lg"
        >
          Calculate My Regret 💸
        </Button>
        
        <Button 
          onClick={resetCalculator}
          variant="outline"
          className="border-green-600 text-green-400 hover:bg-gray-800"
        >
          Reset
        </Button>
      </div>

      {/* Results */}
      {result && (
        <Card className="bg-red-950 border-red-400 border-2">
          <CardHeader>
            <CardTitle className="text-red-400 text-center text-2xl">
              🚨 REGRET ANALYSIS COMPLETE 🚨
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className="bg-red-600 text-white text-lg px-4 py-2">
                WORST OPTION: {result.worst.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-900 border-green-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-green-400 font-bold">Rent Cost</h3>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(result.rentCost, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-900 border-red-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-red-400 font-bold">
                    {selectedAsset === 'marriage' ? 'Marriage' : 'Own'} Cost
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(result.ownCost, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-900 border-yellow-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-yellow-400 font-bold">Potential Savings</h3>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(result.savings, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-gray-900 border-orange-400">
              <CardContent className="p-4">
                <h3 className="text-orange-400 font-bold text-center mb-3">
                  🔥 ROAST INCOMING 🔥
                </h3>
                <p className="text-green-400 text-center text-lg font-mono">
                  {result.roast}
                </p>
              </CardContent>
            </Card>
            
            <div className="text-center">
              <p className="text-green-400 font-bold text-xl mb-4">
                IF IT FLIES, FUCKS, OR FLOATS - IT'S CHEAPER TO $RENT!
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={exportResults}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
                
                <Button 
                  onClick={() => shareResults('twitter')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on X
                </Button>
                
                <Button 
                  onClick={() => shareResults('facebook')}
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Facebook
                </Button>
                
                <Button 
                  onClick={() => shareResults('telegram')}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Telegram
                </Button>
              </div>
              
              <p className="text-green-400 mt-4 font-bold">
                $RENT #CheaperToRent #RegretCalculator
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}