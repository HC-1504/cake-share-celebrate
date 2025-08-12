import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { cakeUploadABI, cakeUploadAddress } from "@/config/contracts";
import { holesky } from "wagmi/chains";
import { toast } from "sonner";
import WalletBalance from "@/components/WalletBalance";

const UploadCake = () => {
  const { isAuthenticated } = useAuth();
  const { address } = useAccount();
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    file: null as File | null,
    fileType: "image" as "image" | "3d",
    tableNumber: "",
    seatNumber: "",
    story: ""
  });
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadingToBlockchain, setUploadingToBlockchain] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState<Array<{tableNumber: number, seatNumber: number}>>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);

  // Blockchain integration
  const { writeContract, data: hash, error: contractError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle blockchain transaction results
  useEffect(() => {
    if (isConfirmed && hash) {
      console.log("Blockchain transaction confirmed:", hash);
      toast.success("Cake uploaded to blockchain successfully!");
      
      // Now save to database after blockchain confirmation
      const saveToDatabase = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          const saveRes = await fetch("/api/cakes/save-to-db", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: form.title,
              description: form.description,
              imageUrl: uploadedFileUrl, // This will be set from the file upload step
              fileType: form.fileType,
              tableNumber: parseInt(form.tableNumber),
              seatNumber: parseInt(form.seatNumber),
              story: form.story,
              blockchainHash: hash,
            }),
          });
          
          if (!saveRes.ok) {
            const errorData = await saveRes.json();
            throw new Error(`Failed to save to database: ${errorData.error || 'Unknown error'}`);
          }
          
          setSuccess(true);
          setUploadingToBlockchain(false);
          toast.success("Cake uploaded successfully to both blockchain and database!");
          
        } catch (error: any) {
          console.error('Database save error:', error);
          toast.error(`Failed to save to database: ${error.message}`);
          setError(error.message);
          setUploadingToBlockchain(false);
        }
      };
      
      saveToDatabase();
    }
     }, [isConfirmed, hash, uploadedFileUrl]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      console.error("Contract error:", contractError);
      let errorMessage = "Blockchain transaction failed";
      
      if (contractError.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (contractError.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (contractError.message.includes("network")) {
        errorMessage = "Network error. Please check your connection";
      } else if (contractError.message.includes("contract")) {
        errorMessage = "Contract error. Please try again";
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
      setUploadingToBlockchain(false);
    }
  }, [contractError]);

  // Fetch occupied seats function
  const fetchOccupiedSeats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔍 使用的token:', token);
      if (!token) {
        console.log('❌ 没有找到token');
        return;
      }

      const response = await fetch('/api/occupied-seats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 API响应状态:', response.status);
      if (response.ok) {
        const seats = await response.json();
        console.log('🔍 获取到的已占用座位:', seats);
        setOccupiedSeats(seats);
      } else {
        console.error('❌ API请求失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Fetch occupied seats on component mount
  useEffect(() => {
    fetchOccupiedSeats();
  }, []);

  // Early returns after all hooks
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Check if wallet is connected
  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <Card className="max-w-md w-full border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">Wallet Connection Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please connect your MetaMask wallet to upload cakes to the blockchain.
            </p>
            <Button variant="cake" className="w-full" onClick={() => window.location.reload()}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't show success page until blockchain transaction is confirmed
  if (submitted && !isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <Card className="max-w-md w-full border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              Uploading to Blockchain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {/* Backend Upload Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-sm text-muted-foreground">Cake Details</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-sm text-muted-foreground">File Upload</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-sm text-muted-foreground">Position Assignment</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-sm text-muted-foreground">Database Storage</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ⏳
                  </div>
                  <span className="text-sm text-muted-foreground">Blockchain Upload</span>
                </div>
              </div>
              
              {/* Loading Message */}
              <div className="pt-4">
                <div className="text-lg font-semibold text-blue-600 mb-2">
                  🔄 Uploading to Blockchain...
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Please confirm the transaction in your wallet</div>
                  <div>This may take a few moments</div>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="pt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '80%'}}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Waiting for blockchain confirmation...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      setForm({ ...form, file: (e.target as HTMLInputElement).files?.[0] || null });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileTypeChange = (value: string) => {
    setForm({ ...form, fileType: value as "image" | "3d", file: null });
  };

  const handleTableChange = (value: string) => {
    setForm({ ...form, tableNumber: value, seatNumber: "" });
    // 当表格改变时，重新获取已占用座位数据
    if (value) {
      fetchOccupiedSeats();
    }
  };

  const handleSeatClick = (seatNumber: string) => {
    setForm({ ...form, seatNumber });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setUploadingToBlockchain(false);

    if (!form.title || !form.description || !form.file || !form.tableNumber || !form.seatNumber) {
      setError("Please fill in all required fields");
      return;
    }

    if (!address) {
      setError("Please connect your wallet to upload to blockchain");
      return;
    }

    try {
      // Step 1: Upload file to backend to get file URL (but don't save to database yet)
      const formDataObj = new FormData();
      formDataObj.append("title", form.title);
      formDataObj.append("description", form.description);
      if (form.file) formDataObj.append("file", form.file);
      formDataObj.append("fileType", form.fileType);
      formDataObj.append("tableNumber", form.tableNumber);
      formDataObj.append("seatNumber", form.seatNumber);
      formDataObj.append("story", form.story);
      
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/cakes/upload-file", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formDataObj,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to upload file: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const result = await res.json();
      const fileUrl = result.fileUrl;
      setUploadedFileUrl(fileUrl); // Store the file URL for later use
      
      // Step 2: Upload to blockchain first
      setUploadingToBlockchain(true);
      setSubmitted(true);
      
      console.log("Uploading to blockchain with address:", address);
      console.log("Contract address:", cakeUploadAddress[holesky.id]);
      console.log("File URL:", fileUrl);
      
              try {
          writeContract({
            address: cakeUploadAddress[holesky.id],
            abi: cakeUploadABI,
            functionName: 'uploadCake',
            args: [
              form.title,
              form.description,
              fileUrl,
              form.fileType,
              parseInt(form.tableNumber),
              parseInt(form.seatNumber),
              form.story
            ],
            chain: holesky,
            account: address,
          });
          
          console.log("Blockchain transaction initiated");
          toast.success("Blockchain transaction initiated! Waiting for confirmation...");
          
          // The transaction confirmation will be handled by the useEffect hook
          // which listens to isConfirmed and hash changes
          
        } catch (blockchainError: any) {
        console.error('Blockchain error:', blockchainError);
        
        // Provide more specific error messages
        let errorMessage = 'Blockchain transaction failed';
        if (blockchainError.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (blockchainError.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (blockchainError.message?.includes('network')) {
          errorMessage = 'Network error. Please check your connection';
        } else if (blockchainError.message?.includes('contract')) {
          errorMessage = 'Contract interaction failed. Please try again';
        } else {
          errorMessage = `Blockchain error: ${blockchainError.message || 'Unknown error'}`;
        }
        
        setError(errorMessage);
        setUploadingToBlockchain(false);
        setSubmitted(true);
        return;
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || "Failed to upload cake");
      setUploadingToBlockchain(false);
      setSubmitted(true);
    }
  };





  // 渲染座位格子
  const renderSeatGrid = () => {
    if (!form.tableNumber) return null;
    if (loadingSeats) {
      return (
        <div className="space-y-4">
          <Label>Select Seat Position</Label>
          <div className="text-sm text-muted-foreground">Loading seat availability...</div>
        </div>
      );
    }

    console.log('🔍 当前表格号:', form.tableNumber);
    console.log('🔍 已占用座位列表:', occupiedSeats);

    const seats = [];
    for (let i = 1; i <= 6; i++) {
      const isSelected = form.seatNumber === i.toString();
      const isOccupied = occupiedSeats.some(
        seat => seat.tableNumber === parseInt(form.tableNumber) && seat.seatNumber === i
      );
      
      console.log(`🔍 座位 ${i}: 是否被占用 = ${isOccupied}`);
      
      seats.push(
        <button
          key={i}
          type="button"
          onClick={() => !isOccupied && handleSeatClick(i.toString())}
          disabled={isOccupied}
          className={`
            w-16 h-16 border-2 rounded-lg flex items-center justify-center text-sm font-medium transition-all
            ${isSelected 
              ? 'border-orange-500 bg-orange-100 text-orange-700' 
              : isOccupied
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
            }
          `}
        >
          {isOccupied ? '❌' : i}
        </button>
      );
    }

    return (
      <div className="space-y-4">
        <Label>Select Seat Position</Label>
        <div className="grid grid-cols-3 gap-3 max-w-xs">
          {seats}
        </div>
        {form.seatNumber && (
          <p className="text-sm text-green-600">
            Selected: Table {form.tableNumber}, Seat {form.seatNumber}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          <p>• Available seats are numbered</p>
          <p>• Occupied seats show ❌ and are disabled</p>
        </div>
      </div>
    );
  };

  if (submitted && success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <Card className="max-w-md w-full border-0 shadow-cake">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              Cake Upload Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-center space-y-4">
                {/* Success Steps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-muted-foreground">Cake Details</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-muted-foreground">File Upload</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-muted-foreground">Position Assignment</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-muted-foreground">Database Storage</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-muted-foreground">Blockchain Upload</span>
                  </div>
                </div>
                
                {/* Success Message */}
                <div className="pt-4">
                  <div className="text-lg font-semibold text-green-600 mb-2">
                    🍰 Cake Upload Completed! 🎉
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Your cake "{form.title}" has been successfully uploaded!</div>
                    <div>Assigned to: Table {form.tableNumber}, Seat {form.seatNumber}</div>
                    <div>File type: {form.fileType === 'image' ? 'Photo' : '3D Model'}</div>
                    {hash && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="font-medium text-blue-800">Blockchain Transaction:</div>
                        <div className="text-xs text-blue-600 break-all">{hash}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  <Button variant="cake" className="w-full" asChild>
                    <a href="/gallery">View Gallery</a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/dashboard">Back to Dashboard</a>
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet Balance */}
          <div className="lg:col-span-1">
            <WalletBalance />
          </div>
          
          {/* Right Column - Upload Form */}
          <div className="lg:col-span-2">
            <Card className="w-full border-0 shadow-cake">
              <CardHeader>
                <CardTitle className="text-center text-xl">Upload Cake Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {error && <div className="text-red-600 text-center mb-2">{error}</div>}
                  
                  {/* Help section */}
                  <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="font-medium mb-1">💡 Upload Rules:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Each user can only upload ONE cake (one-time upload)</li>
                      <li>• Each seat can only have ONE cake</li>
                      <li>• Occupied seats are disabled (❌)</li>
                      <li>• You can upload photos or 3D models (GLB files)</li>
                    </ul>
                  </div>
                  
                  {/* Debug info */}
                  <div className="text-xs text-muted-foreground p-3 bg-green-50 rounded border border-green-200">
                    <p className="font-medium mb-1">🔗 Blockchain Info:</p>
                    <div className="space-y-1 text-xs">
                      <div>Connected Wallet: {address}</div>
                      <div>Contract Address: {cakeUploadAddress[holesky.id]}</div>
                      <div>Network: Holesky Testnet</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Cake Title</Label>
                    <Input id="title" name="title" value={form.title} onChange={handleChange} required />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" value={form.description} onChange={handleChange} required />
                  </div>
                  
                  <div>
                    <Label>File Type</Label>
                    <Select value={form.fileType} onValueChange={handleFileTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Photo</SelectItem>
                        <SelectItem value="3d">3D Model (GLB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="file">
                      {form.fileType === "image" ? "Cake Photo" : "3D Model File"}
                    </Label>
                    <Input 
                      id="file" 
                      name="file" 
                      type="file" 
                      accept={form.fileType === "image" ? "image/*" : ".glb"} 
                      onChange={handleChange} 
                      required 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.fileType === "image" 
                        ? "Upload a photo of your cake" 
                        : "Upload a GLB 3D model file"
                      }
                    </p>
                  </div>
                  
                  <div>
                    <Label>Table Number</Label>
                    <Select value={form.tableNumber} onValueChange={handleTableChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>Table {num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {renderSeatGrid()}
                  
                  <div>
                    <Label htmlFor="story">Story Behind the Cake</Label>
                    <textarea 
                      id="story" 
                      name="story" 
                      value={form.story} 
                      onChange={handleChange} 
                      className="w-full rounded-md border px-3 py-2 min-h-[100px] resize-vertical" 
                      required 
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="cake" 
                    className="w-full"
                    disabled={uploadingToBlockchain || isConfirming}
                  >
                    {uploadingToBlockchain 
                      ? "Initiating Transaction..." 
                      : isConfirming 
                      ? "Confirming Transaction..." 
                      : "Upload Cake"
                    }
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadCake; 