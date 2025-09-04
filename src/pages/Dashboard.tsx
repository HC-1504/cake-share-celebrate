// Import the hooks and icons we need
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Upload,
  Vote,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,      // <-- ADDED: For loading spinner
  User as UserIcon, // <-- ADDED: For the user details card
  Trash2,       // <-- ADDED: For delete button
  Edit,         // <-- ADDED: For edit button
  Cake,          // <-- ADDED: For cake icon
  ExternalLink // ADDED: For external link icon
} from "lucide-react";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  cakeUploadABI, 
  cakeUploadAddress, 
  eventRegistrationABI, 
  eventRegistrationAddress, 
  checkInOutABI,          // add this
  checkInOutAddress       // add this
} from '@/config/contracts';

import { holesky } from 'wagmi/chains';
import { publicClient } from '../config/web3';
import { useToast } from '@/hooks/use-toast';
import ModelViewer from '@/components/ModelViewer';
import SimpleModelViewer from '@/components/SimpleModelViewer';
import ErrorBoundary from '@/components/ErrorBoundary';


// ===========================================================
// [MARKER] PART 1: ADDED DATA FETCHING LOGIC
// ===========================================================

// Define a type for the user data we expect from the backend
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  ethAddress: string;
  category: string;
  checkedIn: boolean;
}

// Define a type for cake data
interface Cake {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  fileType: string;
  tableNumber: number;
  seatNumber: number;
  story: string;
  UserId: number;
  createdAt: string;
  User?: {
    firstName: string;
    lastName: string;
  };
}

