import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/App";
import { Navigate } from "react-router-dom";
import ModelViewer from "@/components/ModelViewer";
import ErrorBoundary from "@/components/ErrorBoundary";
import VotingHistory from "@/components/VotingHistory";
import ContractTest from "@/components/ContractTest";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { cakeVotingABI, cakeVotingAddress } from '@/config/contracts';
import { holesky } from 'wagmi/chains';
import { useToast } from '@/hooks/use-toast';

interface CakeDTO {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  fileType: string; // 'image' | '3d'
  tableNumber: number;
  seatNumber: number;
  story: string;
  User?: { firstName: string; lastName: string };
}

const Voting = () => {
  const { isAuthenticated, token } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const { address } = useAccount();
  const { toast } = useToast();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [cakes, setCakes] = useState<CakeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingCategory, setVotingCategory] = useState<'beautiful' | 'delicious'>('beautiful');
  const [votingStatus, setVotingStatus] = useState<{ beautiful: boolean; delicious: boolean }>({ beautiful: false, delicious: false });
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [pageReloading, setPageReloading] = useState(false);

  // Smart contract hooks
  const { writeContractAsync, isPending: isWritingContract } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}`,
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [cakesRes, statusRes] = await Promise.all([
          fetch('/api/cakes/public'),
          fetch('/api/votes/my-status', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!cakesRes.ok) throw new Error('Failed to load cakes');
        const cakesJson = await cakesRes.json();
        setCakes(cakesJson);
        if (statusRes.ok) {
          setVotingStatus(await statusRes.json());
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  // Handle transaction confirmation and update database
  useEffect(() => {
    if (isConfirmed && pendingTxHash && submittingId) {
      const updateDatabase = async () => {
        try {
          const res = await fetch('/api/vote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              cakeId: submittingId,
              category: votingCategory,
              txHash: pendingTxHash,
              voterAddress: address
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to record vote in database');

          // Update local state
          const updated = { ...votingStatus, [votingCategory]: true };
          setVotingStatus(updated);

          toast({
            title: 'Vote Recorded!',
            description: `Your vote for "${votingCategory}" has been recorded on blockchain and database. Page will refresh to show updated status.`,
          });

          // Reload page after successful vote to show updated status
          setPageReloading(true);
          setTimeout(() => {
            window.location.reload();
          }, 2000); // 2 second delay to let user see the success message

        } catch (e: any) {
          toast({
            title: 'Database Error',
            description: `Blockchain vote succeeded but database update failed: ${e.message}. Page will refresh to show blockchain status.`,
            variant: 'destructive'
          });

          // Still reload to show blockchain status even if database failed
          setPageReloading(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } finally {
          setSubmittingId(null);
          setPendingTxHash(null);
        }
      };

      updateDatabase();
    }
  }, [isConfirmed, pendingTxHash, submittingId, votingCategory, votingStatus, token, address, toast]);

  // Check if user has already voted for this category on the blockchain
  const { data: hasVotedOnChain, isLoading: isCheckingBlockchain } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, votingCategory] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  const canVote = useMemo(() => !votingStatus[votingCategory], [votingCategory, votingStatus]);

  // Update blockchain loading state
  useEffect(() => {
    if (address) {
      setBlockchainLoading(isCheckingBlockchain);
    } else {
      setBlockchainLoading(false);
    }
  }, [address, isCheckingBlockchain]);

  // Check voting status for both categories
  const { data: hasVotedBeautiful } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'beautiful'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  const { data: hasVotedDelicious } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'delicious'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  const handleVote = async (cakeId: number) => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to vote.',
        variant: 'destructive'
      });
      return;
    }

    // Check if user is on the correct network
    if (chainId !== holesky.id) {
      try {
        await switchChain({ chainId: holesky.id });
      } catch (e: any) {
        toast({
          title: 'Wrong Network',
          description: `Please switch to Holesky Testnet to vote. Current network: ${chainId}`,
          variant: 'destructive'
        });
        return;
      }
    }

    // Check if user has already voted on the blockchain
    if (hasVotedOnChain) {
      toast({
        title: 'Already Voted on Blockchain',
        description: `You have already voted for "${votingCategory}" category. Try voting for the other category or use a different wallet.`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmittingId(cakeId);
      setError(null);

      console.log('🗳️ Starting vote process:', {
        cakeId,
        votingCategory,
        address,
        contractAddress: cakeVotingAddress[holesky.id],
        chainId: holesky.id
      });

      toast({
        title: 'Initiating Vote',
        description: `Submitting your vote for "${votingCategory}" to the blockchain...`,
      });

      // Call smart contract vote function
      const hash = await writeContractAsync({
        address: cakeVotingAddress[holesky.id],
        abi: cakeVotingABI,
        functionName: 'vote',
        args: [BigInt(cakeId), votingCategory],
        chain: holesky,
        account: address,
      });

      console.log('✅ Transaction submitted:', hash);
      setPendingTxHash(hash);

      toast({
        title: 'Transaction Submitted',
        description: `Transaction hash: ${hash.slice(0, 10)}...${hash.slice(-8)}. Waiting for confirmation...`,
      });

    } catch (e: any) {
      console.error('❌ Voting error:', e);
      console.error('Error details:', {
        message: e.message,
        code: e.code,
        data: e.data,
        cause: e.cause
      });

      let errorMessage = 'Failed to submit vote to blockchain.';

      // Handle specific error types
      if (e.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (e.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else if (e.message?.includes('execution reverted')) {
        errorMessage = 'Smart contract rejected the transaction. You may have already voted in this category.';
      } else if (e.code === 4001) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (e.code === -32603) {
        errorMessage = 'Internal JSON-RPC error. Please try again.';
      }

      setError(errorMessage);
      setSubmittingId(null);
      toast({
        title: 'Vote Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="text-foreground">Loading cakes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="text-red-600 font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-3xl font-bold text-center text-foreground mb-8">Start Voting</h2>

        {/* MetaMask Loading Indicator */}
        {blockchainLoading && address && !pageReloading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-blue-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
              <span className="text-sm font-medium">🦊 Loading MetaMask data...</span>
            </div>
          </div>
        )}

        {/* Page Reloading Indicator */}
        {pageReloading && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-green-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
              <span className="text-sm font-medium">✅ Vote successful! Refreshing page to show updated status...</span>
            </div>
          </div>
        )}

        {/* Contract Debug Info - Hidden for presentation */}
        {/* <ContractTest /> */}

        {/* Voting Instructions */}
        {address && (hasVotedBeautiful || hasVotedDelicious) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-xl">💡</div>
              <div>
                <h3 className="font-medium text-yellow-800 mb-2">Voting Status & Instructions</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  {hasVotedBeautiful && hasVotedDelicious ? (
                    <p>🎉 You've completed voting in both categories! To test more votes, connect a different wallet address.</p>
                  ) : hasVotedBeautiful ? (
                    <p>✅ You've voted for "Beautiful" category. You can still vote for "Delicious" category!</p>
                  ) : hasVotedDelicious ? (
                    <p>✅ You've voted for "Delicious" category. You can still vote for "Beautiful" category!</p>
                  ) : null}
                  <p className="text-xs mt-2 text-yellow-600">
                    The smart contract prevents duplicate votes per category to ensure fair voting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Address Display */}
        {address && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Your Voting Address (Blockchain Evidence)</p>
              <p className="text-lg font-mono text-blue-800 break-all">{address}</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <p className="text-xs text-blue-500">All votes will be recorded on the blockchain with this address as proof</p>
                <div className={`text-xs px-2 py-1 rounded ${chainId === holesky.id ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {chainId === holesky.id ? '✅ Holesky Network' : `❌ Wrong Network (${chainId})`}
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={votingCategory} onValueChange={(v) => setVotingCategory(v as any)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="beautiful">Most Beautiful</TabsTrigger>
              <TabsTrigger value="delicious">Most Delicious</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              <div>Database: {votingStatus.beautiful ? 'Beautiful: Voted' : 'Beautiful: Pending'} · {votingStatus.delicious ? 'Delicious: Voted' : 'Delicious: Pending'}</div>
              {address && (
                <div className="space-y-1">
                  <div className={hasVotedBeautiful ? 'text-orange-600' : 'text-green-600'}>
                    Blockchain Beautiful: {hasVotedBeautiful ? '✅ Already Voted' : '🗳️ Can Vote'}
                  </div>
                  <div className={hasVotedDelicious ? 'text-orange-600' : 'text-green-600'}>
                    Blockchain Delicious: {hasVotedDelicious ? '✅ Already Voted' : '🗳️ Can Vote'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(['beautiful', 'delicious'] as const).map((cat) => (
            <TabsContent key={cat} value={cat} className="space-y-6">
              {cakes.map((cake) => (
                <Card key={`${cat}-${cake.id}`} className="border-0 shadow-cake">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{cake.title}</span>
                      <span className="text-sm text-muted-foreground">
                        Table {cake.tableNumber} · Seat {cake.seatNumber}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-xs mx-auto">
                          {cake.fileType === 'image' ? (
                            <img src={`http://localhost:5001${cake.imageUrl}`} alt={cake.title} className="w-full h-full object-cover" />
                          ) : (
                            <ErrorBoundary modelUrl={`http://localhost:5001${cake.imageUrl}`} className="w-full h-full">
                              <ModelViewer modelUrl={`http://localhost:5001${cake.imageUrl}`} className="w-full h-full" />
                            </ErrorBoundary>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-3">
                        <div className="text-muted-foreground">by {cake.User ? `${cake.User.firstName} ${cake.User.lastName}` : 'Unknown'}</div>
                        <div>{cake.description}</div>
                        {cake.story && (
                          <div className="p-3 bg-muted rounded-md"><span className="font-semibold">Story: </span>{cake.story}</div>
                        )}
                        <div className="mt-2">
                          {(() => {
                            const hasVotedBlockchain = cat === 'beautiful' ? hasVotedBeautiful : hasVotedDelicious;
                            const isDisabled = votingStatus[cat] || hasVotedBlockchain || submittingId === cake.id || isWritingContract || isConfirming;

                            return (
                              <Button
                                variant={votingStatus[cat] || hasVotedBlockchain ? 'soft' : 'cake'}
                                disabled={isDisabled}
                                onClick={() => handleVote(cake.id)}
                              >
                                {hasVotedBlockchain
                                  ? '✅ Already Voted on Blockchain'
                                  : votingStatus[cat]
                                  ? '✅ Already Voted in Database'
                                  : submittingId === cake.id
                                  ? isWritingContract
                                    ? (
                                      <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        🦊 Sending to MetaMask...
                                      </span>
                                    )
                                    : isConfirming
                                    ? (
                                      <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ⛓️ Confirming on Blockchain...
                                      </span>
                                    )
                                    : (
                                      <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        💾 Updating Database...
                                      </span>
                                    )
                                  : cat === 'beautiful'
                                  ? '🗳️ Vote Most Beautiful'
                                  : '🗳️ Vote Most Delicious'}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Voting History Section */}
        <div className="mt-12">
          <VotingHistory />
        </div>
      </div>
    </div>
  );
};

export default Voting;