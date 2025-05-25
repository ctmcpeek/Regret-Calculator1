import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus } from "lucide-react";

export default function AdminPanel() {
  const [showPanel, setShowPanel] = useState(false);
  const [memeTitle, setMemeTitle] = useState("");
  const [memeAssetType, setMemeAssetType] = useState("yacht");
  const [memeFile, setMemeFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Seed starter memes mutation
  const seedMemesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/seed-memes', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memes'] });
      toast({ title: "Starter memes added successfully! 🔥" });
    },
    onError: () => {
      toast({ title: "Failed to add starter memes", variant: "destructive" });
    }
  });

  // Upload custom meme mutation
  const uploadMemeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/memes', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memes'] });
      toast({ title: "Custom meme uploaded successfully! 🎉" });
      setMemeTitle("");
      setMemeFile(null);
      setMemeAssetType("yacht");
    },
    onError: () => {
      toast({ title: "Failed to upload meme", variant: "destructive" });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMemeFile(e.target.files[0]);
    }
  };

  const handleUploadCustomMeme = () => {
    if (!memeTitle || !memeFile) {
      toast({ title: "Please provide both title and image", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('title', memeTitle);
    formData.append('assetType', memeAssetType);
    formData.append('contestPeriod', '2025-01');
    formData.append('image', memeFile);

    uploadMemeMutation.mutate(formData);
  };

  return (
    <>
      {/* Admin Toggle Button */}
      <Button
        onClick={() => setShowPanel(!showPanel)}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-matrix-dark border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-black"
      >
        Admin Panel
      </Button>

      {/* Admin Panel */}
      {showPanel && (
        <Card className="fixed top-16 right-4 z-50 p-4 bg-matrix-dark border-matrix-green w-80 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-matrix-green mb-4">🚀 Admin Panel</h3>
          
          {/* Seed Starter Memes */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={() => seedMemesMutation.mutate()}
              disabled={seedMemesMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {seedMemesMutation.isPending ? "Adding..." : "Add Starter $RENT Memes"}
            </Button>
          </div>

          {/* Upload Custom Meme */}
          <div className="space-y-4 border-t border-matrix-green pt-4">
            <h4 className="font-bold text-matrix-green">Upload Custom Meme</h4>
            
            <div>
              <Label htmlFor="meme-title">Meme Title</Label>
              <Input
                id="meme-title"
                value={memeTitle}
                onChange={(e) => setMemeTitle(e.target.value)}
                placeholder="e.g., When you $RENT instead of own..."
                className="bg-matrix-dark border-matrix-green text-matrix-green"
              />
            </div>

            <div>
              <Label htmlFor="asset-type">Asset Type</Label>
              <Select value={memeAssetType} onValueChange={setMemeAssetType}>
                <SelectTrigger className="bg-matrix-dark border-matrix-green text-matrix-green">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-matrix-dark border-matrix-green">
                  <SelectItem value="yacht">🛥️ Yacht</SelectItem>
                  <SelectItem value="jet">✈️ Private Jet</SelectItem>
                  <SelectItem value="lambo">🏎️ Lamborghini</SelectItem>
                  <SelectItem value="marriage">💍 Marriage</SelectItem>
                  <SelectItem value="mansion">🏛️ Mansion</SelectItem>
                  <SelectItem value="misc">🎯 Misc Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meme-file">Upload Image</Label>
              <Input
                id="meme-file"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="bg-matrix-dark border-matrix-green text-matrix-green"
              />
            </div>

            <Button
              onClick={handleUploadCustomMeme}
              disabled={uploadMemeMutation.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMemeMutation.isPending ? "Uploading..." : "Upload Meme"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}