const Dashboard = () => {
  // Get the token from the auth context to make authenticated API calls
  const { isAuthenticated, token } = useAuth();
  const { address } = useAccount();

  // State to hold the fetched user data, loading status, and any errors
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCake, setUserCake] = useState<Cake | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    story: '',
    tableNumber: 1,
    seatNumber: 1,
    fileType: 'image'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<Array<{ tableNumber: number, seatNumber: number }>>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Wagmi hooks for smart contract interaction
  const { writeContract, isPending: isContractPending, data: deleteHash } = useWriteContract();
  const { toast } = useToast();

  // Wait for delete transaction confirmation
  const { isSuccess: isDeleteConfirmed } = useWaitForTransactionReceipt({
    hash: deleteHash,
    chainId: holesky.id,
  });

  // Read user's cake from blockchain
  const { data: userCakeIds } = useReadContract({
    address: cakeUploadAddress[holesky.id],
    abi: cakeUploadABI,
    functionName: 'getUserCakes',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  // Read cake details from blockchain
  const { data: blockchainCake } = useReadContract({
    address: cakeUploadAddress[holesky.id],
    abi: cakeUploadABI,
    functionName: 'getCake',
    args: [userCakeIds?.[0] || 0n],
    query: {
      enabled: !!userCakeIds && userCakeIds.length > 0,
    },
  });

  // State to store the fetched registration event
  const [registrationEvent, setRegistrationEvent] = useState<any>(null);

  // --- ALL YOUR ORIGINAL MOCK DATA AND HELPER FUNCTIONS ARE UNTOUCHED ---
  const [userProgress, setUserProgress] = useState({
    registration: { completed: true, status: "completed" },
    cakeUpload: { completed: false, status: "pending" },
    checkin: { completed: false, status: "locked" },
    voting: { completed: false, status: "locked" },
    checkout: { completed: false, status: "locked" },
  });

  const [votingStatus, setVotingStatus] = useState<{ beautiful: boolean; delicious: boolean }>({ beautiful: false, delicious: false });
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Function to fetch user's cake from database
  const fetchUserCake = async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/cakes", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const cakes = await res.json();
        const userCake = cakes.find((cake: Cake) => cake.UserId === user?.id);
        setUserCake(userCake || null);
      }
    } catch (error) {
      console.error('Error fetching user cake:', error);
    }
  };

  // Function to delete cake
  const handleEditCake = async () => {
    if (!userCake || !token) return;

    setUpdating(true);

    try {
      console.log('🔄 开始编辑蛋糕...');
      console.log('用户蛋糕ID:', userCake.id);
      console.log('编辑表单数据:', editForm);

      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('description', editForm.description);
      formData.append('story', editForm.story);
      formData.append('tableNumber', editForm.tableNumber.toString());
      formData.append('seatNumber', editForm.seatNumber.toString());
      formData.append('fileType', editForm.fileType);

      if (selectedFile) {
        formData.append('file', selectedFile);
        console.log('📁 包含文件上传:', selectedFile.name);
      }

      console.log('📤 发送PUT请求到:', `http://localhost:5001/api/cakes/${userCake.id}`);

      const res = await fetch(`http://localhost:5001/api/cakes/${userCake.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📥 收到响应:', res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ 编辑成功:', data);
        setUserCake(data.cake);
        setUpdating(false);
        setSelectedFile(null);
        setEditing(false); // 关闭编辑对话框
        toast({
          title: "Cake Updated Successfully",
          description: "Your cake details have been updated in the database",
        });
      } else {
        const errorData = await res.json();
        console.error('❌ 编辑失败:', errorData);
        throw new Error(errorData.error || 'Failed to update cake');
      }
    } catch (error) {
      console.error('❌ 编辑过程中出错:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while updating the cake",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const fetchOccupiedSeats = async () => {
    try {
      setLoadingSeats(true);
      const response = await fetch('/api/occupied-seats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOccupiedSeats(data);
      } else {
        console.error('Failed to fetch occupied seats');
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  const openEditForm = () => {
    if (userCake) {
      setEditForm({
        title: userCake.title,
        description: userCake.description,
        story: userCake.story,
        tableNumber: userCake.tableNumber,
        seatNumber: userCake.seatNumber,
        fileType: userCake.fileType
      });
      fetchOccupiedSeats();
    }
  };

  const handleSeatClick = (seatNumber: string) => {
    setEditForm(prev => ({ ...prev, seatNumber: parseInt(seatNumber) }));
  };

  const renderSeatGrid = () => {
    if (!editForm.tableNumber) return null;
    if (loadingSeats) {
      return (
        <div className="space-y-4">
          <Label>Select Seat Position</Label>
          <div className="text-sm text-muted-foreground">Loading seat availability...</div>
        </div>
      );
    }

    const seats = [];
    for (let i = 1; i <= 6; i++) {
      const isSelected = editForm.seatNumber === i;
      const isOccupied = occupiedSeats.some(
        seat => seat.tableNumber === editForm.tableNumber && seat.seatNumber === i
      );

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
        {editForm.seatNumber && (
          <p className="text-sm text-green-600">
            Selected: Table {editForm.tableNumber}, Seat {editForm.seatNumber}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          <p>• Available seats are numbered</p>
          <p>• Occupied seats show ❌ and are disabled</p>
        </div>
      </div>
    );
  };

  const handleDeleteCake = async () => {
    if (!userCake || !token || !address) return;

    setDeleting(true);

    try {
      // Step 1: Call smart contract to remove cake from blockchain
      if (userCakeIds && userCakeIds.length > 0) {
        try {
          console.log('Attempting to call smart contract...');
          console.log('Available cake IDs:', userCakeIds);

          // Find the active cake ID to delete
          let activeCakeId = null;
          // Since we know from our analysis that ID 1 is active and ID 0 is inactive,
          // let's try to delete the last cake ID (which should be ID 1)
          if (userCakeIds.length > 0) {
            activeCakeId = userCakeIds[userCakeIds.length - 1]; // Get the last cake ID
          }

          if (activeCakeId !== null) {
            console.log('Deleting cake ID:', activeCakeId);
            writeContract({
              address: cakeUploadAddress[holesky.id],
              abi: cakeUploadABI,
              functionName: 'removeCake',
              args: [activeCakeId],
              chain: holesky,
              account: address,
            });
            console.log('Smart contract call initiated');

            toast({
              title: "Blockchain Transaction Initiated",
              description: "Removing cake from blockchain...",
            });

            // The transaction confirmation will be handled by the useEffect hook
            // which listens to isConfirmed and hash changes
          } else {
            throw new Error('No active cake found to delete');
          }

        } catch (contractError) {
          console.error('Smart contract error:', contractError);
          toast({
            title: "Blockchain Error",
            description: "Failed to remove cake from blockchain. Please try again.",
            variant: "destructive",
          });
          setDeleting(false);
          return;
        }
      } else {
        // If no blockchain cake IDs, just delete from database
        console.log('No blockchain cake IDs found, deleting from database only');

        const res = await fetch(`/api/cakes/${userCake.id}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.ok) {
          toast({
            title: "Cake Deleted Successfully",
            description: "Your cake has been successfully deleted from database",
          });
          setUserCake(null);
          setUserProgress(prev => ({
            ...prev,
            cakeUpload: { completed: false, status: "pending" },
            checkin: { ...prev.checkin, status: "locked" }
          }));
        } else {
          throw new Error('Failed to delete cake from database');
        }
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting cake:', error);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the cake. Please try again.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  // useEffect hook to fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false);
        return; // Don't try to fetch if there's no token
      }
      try {
        const res = await fetch("/api/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Could not fetch user data.");
        }
        const data: User = await res.json();
        setUser(data); // Success! Store the user data.

        // Check if user has uploaded a cake
        const cakeRes = await fetch("/api/cakes", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (cakeRes.ok) {
          const cakes = await cakeRes.json();
          const userCake = cakes.find((cake: Cake) => cake.UserId === data.id);
          setUserCake(userCake || null);

          const hasUploadedCake = !!userCake;
          const isCheckedIn = !!data.checkedIn;

          setUserProgress(prev => ({
            ...prev,
            cakeUpload: {
              completed: hasUploadedCake,
              status: hasUploadedCake ? "completed" : "pending"
            },
            checkin: {
              completed: isCheckedIn,
              status: hasUploadedCake ? (isCheckedIn ? 'completed' : 'pending') : 'locked',
            },
            voting: {
              ...prev.voting,
              status: isCheckedIn ? prev.voting.status : 'locked',
            },
          }));
        }
      } catch (err: any) {
        setError(err.message); // Store any error message
      } finally {
        setLoading(false); // We are done loading
      }
    };

    fetchUserData();
  }, [token]); // This code runs whenever the token changes

  // Fetch my voting status
  useEffect(() => {
    const fetchVotingStatus = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/votes/my-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVotingStatus(data);
          const bothDone = !!data.beautiful && !!data.delicious;
          setUserProgress(prev => ({
            ...prev,
            voting: { completed: bothDone, status: prev.checkin.completed ? (bothDone ? 'completed' : 'pending') : 'locked' },
            checkout: { ...prev.checkout, status: bothDone && prev.checkin.completed ? 'pending' : 'locked' },
          }));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchVotingStatus();
  }, [token, user?.checkedIn]);

  // Define a type for the Registered event arguments
  interface RegisteredEventArgs {
    user: `0x${string}`;
    timestamp: bigint;
    category: string;
  }

  // Fetch user's registration event from blockchain
  useEffect(() => {
    const fetchRegistrationEvent = async () => {
      if (!address || !eventRegistrationAddress[holesky.id] || !publicClient) return;

      try {
        const logs = await publicClient.getLogs({
          address: eventRegistrationAddress[holesky.id],
          event: {
            anonymous: false,
            inputs: [
              { indexed: true, internalType: 'address', name: 'user', type: 'address' },
              { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
              { indexed: false, internalType: 'string', name: 'category', type: 'string' },
            ],
            name: 'Registered',
            type: 'event',
          },
          args: { user: address },
          fromBlock: 4382432n, // Start from contract deployment block
          toBlock: 'latest',
        });

        if (logs.length > 0) {
          // Assuming the latest event is the most relevant registration
          const latestLog = logs[logs.length - 1];
          // Type cast latestLog.args to the defined interface
          const eventArgs = latestLog.args as RegisteredEventArgs;

          setRegistrationEvent({
            user: eventArgs.user,
            timestamp: Number(eventArgs.timestamp),
            category: eventArgs.category,
            transactionHash: latestLog.transactionHash,
          });
        }
      } catch (error) {
        console.error("Error fetching registration event:", error);
      }
    };

    fetchRegistrationEvent();
  }, [address, publicClient]);

  // ----------------------- CHECK-IN -----------------------
const { writeContract: writeCheckIn, data: checkInTxHash, isPending: isCheckInPending } = useWriteContract();
const { isSuccess: isCheckInConfirmed } = useWaitForTransactionReceipt({
  hash: checkInTxHash,
  chainId: holesky.id,
});

const handleCheckIn = async () => {
  if (!token || !address) return;

  try {
    setIsCheckingIn(true);

    // 1. Call smart contract checkIn()
    writeCheckIn({
      address: checkInOutAddress[holesky.id],
      abi: checkInOutABI,
      functionName: "checkIn",
      args: [],
      chain: holesky,
      account: address,
    });

    toast({
      title: "Check-in transaction sent",
      description: "Waiting for blockchain confirmation...",
    });
  } catch (err) {
    toast({
      title: "Check-in failed",
      description: err instanceof Error ? err.message : "Blockchain error",
      variant: "destructive",
    });
    setIsCheckingIn(false);
  }
};

// When tx is confirmed → update DB
useEffect(() => {
  if (isCheckInConfirmed && checkInTxHash) {
    const saveCheckInToDB = async () => {
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          toast({ title: "Checked in 🎉", description: "Welcome to the event!" });
          setUser(prev => prev ? { ...prev, checkedIn: true } : prev);
          setUserProgress(prev => ({
            ...prev,
            checkin: { completed: true, status: "completed" },
            voting: { ...prev.voting, status: "pending" },
          }));
        } else {
          toast({
            title: "DB update failed",
            description: "Blockchain confirmed, but DB did not update",
            variant: "destructive",
          });
        }
      } catch (e) {
        console.error("DB error:", e);
      } finally {
        setIsCheckingIn(false);
      }
    };

    saveCheckInToDB();
  }
}, [isCheckInConfirmed, checkInTxHash]);

