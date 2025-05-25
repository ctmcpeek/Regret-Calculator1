import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Upload, ThumbsUp, ThumbsDown, Users, Clock, Smartphone, Heart, Share, Trophy, Crown, Medal, Award, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiX, SiFacebook, SiTelegram, SiInstagram, SiDiscord, SiTiktok, SiSnapchat, SiReddit } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface Meme {
  id: number;
  userId: string;
  title: string;
  imageUrl: string;
  assetType: string;
  upvotes: number;
  downvotes: number;
  contestPeriod: string;
  createdAt: string;
}

export default function MemeCommunity() {
  const [contestsEnabled, setContestsEnabled] = useState(false);
  const [contestPeriod, setContestPeriod] = useState("daily");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [memeTitle, setMemeTitle] = useState("");
  const [assetType, setAssetType] = useState("yacht");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [contestTimer, setContestTimer] = useState("23:45:12");
  
  // Swipe mode state
  const [swipeMode, setSwipeMode] = useState(false);
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  
  // Expanded meme view
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  
  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeMode) return;
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeMode || !isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setDragDirection(deltaY > 0 ? 'down' : 'up');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeMode || !isDragging) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      const currentMeme = memes?.[currentMemeIndex];
      if (currentMeme) {
        if (deltaX > threshold) {
          // Swipe right = like
          handleVote(currentMeme.id, 'up');
        } else if (deltaX < -threshold) {
          // Swipe left = dislike
          handleVote(currentMeme.id, 'down');
        } else if (deltaY < -threshold && currentMemeIndex < (memes?.length || 0) - 1) {
          // Swipe up = next meme
          setCurrentMemeIndex(prev => prev + 1);
        } else if (deltaY > threshold && currentMemeIndex > 0) {
          // Swipe down = previous meme
          setCurrentMemeIndex(prev => prev - 1);
        }
      }
    }

    setIsDragging(false);
    setDragDirection(null);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swipeMode) return;
    setStartX(e.clientX);
    setStartY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipeMode || !isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setDragDirection(deltaY > 0 ? 'down' : 'up');
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!swipeMode || !isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const threshold = 100;

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      const currentMeme = memes?.[currentMemeIndex];
      if (currentMeme) {
        if (deltaX > threshold) {
          handleVote(currentMeme.id, 'up');
        } else if (deltaX < -threshold) {
          handleVote(currentMeme.id, 'down');
        } else if (deltaY < -threshold && currentMemeIndex < (memes?.length || 0) - 1) {
          setCurrentMemeIndex(prev => prev + 1);
        } else if (deltaY > threshold && currentMemeIndex > 0) {
          setCurrentMemeIndex(prev => prev - 1);
        }
      }
    }

    setIsDragging(false);
    setDragDirection(null);
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_meme') {
        queryClient.invalidateQueries({ queryKey: ['/api/memes'] });
      } else if (data.type === 'vote_update') {
        queryClient.setQueryData(['/api/memes'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((meme: Meme) => 
            meme.id === data.memeId 
              ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
              : meme
          );
        });
      }
    };

    return () => socket.close();
  }, [queryClient]);

  // Contest timer effect
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let nextReset: Date;
      
      switch(contestPeriod) {
        case 'hourly':
          nextReset = new Date(now);
          nextReset.setHours(now.getHours() + 1, 0, 0, 0);
          break;
        case 'daily':
          nextReset = new Date(now);
          nextReset.setDate(now.getDate() + 1);
          nextReset.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          nextReset = new Date(now);
          nextReset.setDate(now.getDate() + (7 - now.getDay()));
          nextReset.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          nextReset = new Date(now);
          nextReset.setDate(now.getDate() + 1);
          nextReset.setHours(0, 0, 0, 0);
      }
      
      const diff = nextReset.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setContestTimer(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contestPeriod]);

  // Fetch memes
  const { data: memes, isLoading } = useQuery({
    queryKey: ['/api/memes', { contestPeriod }],
    queryFn: async () => {
      const response = await fetch(`/api/memes?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  // Upload meme mutation
  const uploadMemeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/memes', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memes', { contestPeriod }] });
      toast({ title: "Meme uploaded successfully! 🚀" });
      setSelectedFile(null);
      setMemeTitle("");
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => {
      toast({ title: "Failed to upload meme", variant: "destructive" });
    }
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ memeId, voteType }: { memeId: number; voteType: 'up' | 'down' }) => {
      const response = await fetch(`/api/memes/${memeId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });
      if (!response.ok) throw new Error('Vote failed');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the local cache with new vote counts
      queryClient.setQueryData(['/api/memes', { contestPeriod }], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((meme: Meme) => 
          meme.id === variables.memeId 
            ? { ...meme, upvotes: data.upvotes, downvotes: data.downvotes }
            : meme
        );
      });
    },
    onError: () => {
      toast({ title: "Failed to vote", variant: "destructive" });
    }
  });

  // File handlers
  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      toast({ title: "Please select an image file", variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) handleFileSelect(files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Upload meme
  const handleUpload = () => {
    if (!selectedFile) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', memeTitle || 'Untitled Meme');
    formData.append('assetType', assetType);
    formData.append('contestPeriod', contestPeriod);

    uploadMemeMutation.mutate(formData);
  };

  // Vote on meme with enhanced feedback
  const handleVote = (memeId: number, voteType: 'up' | 'down') => {
    voteMutation.mutate({ memeId, voteType });
    toast({ 
      title: voteType === 'up' ? "❤️ Liked!" : "👎 Disliked!",
      description: "Your vote has been recorded"
    });
  };

  // Social media sharing for memes - includes actual meme image
  const shareMeme = (meme: Meme, platform?: string) => {
    const contestText = contestsEnabled ? ` ${contestPeriod} contest winner!` : ' community favorite!';
    const text = `This ${meme.assetType} meme is pure GOLD! 🔥\n\n"${meme.title}"\n\nUpvotes: ${meme.upvotes || 0} | Score: ${(meme.upvotes || 0) - (meme.downvotes || 0)}\n\nJoin our meme${contestText} 😂\n\n#MemeWars #RegretCalculator #${meme.assetType}Memes`;
    const url = encodeURIComponent(window.location.href);
    const encodedText = encodeURIComponent(text);
    const imageUrl = encodeURIComponent(meme.imageUrl);
    
    // Handle direct sharing with image for platforms that support it
    if (!platform) {
      if (navigator.share) {
        // Try to share with image if supported
        fetch(meme.imageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `${meme.title}.jpg`, { type: blob.type });
            navigator.share({
              title: `Meme: ${meme.title}`,
              text,
              url: window.location.href,
              files: [file]
            }).catch(() => {
              // Fallback to text-only sharing
              navigator.share({ title: `Meme: ${meme.title}`, text, url: window.location.href });
            });
          })
          .catch(() => {
            // Fallback to clipboard
            navigator.clipboard.writeText(text + '\n\n' + window.location.href + '\n\nImage: ' + meme.imageUrl);
            toast({ title: "Meme details copied to clipboard!" });
          });
      } else {
        navigator.clipboard.writeText(text + '\n\n' + window.location.href + '\n\nImage: ' + meme.imageUrl);
        toast({ title: "Meme details copied to clipboard!" });
      }
      return;
    }
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodedText}`,
      instagram: `https://www.instagram.com/`,
      discord: `https://discord.com/channels/@me`,
      tiktok: `https://www.tiktok.com/`,
      snapchat: `https://www.snapchat.com/`,
      reddit: `https://www.reddit.com/submit?title=${encodeURIComponent(`Epic ${meme.assetType} Meme`)}&text=${encodedText}&url=${url}`,
      copy: '',
      download: ''
    };
    
    // Handle special sharing cases
    if (platform === 'copy') {
      navigator.clipboard.writeText(text + '\n\n' + window.location.href + '\n\nImage: ' + meme.imageUrl);
      toast({ title: "Meme link and image URL copied!" });
      return;
    }
    
    if (platform === 'download') {
      // Download the meme image
      const link = document.createElement('a');
      link.href = meme.imageUrl;
      link.download = `${meme.title.replace(/[^a-zA-Z0-9]/g, '_')}_meme.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Meme downloaded!" });
      return;
    }
    
    if (platform === 'instagram' || platform === 'tiktok' || platform === 'snapchat' || platform === 'discord') {
      // Copy meme details including image URL for manual sharing
      navigator.clipboard.writeText(text + '\n\n' + window.location.href + '\n\nImage: ' + meme.imageUrl);
      toast({ title: `Meme details copied! Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}...` });
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    } else {
      // Open sharing URL for platforms that support direct URL sharing
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-matrix-green mb-4 terminal-glow">MEME WARS</h2>
        <p className="text-green-400 text-lg mb-6">Upload your financial regret memes and compete with the community!</p>
        
        {/* Easy Upload Button - Most Prominent */}
        <div className="mb-6">
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="w-full max-w-md bg-gradient-to-r from-green-500 to-green-600 text-white text-xl py-4 hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-green-500/25"
          >
            <Upload className="w-8 h-8 mr-3" />
            {showUploadForm ? "Hide Upload Form" : "Upload Your Meme 🚀"}
          </Button>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Button
            onClick={() => setSelectedCategory("all")}
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={`${selectedCategory === "all" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            🌟 All Memes
          </Button>
          <Button
            onClick={() => setSelectedCategory("yacht")}
            variant={selectedCategory === "yacht" ? "default" : "outline"}
            className={`${selectedCategory === "yacht" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            🛥️ Yacht
          </Button>
          <Button
            onClick={() => setSelectedCategory("jet")}
            variant={selectedCategory === "jet" ? "default" : "outline"}
            className={`${selectedCategory === "jet" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            ✈️ Jet
          </Button>
          <Button
            onClick={() => setSelectedCategory("lambo")}
            variant={selectedCategory === "lambo" ? "default" : "outline"}
            className={`${selectedCategory === "lambo" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            🏎️ Lambo
          </Button>
          <Button
            onClick={() => setSelectedCategory("marriage")}
            variant={selectedCategory === "marriage" ? "default" : "outline"}
            className={`${selectedCategory === "marriage" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            💍 Marriage
          </Button>
          <Button
            onClick={() => setSelectedCategory("mansion")}
            variant={selectedCategory === "mansion" ? "default" : "outline"}
            className={`${selectedCategory === "mansion" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            🏛️ Mansion
          </Button>
          <Button
            onClick={() => setSelectedCategory("misc")}
            variant={selectedCategory === "misc" ? "default" : "outline"}
            className={`${selectedCategory === "misc" ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            🎲 Misc
          </Button>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            onClick={() => setSwipeMode(false)}
            variant={!swipeMode ? "default" : "outline"}
            className={`${!swipeMode ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            <Users className="w-4 h-4 mr-2" />
            Gallery View
          </Button>
          <Button
            onClick={() => setSwipeMode(true)}
            variant={swipeMode ? "default" : "outline"}
            className={`${swipeMode ? "bg-matrix-green text-black" : "border-matrix-green text-matrix-green"} hover:bg-green-400`}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Swipe Mode
          </Button>
        </div>
        
        {swipeMode && (
          <div className="mt-4 text-green-400 text-sm bg-matrix-dark border border-matrix-green rounded-lg p-3">
            📱 <strong>Swipe Controls:</strong> Right = Like ❤️ • Left = Dislike 👎 • Up/Down = Navigate
          </div>
        )}
      </div>

      {/* Contest Banner - Only show when contests are enabled */}
      {contestsEnabled && (
        <>
          <Card className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black p-4 text-center">
            <h3 className="font-impact text-xl mb-2 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              {contestPeriod.charAt(0).toUpperCase() + contestPeriod.slice(1)} Meme Contest
            </h3>
            <div className="font-bold text-lg flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              {contestTimer}
            </div>
            <p className="text-sm">Winner gets featured!</p>
          </Card>

          {/* Contest Period Selector - Only show when contests are enabled */}
          <div>
            <Label htmlFor="contestPeriod">Contest Period</Label>
            <Select value={contestPeriod} onValueChange={setContestPeriod}>
              <SelectTrigger className="bg-matrix-dark border-matrix-green text-matrix-green">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-matrix-dark border-matrix-green">
                <SelectItem value="hourly">⏰ Hourly Contest</SelectItem>
                <SelectItem value="daily">📅 Daily Contest</SelectItem>
                <SelectItem value="weekly">📊 Weekly Contest</SelectItem>
                <SelectItem value="monthly">📈 Monthly Contest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Easy Meme Upload - Available to Everyone */}
      {showUploadForm && (
        <Card className="bg-matrix-dark border-2 border-matrix-green p-4">
          <h3 className="text-xl mb-4 text-center flex items-center justify-center gap-2">
            <Upload className="w-6 h-6" />
            Upload Your Meme
          </h3>
          
          <div className="space-y-4">
            <Input
              placeholder="Meme title (optional)"
              value={memeTitle}
              onChange={(e) => setMemeTitle(e.target.value)}
              className="bg-matrix-bg border-matrix-green text-matrix-green"
            />
            
            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger className="bg-matrix-bg border-matrix-green text-matrix-green">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-matrix-dark border-matrix-green">
                <SelectItem value="yacht">🛥️ Yacht</SelectItem>
                <SelectItem value="jet">✈️ Private Jet</SelectItem>
                <SelectItem value="lambo">🏎️ Lamborghini</SelectItem>
                <SelectItem value="marriage">💍 Marriage</SelectItem>
                <SelectItem value="mansion">🏛️ Mansion</SelectItem>
                <SelectItem value="misc">🎲 Misc</SelectItem>
                <SelectItem value="custom">🎯 Custom Asset</SelectItem>
              </SelectContent>
            </Select>
            
            <div
              className={`border-2 border-dashed p-8 text-center rounded-lg cursor-pointer transition-all ${
                dragOver 
                  ? 'border-green-400 bg-green-400/10' 
                  : 'border-matrix-green hover:border-green-400 hover:bg-green-400/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 mx-auto mb-2 text-matrix-green" />
              <p className="text-matrix-green">
                {selectedFile 
                  ? `Selected: ${selectedFile.name}` 
                  : 'Drop your meme here or click to upload'
                }
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={uploadMemeMutation.isPending || !selectedFile}
              className="w-full bg-yellow-600 text-black hover:bg-yellow-500"
            >
              {uploadMemeMutation.isPending ? 'Uploading...' : '🚀 Launch Meme'}
            </Button>
          </div>
        </Card>
      )}

      {/* Real-Time Meme Wars Leaderboard */}
      {showLeaderboard && memes && memes.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-900/20 to-matrix-dark border-2 border-yellow-500 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Trophy className="w-7 h-7" />
              MEME WARS LEADERBOARD
            </h3>
            <Button
              onClick={() => setShowLeaderboard(false)}
              variant="ghost"
              size="sm"
              className="text-yellow-400 hover:text-yellow-300"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-3">
            {memes
              .slice()
              .sort((a: Meme, b: Meme) => {
                const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
                const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
                return scoreB - scoreA;
              })
              .slice(0, 5)
              .map((meme: Meme, index: number) => {
                const score = (meme.upvotes || 0) - (meme.downvotes || 0);
                const getRankIcon = (rank: number) => {
                  switch (rank) {
                    case 0: return <Crown className="w-5 h-5 text-yellow-400" />;
                    case 1: return <Medal className="w-5 h-5 text-gray-400" />;
                    case 2: return <Award className="w-5 h-5 text-amber-600" />;
                    default: return <span className="w-5 h-5 flex items-center justify-center text-matrix-green font-bold">#{rank + 1}</span>;
                  }
                };
                
                return (
                  <div 
                    key={meme.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                      index === 0 ? 'bg-yellow-500/10 border-yellow-500' :
                      index === 1 ? 'bg-gray-500/10 border-gray-500' :
                      index === 2 ? 'bg-amber-600/10 border-amber-600' :
                      'bg-matrix-green/10 border-matrix-green'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-amber-600' :
                        'text-matrix-green'
                      }`}>
                        {index === 0 ? 'CHAMPION' : 
                         index === 1 ? 'RUNNER-UP' :
                         index === 2 ? 'BRONZE' : 
                         `RANK ${index + 1}`}
                      </span>
                    </div>
                    
                    <img 
                      src={meme.imageUrl} 
                      alt={meme.title}
                      className="w-12 h-12 object-cover rounded border border-matrix-green"
                    />
                    
                    <div className="flex-1">
                      <div className="font-bold text-matrix-green truncate">{meme.title}</div>
                      <div className="text-sm text-green-400">@User{meme.userId.slice(-4)} • {meme.assetType}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold text-lg ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {score > 0 ? '+' : ''}{score}
                      </div>
                      <div className="text-xs text-green-400">
                        ❤️ {meme.upvotes || 0} • 👎 {meme.downvotes || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          <div className="mt-4 text-center text-yellow-400 text-sm animate-pulse">
            🔥 Live updates • Vote to change rankings! 🔥
          </div>
        </Card>
      )}

      {/* Swipe Mode Interface */}
      {swipeMode ? (
        <div className="relative h-[80vh] max-w-md mx-auto">
          {memes && memes.length > 0 ? (
            <div
              ref={swipeContainerRef}
              className="relative w-full h-full overflow-hidden rounded-2xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ touchAction: 'none' }}
            >
              {/* Current Meme */}
              {memes[currentMemeIndex] && (
                <Card className={`absolute inset-0 bg-matrix-dark border-2 border-matrix-green overflow-hidden transition-transform duration-300 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                } ${
                  dragDirection === 'right' ? 'transform rotate-6 opacity-80' :
                  dragDirection === 'left' ? 'transform -rotate-6 opacity-80' :
                  dragDirection === 'up' ? 'transform -translate-y-4' :
                  dragDirection === 'down' ? 'transform translate-y-4' : ''
                }`}>
                  {/* Meme Image */}
                  <div className="relative h-3/4 overflow-hidden">
                    <img 
                      src={memes[currentMemeIndex].imageUrl} 
                      alt={memes[currentMemeIndex].title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Swipe Indicators */}
                    <div className={`absolute top-4 left-4 px-3 py-2 rounded-full font-bold text-lg transition-opacity ${
                      dragDirection === 'right' ? 'opacity-100 bg-green-500 text-white' : 'opacity-0'
                    }`}>
                      ❤️ LIKE
                    </div>
                    <div className={`absolute top-4 right-4 px-3 py-2 rounded-full font-bold text-lg transition-opacity ${
                      dragDirection === 'left' ? 'opacity-100 bg-red-500 text-white' : 'opacity-0'
                    }`}>
                      👎 NOPE
                    </div>
                  </div>
                  
                  {/* Meme Info */}
                  <div className="p-4 h-1/4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-matrix-green mb-2">{memes[currentMemeIndex].title}</h3>
                      <div className="flex items-center justify-between text-sm text-green-400">
                        <span>@User{memes[currentMemeIndex].userId.slice(-4)}</span>
                        <span className="bg-matrix-green text-black px-2 py-1 rounded text-xs font-bold">
                          {memes[currentMemeIndex].assetType.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <Button
                        onClick={() => handleVote(memes[currentMemeIndex].id, 'down')}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {memes[currentMemeIndex].downvotes || 0}
                      </Button>
                      
                      <Button
                        onClick={() => shareMeme(memes[currentMemeIndex])}
                        variant="outline"
                        size="sm"
                        className="border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-black"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleVote(memes[currentMemeIndex].id, 'up')}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        <Heart className="w-4 h-4" />
                        {memes[currentMemeIndex].upvotes || 0}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Meme Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-green-400 text-sm">
                {currentMemeIndex + 1} / {memes?.length || 0}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-green-400">
              <Smartphone className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No memes to swipe through yet!</p>
              <p className="text-sm mt-2">Upload some memes to get started</p>
            </div>
          )}
        </div>
      ) : (
        /* Gallery Mode */
        <Card className="bg-matrix-dark border-2 border-matrix-green p-4">
          <h3 className="text-xl mb-4 text-center flex items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            Community Memes
          </h3>
          
          <div className="flex flex-col space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
          {isLoading ? (
            <div className="col-span-full text-center text-green-400">Loading memes...</div>
          ) : memes && memes.length > 0 ? (
            memes
              .filter((meme: Meme) => selectedCategory === "all" || meme.assetType === selectedCategory)
              .map((meme: Meme, index: number) => (
              <Card 
                key={meme.id} 
                className="meme-card p-2 sm:p-3 bg-gradient-to-br from-matrix-bg to-matrix-dark border border-matrix-green hover:border-green-400 transition-all duration-300 break-inside-avoid w-full"
              >
                <img 
                  src={meme.imageUrl} 
                  alt={meme.title}
                  className="w-full h-40 sm:h-48 md:h-56 object-cover rounded mb-2 sm:mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedMeme(meme)}
                />
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm">
                    <div className="font-bold text-green-400">#{index + 1} {meme.title}</div>
                    <div className="text-green-300">@User{meme.userId.slice(-4)}</div>
                  </div>
                  <div className="text-xs text-green-400">
                    {meme.assetType}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-green-400">
                      Score: {(meme.upvotes || 0) - (meme.downvotes || 0)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVote(meme.id, 'up')}
                        disabled={voteMutation.isPending}
                        className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {meme.upvotes || 0}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVote(meme.id, 'down')}
                        disabled={voteMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        {meme.downvotes || 0}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Easy Meme Sharing */}
                  <div className="pt-3 border-t border-matrix-green/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-400 font-semibold">Share this meme:</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareMeme(meme, 'twitter')}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-2"
                          title="Share on Twitter"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareMeme(meme, 'facebook')}
                          className="text-blue-600 hover:text-blue-500 hover:bg-blue-600/10 px-2"
                          title="Share on Facebook"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareMeme(meme, 'reddit')}
                          className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 px-2"
                          title="Share on Reddit"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareMeme(meme, 'copy')}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10 px-2"
                          title="Copy Link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareMeme(meme, 'download')}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 px-2"
                          title="Download Meme"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-green-400 py-8">
              No memes yet. Be the first to upload! 🚀
            </div>
          )}
          </div>
        </Card>
      )}

      {/* Expanded Meme View Modal */}
      <Dialog open={!!selectedMeme} onOpenChange={() => setSelectedMeme(null)}>
        <DialogContent className="max-w-4xl bg-matrix-dark border-matrix-green">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center justify-between">
              <span>{selectedMeme?.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMeme(null)}
                className="text-green-400 hover:bg-matrix-bg"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeme && (
            <div className="space-y-4">
              <img 
                src={selectedMeme.imageUrl} 
                alt={selectedMeme.title}
                className="w-full max-h-[70vh] object-contain rounded"
              />
              
              <div className="flex items-center justify-between text-green-300">
                <div>
                  <p className="font-bold">@User{selectedMeme.userId.slice(-4)}</p>
                  <p className="text-sm text-green-400">Asset: {selectedMeme.assetType}</p>
                  <p className="text-xs text-green-500">
                    {new Date(selectedMeme.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => selectedMeme && handleVote(selectedMeme.id, 'up')}
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {selectedMeme.upvotes || 0}
                  </Button>
                  
                  <Button
                    onClick={() => selectedMeme && handleVote(selectedMeme.id, 'down')}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    {selectedMeme.downvotes || 0}
                  </Button>
                  
                  <Button
                    onClick={() => selectedMeme && shareMeme(selectedMeme)}
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .meme-card {
          transition: all 0.3s ease;
        }
        
        .meme-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);
        }
        
        .font-impact {
          font-family: 'Impact', 'Arial Black', sans-serif;
        }
      `}</style>
    </div>
  );
}
