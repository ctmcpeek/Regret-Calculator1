import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Coins, Download, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { getExchangeRate } from "@/lib/exchange-rates";

// Asset data with marriage preset of $300 for hooker price
const assetData: { [key: string]: any } = {
  yacht: {
    rent: 18000,  // 2025 luxury yacht charter rates
    rentDuration: "1:0:0",
    own: 4200000,  // Average 120ft yacht in 2025
    ownUpkeep: 630000,  // 15% of purchase price annually (crew, maintenance, dock fees)
    ownDuration: "7"  // 7 years average ownership
  },
  jet: {
    rent: 35000,  // 2025 private jet charter rates (Citation X+/Gulfstream)
    rentDuration: "1:0:0", 
    own: 12500000,  // Mid-size business jet 2025 pricing
    ownUpkeep: 1875000,  // 15% annually (hangar, maintenance, crew, insurance)
    ownDuration: "10"  // 10 years average ownership
  },
  lambo: {
    rent: 1800,  // 2025 exotic car rental rates
    rentDuration: "1:0:0",
    own: 520000,  // 2025 Lamborghini Huracán/Aventador pricing
    ownUpkeep: 52000,  // 10% annually (insurance, maintenance, depreciation)
    ownDuration: "5"  // 5 years average ownership
  },
  mansion: {
    rent: 4500,  // 2025 luxury estate rental rates per day
    rentDuration: "1:0:0",
    own: 18500000,  // High-end mansion in premium market 2025
    ownUpkeep: 925000,  // 5% annually (property tax, maintenance, staff, utilities)
    ownDuration: "15"  // 15 years average ownership
  },
  marriage: {
    rent: 400,  // 2025 escort rates per hour
    rentDuration: "1:0:0",
    marry: 35000,  // Realistic annual marriage expenses (dates, gifts, vacations, joint costs)
    marryDuration: "365:0:0",
    divorceMarry: 85000,  // 2025 average divorce cost including legal fees
    own: 0,
    ownUpkeep: 0,
    ownDuration: "365:0:0"
  }
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: { [key: string]: string } = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', BTC: '₿', ETH: 'Ξ', SOL: '◎'
  };
  return `${symbols[currency] || '$'}${amount.toLocaleString()}`;
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
  const [childSupportYears, setChildSupportYears] = useState(0);

  // Load asset data when selection changes
  useEffect(() => {
    if (selectedAsset === 'custom') {
      // For custom assets, clear the fields so user can input their own values
      setRentPrice(1000);
      setRentDuration("1:0:0");
      setOwnPrice(50000);
      setOwnUpkeep(5000);
      setOwnDuration("5");
      setShowCustomAsset(true);
    } else if (assetData[selectedAsset]) {
      const data = assetData[selectedAsset];
      setRentPrice(data.rent);
      setRentDuration(data.rentDuration);
      setOwnPrice(data.own);
      setOwnUpkeep(data.ownUpkeep);
      setOwnDuration(data.ownDuration);
      setMarryPrice(data.marry || 0);
      setMarryDuration(data.marryDuration || "");
      setShowCustomAsset(false);
    }
    
    // Handle marriage-specific UI
    setShowMarriageModifiers(selectedAsset === 'marriage');
  }, [selectedAsset]);

  // Auto-calculate when ANY pricing value changes
  useEffect(() => {
    if (rentPrice >= 0 && ownPrice >= 0) {
      calculateRegret();
    }
  }, [rentPrice, rentDuration, ownPrice, ownUpkeep, ownDuration, marryPrice, marryDuration, selectedAsset, selectedCurrency, simpTax, divorceMode, childrenCount, childSupport, childSupportYears]);

  // Calculate results
  const calculateRegret = () => {
    // Parse durations - simplified for accurate calculations
    const parseDuration = (duration: string) => {
      // For simple year format (like "7"), return as days
      if (!duration.includes(':')) {
        return Number(duration) * 365; // Convert years to days for display
      }
      // For complex format (like "1:0:0"), parse as days:hours:minutes
      const [days, hours, minutes] = duration.split(':').map(Number);
      return days + (hours / 24) + (minutes / 1440);
    };
    
    const rentDays = parseDuration(rentDuration);
    const ownDays = selectedAsset === 'marriage' ? parseDuration(marryDuration) : parseDuration(ownDuration);
    
    // Calculate costs - always use exact rental duration input
    let rentCost;
    if (selectedAsset === 'marriage') {
      // For marriage, calculate hooker visits vs marriage cost
      rentCost = rentPrice * rentDays; // hooker price * duration
    } else {
      // For all other assets, always use the exact rental duration specified
      rentCost = rentPrice * rentDays;
    }
    
    // Calculate ownership cost: purchase price + (annual upkeep × years owned)
    let ownCost;
    if (selectedAsset === 'marriage') {
      // Marriage costs scale with years too (wedding cost + annual relationship expenses)
      const marriageYears = parseDuration(marryDuration) / 365; // Convert to years
      ownCost = marryPrice * marriageYears;
    } else {
      // Apply years multiplier to ALL assets (yacht, jet, lambo, mansion, custom)
      const yearsOwned = parseFloat(ownDuration) || 1;
      ownCost = ownPrice + (ownUpkeep * yearsOwned);
    }
    
    // Marriage modifiers
    if (selectedAsset === 'marriage') {
      if (simpTax) {
        ownCost += ownCost * 0.3; // 30% simp tax
      }
      
      if (divorceMode) {
        ownCost = marryPrice; // Use divorce cost
      }
      
      // Add child support
      if (childrenCount > 0) {
        ownCost += childSupport * 12 * childSupportYears;
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
        "That yacht will depreciate faster than your relationship with money.",
        "Nothing says 'financial genius' like a floating money pit that requires a crew to operate.",
        "Your yacht is basically a very expensive way to prove you hate having money.",
        "Welcome to owning a hole in the water that you throw money into every month.",
        "Your yacht will cost more in maintenance than most people's houses are worth.",
        "Congrats on buying the nautical equivalent of setting cash on fire in international waters.",
        "That yacht will sink your bank account faster than the Titanic sank in the Atlantic.",
        "Your floating palace comes with a mortgage that would make Poseidon weep.",
        "Nothing screams 'smart investment' like a depreciating asset that can't drive to work.",
        "Your yacht: proving that some people have more money than maritime sense since forever.",
        "Welcome to yacht ownership: where every day is a new adventure in creative bankruptcy.",
        "Your boat is the marine equivalent of flushing money down a very expensive toilet.",
        "That yacht will teach you the true meaning of 'liquidity crisis' - literally and figuratively."
      ],
      jet: [
        "Your private jet will mostly fly you to bankruptcy court.",
        "Enjoy explaining to the IRS why you need a $500K/year flying metal tube.",
        "Nothing says 'financial responsibility' like a depreciating asset that burns jet fuel.",
        "Your jet will spend more time grounded for maintenance than actually flying anywhere useful.",
        "Congratulations on buying the world's most expensive way to avoid commercial airline food.",
        "That private jet is basically a flying mortgage with wings and delusions of grandeur.",
        "Your jet burns more money per hour than most people make in a month.",
        "Welcome to jet ownership: where every flight costs more than a luxury car.",
        "Your flying money pit comes with pilots who earn more than most doctors.",
        "Nothing screams 'smart investment' like a depreciating asset that needs a runway.",
        "Your jet will teach you that 'private aviation' is just another way to say 'financial devastation'.",
        "That plane will crash your bank account faster than it can reach cruising altitude.",
        "Your private jet: proving that some people confuse having money with having sense.",
        "Welcome to the sky-high world of burning cash at 40,000 feet above sea level.",
        "That jet is the aviation equivalent of setting your wallet on fire while flying first class."
      ],
      lambo: [
        "Your Lambo will spend more time at the mechanic than on the road.",
        "Congratulations on buying a very expensive way to sit in traffic.",
        "That Italian masterpiece will depreciate faster than your dating prospects.",
        "Your Lamborghini is basically a very expensive way to announce you have commitment issues with money.",
        "Welcome to Lambo ownership: where every pothole costs more than most people's car payments.",
        "That supercar will teach you that 'horsepower' and 'financial power' are mutually exclusive concepts.",
        "Your Lambo burns rubber and cash with equal enthusiasm and efficiency.",
        "Nothing says 'practical transportation' like a car that can't fit groceries or your dignity.",
        "Your Italian stallion will gallop straight to the dealership for another $10K repair.",
        "That Lamborghini is the automotive equivalent of dating someone way out of your financial league.",
        "Your supercar proves that some people mistake loud exhausts for good financial sense.",
        "Welcome to exotic car ownership: where every drive costs more than a vacation.",
        "That Lambo will depreciate faster than your enthusiasm for explaining the repair bills.",
        "Your Italian sports car: proving that midlife crises come with very expensive price tags.",
        "That Lamborghini is basically a very fast way to drive yourself into bankruptcy court."
      ],
      mansion: [
        "Your mansion comes with property taxes that could feed a small country.",
        "Enjoy heating 47 rooms you'll never use while crying about utility bills.",
        "Nothing says 'smart investment' like a house that costs more to maintain than most people's salaries.",
        "Your mansion is basically a very expensive way to prove you enjoy throwing money at empty rooms.",
        "Welcome to mansion ownership: where every light bulb replacement requires a small loan.",
        "That house will teach you that square footage and financial sense are inversely proportional.",
        "Your estate comes with more bathrooms than you have friends to invite over.",
        "Nothing screams 'practical living' like a house that needs its own zip code and maintenance crew.",
        "Your mansion proves that some people confuse 'living large' with 'spending stupidly'.",
        "That estate will cost more to clean than most people spend on their entire housing budget.",
        "Your mega-home is the residential equivalent of buying a cruise ship to cross a puddle.",
        "Welcome to luxury real estate: where every room comes with its own mortgage payment.",
        "That mansion will depreciate slower than your bank account, but faster than your enthusiasm for utility bills.",
        "Your estate proves that money can't buy taste, but it can definitely buy regret.",
        "That mansion is basically a very expensive way to play hide-and-seek with your financial stability."
      ],
      marriage: [
        "Marriage: The only contract where you pay more to get out than to get in.",
        "Congratulations! You've just signed up for a lifetime subscription to arguments about money.",
        "Marriage is like a deck of cards - starts with hearts and diamonds, ends with clubs and spades.",
        "Your marriage certificate is basically a very expensive way to split your assets in half.",
        "Welcome to married life: where 'for richer or poorer' usually means poorer.",
        "That wedding ring comes with a lifetime warranty on financial disagreements.",
        "Your marriage proves that love is blind, but divorce lawyers have 20/20 vision.",
        "Nothing says 'till death do us part' like arguing about who spent what on Amazon.",
        "Your spouse is the only investment that appreciates in demands while depreciating your bank account.",
        "Marriage: where 'two can live as cheaply as one' is the biggest lie ever told.",
        "Your wedding was beautiful, but your joint bank account will be terrifying.",
        "Welcome to matrimony: the only pyramid scheme that's socially acceptable.",
        "That marriage license is basically a permit to argue about money for the rest of your life.",
        "Your spouse will love you for richer or poorer, but mostly just complain about the poorer part.",
        "Marriage: proving that some people need a legal contract to share their financial misery."
      ],
      custom: [
        "Your custom luxury purchase proves that money can't buy common sense.",
        "Congratulations on finding a new and creative way to hemorrhage money!",
        "That's a very expensive way to learn the meaning of 'buyer's remorse'.",
        "Nothing says 'financial wisdom' like a depreciating asset with delusions of grandeur.",
        "Your custom splurge is basically a very expensive way to prove money burns in unique ways.",
        "Welcome to bespoke bankruptcy: where even your financial mistakes are personalized.",
        "That luxury item will teach you that 'custom' and 'costly' are synonymous.",
        "Your personalized purchase proves that some people need designer ways to waste money.",
        "Nothing screams 'unique taste' like finding innovative methods to drain your bank account.",
        "Your custom asset is the financial equivalent of commissioning your own economic disaster.",
        "That bespoke beauty will depreciate faster than your enthusiasm for explaining the price tag.",
        "Your tailored splurge proves that money can't buy sense, but it can definitely buy regret.",
        "Welcome to custom luxury: where every detail is perfect except for the financial impact.",
        "That personalized purchase is basically a very expensive way to spell 'financial mistake'.",
        "Your custom creation proves that some people need artisanal ways to achieve buyer's remorse."
      ]
    };
    
    // Generate fun facts
    const facts = {
      yacht: [
        "💰 The average yacht loses 10-15% of its value per year",
        "⛽ A 150ft yacht burns $50,000+ in fuel annually just sitting idle",
        "🔧 Annual maintenance costs typically equal 10% of purchase price",
        "📍 Most yachts are used less than 30 days per year by their owners"
      ],
      jet: [
        "✈️ Private jets depreciate 5-10% in their first year alone",
        "⛽ A mid-size jet costs $3,000-5,000 per flight hour in fuel",
        "🛫 The average private jet flies only 200-400 hours annually",
        "💸 Insurance alone can cost $50,000-200,000 per year"
      ],
      lambo: [
        "🏎️ Lamborghinis lose 20-30% value in the first year",
        "🔧 Annual maintenance averages $5,000-8,000 even with light use",
        "⛽ Most Lambos get 10-15 MPG in real-world driving",
        "📈 Only 1% of Lamborghinis ever appreciate in value"
      ],
      mansion: [
        "🏰 Property taxes on mansions average 1-3% of value annually",
        "🔥 Heating a 10,000+ sq ft home costs $3,000-8,000 per month",
        "🏠 Mansions typically take 2-3x longer to sell than regular homes",
        "💡 Utility bills for mansions average $2,000-5,000 monthly"
      ],
      marriage: [
        "💍 The average wedding costs $35,000 but 50% of marriages end in divorce",
        "⚖️ Divorce proceedings cost an average of $15,000-30,000 per person",
        "👶 Raising a child from birth to 18 costs approximately $280,000",
        "💰 Married couples argue about money more than any other topic"
      ],
      custom: [
        "💸 Luxury items lose 20-50% of value immediately after purchase",
        "📉 Most collectibles never outperform basic stock market returns",
        "🎯 Specialty items have extremely limited resale markets",
        "⏰ The average luxury purchase gets used 80% less than anticipated"
      ]
    };

    // Special divorce and simp roasts for marriage
    const divorceRoasts = [
      "💸 Divorce Court Reality Check: Average divorce costs $15k+ in legal fees. Your ex gets half, lawyers get the rest. Welcome to the most expensive breakup ever!",
      "⚖️ Fun Divorce Fact: 50% of marriages end in divorce, 100% of divorces end in poverty. At least you're statistically normal!",
      "🔥 Divorce Mode Activated: Marriage is like buying a house together, then burning it down and fighting over the ashes. Romantic, right?",
      "💰 Divorce Economics 101: You pay for the wedding, the marriage, AND the divorce. It's like a subscription service that gets more expensive when you cancel!",
      "🎭 Plot Twist: Your 'till death do us part' just became 'till debt do us part.' Hope you enjoyed that honeymoon phase!",
      "📊 Divorce Statistics: Men lose 25% of their wealth, women lose 27%. Lawyers gain 100% of their yacht payments. Coincidence?",
      "💔 Relationship Status Update: From 'It's Complicated' to 'It's Expensive.' Your bank account is now single and ready to mingle... with debt collectors.",
      "🏠 Real Estate Reality: Splitting assets is like cutting a pizza - everyone thinks they deserve the bigger slice, but you both end up hungry.",
      "⏰ Time Investment Report: 7 years average marriage length, 18 months divorce process. That's a worse ROI than cryptocurrency!",
      "🎪 Welcome to Divorce Court: Where love goes to die and bank accounts go to get murdered. Bring tissues and a financial advisor!"
    ];

    const simpRoasts = [
      "👑 Simp Status Confirmed: You're paying premium prices for basic human interaction. OnlyFans has better ROI than this marriage!",
      "💸 Simping Economics: Spending $75k on marriage hoping for daily affection? Bro, that's $205 per day. Hire a therapist instead!",
      "🤡 Simp Math Reality: You're literally paying someone to tolerate your existence. That's not love, that's expensive friendship with extra steps!",
      "💳 Financial Simp Alert: Your credit score is about to tank harder than your self-respect. But hey, at least someone said 'yes' to your proposal!",
      "🎭 Simp Life Chosen: Trading financial freedom for emotional dependency. Your bank account and your dignity both filing for bankruptcy!",
      "📱 Modern Simp Analysis: You could get more attention by donating that $75k to Twitch streamers. At least they'd say your name on stream!",
      "🏆 Championship Simp Move: Spending life savings on someone who might leave anyway. That's not romantic, that's just terrible risk management!",
      "💰 Simp Investment Strategy: Put $75k into marriage hoping for returns. Spoiler alert: The house always wins, and you're not the house!",
      "🎪 Welcome to Simp Circus: Where your money goes to die and your ego gets crushed. Admission fee: Your entire life savings!",
      "📊 Simp Portfolio Review: 100% investment in one person, 0% diversification. Even your financial advisor is crying for you!"
    ];

    // Randomize roasts with special marriage variations
    let roast = "";
    if (selectedAsset === 'marriage') {
      if (divorceMode) {
        roast = divorceRoasts[Math.floor(Math.random() * divorceRoasts.length)];
      } else if (simpTax) {
        roast = simpRoasts[Math.floor(Math.random() * simpRoasts.length)];
      } else {
        const marriageRoasts = roasts.marriage;
        roast = marriageRoasts[Math.floor(Math.random() * marriageRoasts.length)];
      }
    } else {
      const assetRoasts = roasts[selectedAsset as keyof typeof roasts] || roasts.custom;
      roast = assetRoasts[Math.floor(Math.random() * assetRoasts.length)];
    }
    
    const assetFacts = facts[selectedAsset as keyof typeof facts] || facts.custom;
    const fact = assetFacts[Math.floor(Math.random() * assetFacts.length)];
    
    setResult({
      rentCost,
      ownCost,
      savings,
      rentBetter,
      worst,
      roast,
      fact
    });
  };

  // Generate meme image from calculator results
  const generateMeme = () => {
    if (!result) {
      toast({ title: "No results to generate meme", variant: "destructive" });
      return;
    }
    
    try {
      // Create canvas for meme generation
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }
      
      // Matrix-style background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Green border
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Title
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🚨 REGRET CALCULATOR 🚨', canvas.width/2, 60);
      
      // Asset and worst option
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${selectedAsset.toUpperCase()} ANALYSIS`, canvas.width/2, 100);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`WORST OPTION: ${result.worst.toUpperCase()}`, canvas.width/2, 140);
      
      // Cost boxes
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(50, 170, 300, 80);
      ctx.fillStyle = '#ff0000'; 
      ctx.fillRect(450, 170, 300, 80);
      
      // Cost text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RENT COST', 200, 195);
      ctx.fillText(`${selectedAsset === 'marriage' ? 'MARRIAGE' : 'OWN'} COST`, 600, 195);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(formatCurrency(result.rentCost, selectedCurrency), 200, 225);
      ctx.fillText(formatCurrency(result.ownCost, selectedCurrency), 600, 225);
      
      // Savings
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(200, 280, 400, 60);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('POTENTIAL SAVINGS', 400, 305);
      ctx.font = 'bold 24px Arial';
      ctx.fillText(formatCurrency(result.savings, selectedCurrency), 400, 330);
      
      // Bottom text
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('IF IT FLIES, FUCKS, OR FLOATS', canvas.width/2, 400);
      ctx.fillText("IT'S CHEAPER TO $RENT!", canvas.width/2, 430);
      
      // Hashtags
      ctx.font = 'bold 16px Arial';
      ctx.fillText('$RENT #CheaperToRent #RegretCalculator', canvas.width/2, 470);
      
      // Roast text (shortened for meme)
      const shortRoast = result.roast.length > 80 ? result.roast.substring(0, 80) + '...' : result.roast;
      ctx.font = '14px Arial';
      ctx.fillText(shortRoast, canvas.width/2, 520);
      
      // Convert to downloadable image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `regret-meme-${selectedAsset}-${Date.now()}.png`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({ title: "Meme generated and downloaded! 🔥" });
        } else {
          throw new Error('Failed to generate meme');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Meme generation error:', error);
      toast({ title: "Meme generation failed. Please try again.", variant: "destructive" });
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
    setChildrenCount(0);
    setChildSupport(0);
    setChildSupportYears(0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="bg-black border-green-500 border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold text-green-400 font-mono">
            REGRET CALCULATOR v4.20
          </CardTitle>
          <CardDescription className="text-green-300 text-base md:text-lg">
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
        <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { id: 'yacht', icon: '🛥️', label: 'Yacht' },
            { id: 'jet', icon: '✈️', label: 'Private Jet' },
            { id: 'lambo', icon: '🏎️', label: 'Lambo' },
            { id: 'mansion', icon: '🏰', label: 'Mansion' },
            { id: 'marriage', icon: '💍', label: 'Marriage' },
            { id: 'custom', icon: '🎯', label: 'Custom' }
          ].map((asset) => (
            <Button
              key={asset.id}
              variant={selectedAsset === asset.id ? "default" : "outline"}
              className={`h-16 md:h-20 flex flex-col gap-1 md:gap-2 text-xs md:text-sm ${
                selectedAsset === asset.id 
                  ? "bg-green-600 text-black border-green-400" 
                  : "bg-gray-800 text-green-400 border-green-600 hover:bg-gray-700"
              }`}
              onClick={() => {
                setSelectedAsset(asset.id);
                
                // Load realistic preset prices for the selected asset
                if (assetData[asset.id]) {
                  const preset = assetData[asset.id];
                  setRentPrice(preset.rent || 1000);
                  setRentDuration(preset.rentDuration || '7:0:0');
                  setOwnPrice(preset.own || 50000);
                  setOwnUpkeep(preset.ownUpkeep || 5000);
                  setOwnDuration(preset.ownDuration || '5');
                  
                  if (asset.id === 'marriage') {
                    setMarryPrice(preset.marry || 75000);
                    setMarryDuration(preset.marryDuration || '365:0:0');
                  }
                }
                
                if (asset.id === 'custom') {
                  setShowCustomAsset(true);
                  setShowMarriageModifiers(false);
                } else if (asset.id === 'marriage') {
                  setShowMarriageModifiers(true);
                  setShowCustomAsset(false);
                } else {
                  setShowMarriageModifiers(false);
                  setShowCustomAsset(false);
                }
              }}
            >
              <span className="text-lg md:text-xl">{asset.icon}</span>
              <span className="text-xs md:text-sm">{asset.label}</span>
            </Button>
          ))}
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
          <Select value={selectedCurrency} onValueChange={(newCurrency) => {
            // Convert all pricing from current currency to new currency
            const fromRate = getExchangeRate(selectedCurrency).rate;
            const toRate = getExchangeRate(newCurrency).rate;
            const conversionFactor = fromRate / toRate;
            
            // Convert all price values
            setRentPrice(Math.round(rentPrice * conversionFactor));
            setOwnPrice(Math.round(ownPrice * conversionFactor));
            setOwnUpkeep(Math.round(ownUpkeep * conversionFactor));
            setMarryPrice(Math.round(marryPrice * conversionFactor));
            setChildSupport(Math.round(childSupport * conversionFactor));
            
            setSelectedCurrency(newCurrency);
          }}>
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
        <Card className="bg-purple-950 border-purple-400">
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
              <Label className="text-purple-300">Asset Emoji</Label>
              <Input
                value={customAssetEmoji}
                onChange={(e) => setCustomAssetEmoji(e.target.value)}
                placeholder="🎮"
                maxLength={2}
                className="bg-gray-800 border-purple-600 text-purple-400"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marriage Pricing */}
      {selectedAsset === 'marriage' && (
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
                  placeholder="1:0:0"
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
      )}

      {/* General Asset Pricing (for non-marriage assets) */}
      {selectedAsset && selectedAsset !== 'marriage' && (
        <Card className="bg-gray-900 border-green-400">
          <CardHeader>
            <CardTitle className="text-green-400">Pricing Options</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-300">Rent Price (per day)</Label>
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
                  placeholder="1:0:0"
                  className="bg-gray-800 border-green-600 text-green-400"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-300">Purchase Price</Label>
                <Input
                  type="number"
                  value={ownPrice}
                  onChange={(e) => setOwnPrice(Number(e.target.value))}
                  className="bg-gray-800 border-green-600 text-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-green-300">Annual Upkeep Cost</Label>
                <Input
                  type="number"
                  value={ownUpkeep}
                  onChange={(e) => setOwnUpkeep(Number(e.target.value))}
                  className="bg-gray-800 border-green-600 text-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-green-300">Ownership Duration (years)</Label>
                <Input
                  value={ownDuration}
                  onChange={(e) => setOwnDuration(e.target.value)}
                  placeholder="5"
                  className="bg-gray-800 border-green-600 text-green-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marriage Modifiers */}
      {selectedAsset === 'marriage' && (
        <Card className="bg-purple-950 border-purple-400">
          <CardHeader>
            <CardTitle className="text-purple-400">Marriage Reality Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="simpTax"
                checked={simpTax}
                onCheckedChange={(checked) => setSimpTax(checked === true)}
                className="border-purple-600"
              />
              <Label htmlFor="simpTax" className="text-purple-300">
                Apply 30% Simp Tax (gifts, dates, jewelry, etc.)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="divorceMode"
                checked={divorceMode}
                onCheckedChange={(checked) => setDivorceMode(checked === true)}
                className="border-purple-600"
              />
              <Label htmlFor="divorceMode" className="text-purple-300">
                Divorce Mode (calculate divorce costs instead)
              </Label>
            </div>

            {/* Child Support Calculator */}
            <div className="space-y-4 p-4 bg-purple-900/20 rounded-lg border border-purple-600">
              <h4 className="text-purple-300 font-semibold">💸 Child Support Calculator</h4>
              <p className="text-purple-400 text-sm">Because kids are expensive and divorce courts love reminders</p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-purple-300 flex items-center justify-between">
                    <span>Number of Children: {childrenCount}</span>
                    <span className="text-xs">👶 {childrenCount === 0 ? 'None yet!' : `${childrenCount} little money drains`}</span>
                  </Label>
                  <Slider
                    value={[childrenCount]}
                    onValueChange={(value) => setChildrenCount(value[0])}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-purple-400">0 = Living the dream | 10+ = RIP your wallet</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-300 flex items-center justify-between">
                    <span>Monthly Child Support: ${childSupport}</span>
                    <span className="text-xs">💰 Per month, forever</span>
                  </Label>
                  <Slider
                    value={[childSupport]}
                    onValueChange={(value) => setChildSupport(value[0])}
                    max={5000}
                    step={50}
                    className="w-full"
                  />
                  <div className="text-xs text-purple-400">$0 = Wishful thinking | $5000+ = Court-ordered poverty</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-purple-300 flex items-center justify-between">
                    <span>Years of Support: {childSupportYears}</span>
                    <span className="text-xs">⏰ Until they're "adults"</span>
                  </Label>
                  <Slider
                    value={[childSupportYears]}
                    onValueChange={(value) => setChildSupportYears(value[0])}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-purple-400">18 = Standard sentence | 25 = College + grad school torture</div>
                </div>
                
                {childrenCount > 0 && childSupport > 0 && childSupportYears > 0 && (
                  <div className="mt-4 p-3 bg-red-900/30 rounded border border-red-600">
                    <div className="text-red-400 font-bold">
                      💀 TOTAL CHILD SUPPORT DAMAGE: {formatCurrency(childSupport * 12 * childSupportYears, selectedCurrency)}
                    </div>
                    <div className="text-red-300 text-sm mt-1">
                      That's {formatCurrency(childSupport * 12, selectedCurrency)} per year for {childSupportYears} years
                    </div>
                    <div className="text-red-200 text-xs mt-1">
                      💡 Pro tip: This doesn't include birthday gifts, Christmas, or "emergency" money
                    </div>
                  </div>
                )}
                
                {childrenCount === 0 && (
                  <div className="mt-4 p-3 bg-green-900/30 rounded border border-green-600">
                    <div className="text-green-400 font-bold">
                      🎉 CONGRATULATIONS! No children = No child support!
                    </div>
                    <div className="text-green-300 text-sm mt-1">
                      You're living the financially responsible dream
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculate Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={calculateRegret}
          className="bg-green-600 hover:bg-green-700 text-black font-bold px-6 md:px-8 py-3 text-base md:text-lg"
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
            <CardTitle className="text-red-400 text-center text-xl md:text-2xl">
              🚨 REGRET ANALYSIS COMPLETE 🚨
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge className="bg-red-600 text-white text-base md:text-lg px-4 py-2">
                WORST OPTION: {result.worst.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-900 border-green-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-green-400 font-bold">Rent Cost</h3>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatCurrency(result.rentCost, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-900 border-red-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-red-400 font-bold">
                    {selectedAsset === 'marriage' ? 'Marriage' : 'Own'} Cost
                  </h3>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatCurrency(result.ownCost, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-900 border-yellow-400">
                <CardContent className="p-4 text-center">
                  <h3 className="text-yellow-400 font-bold">Potential Savings</h3>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatCurrency(result.savings, selectedCurrency)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Roast Section */}
            <Card className="bg-gray-900 border-green-400">
              <CardContent className="p-4">
                <h3 className="text-green-400 font-bold mb-2">Financial Reality Check:</h3>
                <p className="text-green-300 text-sm md:text-base">{result.roast}</p>
              </CardContent>
            </Card>

            {/* Fun Facts Section */}
            <Card className="bg-blue-950 border-blue-400">
              <CardContent className="p-4">
                <h3 className="text-blue-400 font-bold mb-2">💡 Shocking Fact:</h3>
                <p className="text-blue-300 text-sm md:text-base">{result.fact}</p>
              </CardContent>
            </Card>

            {/* Bottom Line */}
            <div className="text-center">
              <p className="text-green-400 font-bold text-base md:text-lg mb-4">
                IF IT FLIES, FUCKS, OR FLOATS - IT'S CHEAPER TO $RENT!
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={generateMeme}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate Meme
                </Button>
                
                <Button
                  onClick={() => shareResults('twitter')}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}