// ----------------------- CHECK-OUT -----------------------
const { writeContract: writeCheckOut, data: checkOutTxHash, isPending: isCheckOutPending } = useWriteContract();
const { isSuccess: isCheckOutConfirmed } = useWaitForTransactionReceipt({
  hash: checkOutTxHash,
  chainId: holesky.id,
});

const handleCheckOut = async () => {
  if (!token || !address) return;

  try {
    setIsCheckingOut(true);

    // 1. Call smart contract checkOut()
    writeCheckOut({
      address: checkInOutAddress[holesky.id],
      abi: checkInOutABI,
      functionName: "checkOut",
      args: [],
      chain: holesky,
      account: address,
    });

    toast({
      title: "Check-out transaction sent",
      description: "Waiting for blockchain confirmation...",
    });
  } catch (err) {
    toast({
      title: "Check-out failed",
      description: err instanceof Error ? err.message : "Blockchain error",
      variant: "destructive",
    });
    setIsCheckingOut(false);
  }
};

// When tx is confirmed → update DB
useEffect(() => {
  if (isCheckOutConfirmed && checkOutTxHash) {
    const saveCheckOutToDB = async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          toast({ title: "Checked out 👋", description: "Thanks for joining!" });
          setUserProgress(prev => ({
            ...prev,
            checkout: { completed: true, status: "completed" },
          }));
        } else {
          toast({
            title: "DB update failed",
            description: "Blockchain confirmed, but DB did not update",
            variant: "destructive",
          });
        }
      } catch (e) {
        console.error("DB error:", e);
      } finally {
        setIsCheckingOut(false);
      }
    };

    saveCheckOutToDB();
  }
}, [isCheckOutConfirmed, checkOutTxHash]);


  // Update user cake when blockchain data changes
  useEffect(() => {
    if (blockchainCake && userCake) {
      // Update local state with blockchain data
      setUserCake(prev => prev ? {
        ...prev,
        title: blockchainCake.title,
        description: blockchainCake.description,
        tableNumber: Number(blockchainCake.tableNumber),
        seatNumber: Number(blockchainCake.seatNumber),
      } : null);
    }
  }, [blockchainCake]); // Remove userCake from dependencies to prevent infinite loop

  // Handle delete transaction confirmation
  useEffect(() => {
    if (isDeleteConfirmed && deleteHash && userCake?.id) {
      console.log("Delete transaction confirmed:", deleteHash);
      toast({
        title: "Blockchain Transaction Confirmed",
        description: "Cake removed from blockchain successfully",
      });

      // Now delete from database
      const deleteFromDatabase = async () => {
        try {
          const res = await fetch(`/api/cakes/${userCake.id}`, {
            method: 'DELETE',
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          if (res.ok) {
            toast({
              title: "Cake Deleted Successfully",
              description: "Your cake has been successfully deleted from blockchain and database",
            });
            setUserCake(null);
            setUserProgress(prev => ({
              ...prev,
              cakeUpload: { completed: false, status: "pending" },
              checkin: { ...prev.checkin, status: "locked" }
            }));
          } else {
            throw new Error('Failed to delete cake from database');
          }
        } catch (error) {
          console.error('Error deleting cake from database:', error);
          toast({
            title: "Database Delete Failed",
            description: "Cake removed from blockchain but failed to delete from database",
            variant: "destructive",
          });
        } finally {
          setDeleting(false);
        }
      };

      deleteFromDatabase();
    } else if (isDeleteConfirmed && deleteHash) {
      // If blockchain transaction is confirmed but no cake ID, just update UI
      console.log("Delete transaction confirmed but no cake ID found");
      toast({
        title: "Blockchain Transaction Confirmed",
        description: "Cake removed from blockchain successfully",
      });
      setUserCake(null);
      setUserProgress(prev => ({
        ...prev,
        cakeUpload: { completed: false, status: "pending" },
        checkin: { ...prev.checkin, status: "locked" }
      }));
      setDeleting(false);
    }
  }, [isDeleteConfirmed, deleteHash, userCake?.id, token, toast]);



  // --- Original authentication check ---
  if (!isAuthenticated) return <Navigate to="/login" replace />;


  // --- ADDED: Handle Loading and Error states before rendering the dashboard ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center text-foreground">
          <Loader2 className="h-12 w-12 mx-auto animate-spin mb-4" />
          <p className="text-xl font-semibold">Recognizing you...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center text-center p-4">
        <Card className="border-destructive shadow-lg">
          <CardHeader><CardTitle className="text-destructive">An Error Occurred</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Could not load user information. Please try logging in again."}</p>
            <Link to="/login"><Button>Go to Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  const steps = [
    { id: "registration", title: "Registration & Payment", description: "Registration and payment completed successfully", icon: <CheckCircle2 className="h-6 w-6 text-green-500" />, link: "#", status: "completed" },
    {
      id: "cakeUpload",
      title: "Upload Cake Details",
      description: userProgress.cakeUpload.completed
        ? "Your cake has been successfully uploaded and assigned to a seat."
        : "Share photos, ingredients, and the story behind your cake creation",
      icon: <Upload className="h-6 w-6" />,
      link: "/upload-cake",
      status: userProgress.cakeUpload.status
    },
    {
      id: "checkin",
      title: "Event Check-in",
      description: "Check in instantly once you arrive — no page redirect",
      icon: <MapPin className="h-6 w-6" />,
      link: "/checkin",
      status: userProgress.cakeUpload.completed ? userProgress.checkin.status : "locked"
    },
    {
      id: "voting",
      title: "Start Voting",
      description: "Vote for Most Beautiful and Most Delicious cakes",
      icon: <Vote className="h-6 w-6" />,
      link: "/voting",
      status: userProgress.checkin.completed ? userProgress.voting.status : "locked"
    },
    {
      id: "checkout",
      title: "Event Check-out",
      description: "Check out instantly after voting — no redirect",
      icon: <CheckCircle className="h-6 w-6" />,
      link: "#",
      status: userProgress.voting.completed ? userProgress.checkout.status : "locked",
    },
  ];

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <span className="text-sm text-green-500">Completed</span>;
      case 'pending': return <span className="text-sm text-yellow-500">Pending</span>;
      default: return null;
    }
  };

  // --- RENDER THE DASHBOARD ---
  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header - MODIFIED to be personalized */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome, {user.firstName}!
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Your Dashboard
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete these four steps to participate in our delightful cake picnic experience
          </p>
        </div>

        {/* =========================================================== */}
        {/* [MARKER] PART 2: ADDED CARD TO DISPLAY FETCHED USER DATA  */}
        {/* =========================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="">
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
                <CardTitle>Your Account Details</CardTitle>
                <UserIcon className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="p-6 space-y-2 text-base">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline" className="font-semibold">{user.category}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Event Details */}
          {registrationEvent && (
            <div className="">
              <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
                  <CardTitle>Your Registration Event</CardTitle>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </CardHeader>
                <CardContent className="p-6 space-y-2 text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Registered Wallet:</span>
                    <span className="font-medium text-foreground">{registrationEvent.user.substring(0, 6)}...{registrationEvent.user.substring(registrationEvent.user.length - 4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Registered At:</span>
                    <span className="font-medium text-foreground">{new Date(registrationEvent.timestamp * 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <a 
                      href={`https://holesky.etherscan.io/tx/${registrationEvent.transactionHash}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {registrationEvent.transactionHash.substring(0, 6)}...{registrationEvent.transactionHash.substring(registrationEvent.transactionHash.length - 4)}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* =========================================================== */}
        {/* [MARKER] PART 3: ADDED USER CAKE DISPLAY WITH DELETE BUTTON */}
        {/* =========================================================== */}
        {userCake && (
          <div className="mb-12">
            <Card className="border-0 shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Cake className="h-6 w-6 text-primary" />
                  Your Uploaded Cake
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditForm();
                      setEditing(true);
                    }}
                    disabled={editing}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteCake}
                    disabled={deleting || isContractPending}
                    className="flex items-center gap-2"
                  >
                    {deleting || isContractPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deleting || isContractPending ? "Deleting..." : "Delete Cake"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{userCake.title}</h3>
                    <p className="text-muted-foreground mb-4">{userCake.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Table:</span>
                        <span className="font-medium">{userCake.tableNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seat:</span>
                        <span className="font-medium">{userCake.seatNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">File Type:</span>
                        <span className="font-medium">{userCake.fileType}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {userCake.imageUrl && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {userCake.fileType === 'image' ? (
                          <img
                            src={`http://localhost:5001${userCake.imageUrl}`}
                            alt={userCake.title}
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.error('Image failed to load:', userCake.imageUrl);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full">
                            <ErrorBoundary
                              modelUrl={`http://localhost:5001${userCake.imageUrl}`}
                              className="w-full h-full"
                            >
                              <ModelViewer
                                modelUrl={`http://localhost:5001${userCake.imageUrl}`}
                                className="w-full h-full"
                              />
                            </ErrorBoundary>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {userCake.story && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Cake Story</h4>
                    <p className="text-muted-foreground">{userCake.story}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Cake Dialog */}
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Cake Details</DialogTitle>
              <DialogDescription>
                Update your cake information, upload new files, and change seating position.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="story" className="text-right">
                    Story
                  </Label>
                  <Textarea
                    id="story"
                    value={editForm.story}
                    onChange={(e) => setEditForm(prev => ({ ...prev, story: e.target.value }))}
                    className="col-span-3"
                    rows={4}
                    placeholder="Tell us the story behind your cake..."
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cake Image/Model</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fileType" className="text-right">
                    File Type
                  </Label>
                  <select
                    id="fileType"
                    value={editForm.fileType}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fileType: e.target.value }))}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="image">Image (JPG, PNG)</option>
                    <option value="3d">3D Model (GLB)</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    New File
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="file"
                      type="file"
                      accept={editForm.fileType === 'image' ? 'image/*' : '.glb'}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="col-span-3"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {editForm.fileType === 'image'
                        ? 'Upload a new image (JPG, PNG)'
                        : 'Upload a new 3D model (GLB file)'
                      }
                    </p>
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Table and Seat Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Position Assignment</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tableNumber" className="text-right">
                    Table
                  </Label>
                  <select
                    id="tableNumber"
                    value={editForm.tableNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tableNumber: parseInt(e.target.value) }))}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Table {num}</option>
                    ))}
                  </select>
                </div>
                {renderSeatGrid()}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditing(false);
                setSelectedFile(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditCake} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Cake'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- ALL YOUR ORIGINAL JSX REMAINS BELOW, UNTOUCHED --- */}

        {/* Progress Overview */}
        <div className="mb-12">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-primary h-3 rounded-full transition-smooth"
                    style={{
                      width: `${(() => {
                        let completedSteps = 1; // Registration is always completed
                        if (userProgress.cakeUpload.completed) completedSteps++;
                        if (userProgress.checkin.completed) completedSteps++;
                        if (userProgress.voting.completed) completedSteps++;
                        if (userProgress.checkout.completed) completedSteps++;
                        return `${(completedSteps / 5) * 100}%`;
                      })()}`
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-center text-muted-foreground mt-2">
                {(() => {
                  let completedSteps = 1; // Registration is always completed
                  if (userProgress.cakeUpload.completed) completedSteps++;
                  if (userProgress.checkin.completed) completedSteps++;
                  if (userProgress.voting.completed) completedSteps++;
                  if (userProgress.checkout.completed) completedSteps++;
                  return `${completedSteps} of 5`;
                })()} steps completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <Card key={step.id} className={`border-0 shadow-soft hover:shadow-cake transition-smooth ${step.status === "locked" ? "opacity-60" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${step.status === "completed" ? "bg-green-100" : step.status === "pending" ? "bg-yellow-100" : "bg-muted"}`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">{getStatusIcon(step.status)}{getStatusBadge(step.status)}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">{index + 1}</div>
                </div>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <Button
                  variant={step.status === "pending" ? "cake" : "soft"}
                  className={`w-full ${step.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700" : ""}`}
                  disabled={step.status === "locked"}
                  onClick={() => {
                    if (step.status !== 'pending') return;
                    if (step.id === 'checkin') {
                      handleCheckIn();
                    } else if (step.id === 'checkout') {
                      handleCheckOut();
                    }
                  }}
                  asChild={step.status === "pending" && (step.id === 'cakeUpload' || step.id === 'voting')}
                >
                  {step.status === "completed" ? (
                    step.id === "registration" ? (
                      <span>🍰 Registered & Paid Successfully 🎉</span>
                    ) : step.id === "cakeUpload" ? (
                      <span>🍰 Cake Uploaded Successfully 🎉</span>
                    ) : step.id === "checkin" ? (
                      <span>✅ Checked In Successfully 🎉</span>
                    ) : step.id === "voting" ? (
                      <span>🗳️ Voting Completed 🎉</span>
                    ) : step.id === 'checkout' ? (
                      <span>👋 Checked Out 🎉</span>
                    ) : (
                      <span>Completed</span>
                    )
                  ) : step.status === "pending" ? (
                    step.id === 'cakeUpload' || step.id === 'voting' ? (
                      <Link to={step.link}>Start Now</Link>
                    ) : (
                      <span>{step.id === 'checkin' ? (isCheckingIn ? 'Checking in...' : 'Start') : step.id === 'checkout' ? (isCheckingOut ? 'Checking out...' : 'Start') : 'Start'}</span>
                    )
                  ) : (
                    <span>Complete Previous Step</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          {/* ... original help section ... */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
