import { useAccount, useReadContract, useSimulateContract } from 'wagmi';
import { cakeVotingABI, cakeVotingAddress } from '@/config/contracts';
import { holesky } from 'wagmi/chains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuth } from '@/App';

const ContractTest = () => {
  const { address } = useAccount();
  const { token } = useAuth();
  const [databaseVotes, setDatabaseVotes] = useState<any[]>([]);
  const [votingStatus, setVotingStatus] = useState<{ beautiful: boolean; delicious: boolean }>({ beautiful: false, delicious: false });
  const [testAddress, setTestAddress] = useState<string>('');

  // Fetch database voting status and vote details
  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      if (!token) return;

      try {
        // Get voting status
        const statusRes = await fetch('/api/votes/my-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statusRes.ok) {
          setVotingStatus(await statusRes.json());
        }

        // Get vote details
        const detailsRes = await fetch('/api/votes/my-details', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detailsRes.ok) {
          setDatabaseVotes(await detailsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch database info:', error);
      }
    };

    fetchDatabaseInfo();
  }, [token]);

  // Test reading from the contract to verify it exists
  const { data: owner, error: ownerError, isLoading: ownerLoading } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'owner',
    chainId: holesky.id,
  });

  // Test reading hasVotedInCategory function
  const { data: hasVoted, error: hasVotedError, isLoading: hasVotedLoading } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'beautiful'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  // Test reading hasVotedInCategory for delicious
  const { data: hasVotedDelicious, error: hasVotedDeliciousError, isLoading: hasVotedDeliciousLoading } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: address ? [address, 'delicious'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!address,
    },
  });

  // Test blockchain status for addresses that voted in database
  const { data: testAddressBeautiful } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: testAddress ? [testAddress as `0x${string}`, 'beautiful'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!testAddress && testAddress.length === 42,
    },
  });

  const { data: testAddressDelicious } = useReadContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'hasVotedInCategory',
    args: testAddress ? [testAddress as `0x${string}`, 'delicious'] : undefined,
    chainId: holesky.id,
    query: {
      enabled: !!testAddress && testAddress.length === 42,
    },
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔧 Contract Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Contract Address:</p>
          <p className="font-mono text-xs bg-muted p-2 rounded break-all">
            {cakeVotingAddress[holesky.id]}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Contract Owner:</p>
          {ownerLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : ownerError ? (
            <p className="text-xs text-red-600">Error: {ownerError.message}</p>
          ) : (
            <p className="font-mono text-xs bg-muted p-2 rounded break-all">
              {owner as string}
            </p>
          )}
        </div>

        {/* Database vs Blockchain Status Comparison */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
          <p className="text-sm font-medium text-yellow-800">🔍 Database vs Blockchain Status</p>
          <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
            <div>
              <p className="font-medium">Database Status:</p>
              <p className={votingStatus.beautiful ? 'text-orange-600' : 'text-green-600'}>
                Beautiful: {votingStatus.beautiful ? '✅ Voted' : '❌ Not Voted'}
              </p>
              <p className={votingStatus.delicious ? 'text-orange-600' : 'text-green-600'}>
                Delicious: {votingStatus.delicious ? '✅ Voted' : '❌ Not Voted'}
              </p>
            </div>
            <div>
              <p className="font-medium">Current Wallet Blockchain:</p>
              <p className={hasVoted ? 'text-orange-600' : 'text-green-600'}>
                Beautiful: {hasVoted ? '✅ Voted' : '❌ Not Voted'}
              </p>
              <p className={hasVotedDelicious ? 'text-orange-600' : 'text-green-600'}>
                Delicious: {hasVotedDelicious ? '✅ Voted' : '❌ Not Voted'}
              </p>
            </div>
          </div>
        </div>

        {/* Database Vote Details */}
        {databaseVotes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="text-sm font-medium text-blue-800">📊 Your Database Vote Records</p>
            <div className="mt-2 space-y-2">
              {databaseVotes.map((vote, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <p><strong>Category:</strong> {vote.category}</p>
                  <p><strong>Cake:</strong> {vote.cake.title} (by {vote.cake.owner})</p>
                  <p><strong>Voter Address:</strong>
                    <span className="font-mono text-xs break-all ml-1">{vote.voterAddress}</span>
                  </p>
                  <p><strong>TX Hash:</strong>
                    <span className="font-mono text-xs break-all ml-1">{vote.txHash}</span>
                  </p>
                  <p><strong>Date:</strong> {new Date(vote.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-green-600">
              ✅ Votes have been reset! You can now vote fresh with the same wallet.
            </div>
          </div>
        )}

        {/* Current Wallet Info */}
        {address && (
          <div className="bg-gray-50 border border-gray-200 p-3 rounded">
            <p className="text-sm font-medium text-gray-800">🔗 Currently Connected Wallet</p>
            <p className="font-mono text-xs break-all mt-1">{address}</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs font-medium">Beautiful Category:</p>
                {hasVotedLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : hasVotedError ? (
                  <p className="text-xs text-red-600">Error: {hasVotedError.message}</p>
                ) : (
                  <p className={`text-xs ${hasVoted ? 'text-orange-600' : 'text-green-600'}`}>
                    {hasVoted ? '✅ Already Voted' : '🗳️ Can Vote'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium">Delicious Category:</p>
                {hasVotedDeliciousLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : hasVotedDeliciousError ? (
                  <p className="text-xs text-red-600">Error: {hasVotedDeliciousError.message}</p>
                ) : (
                  <p className={`text-xs ${hasVotedDelicious ? 'text-orange-600' : 'text-green-600'}`}>
                    {hasVotedDelicious ? '✅ Already Voted' : '🗳️ Can Vote'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Address Testing Tool */}
        <div className="bg-purple-50 border border-purple-200 p-3 rounded">
          <p className="text-sm font-medium text-purple-800">🧪 Test Specific Address</p>
          <p className="text-xs text-purple-600 mb-2">Check if a specific wallet address has voted on the blockchain:</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              className="w-full text-xs font-mono p-2 border rounded"
            />
            {testAddress && testAddress.length === 42 && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium">Beautiful:</p>
                  <p className={testAddressBeautiful ? 'text-orange-600' : 'text-green-600'}>
                    {testAddressBeautiful ? '✅ Voted' : '❌ Not Voted'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Delicious:</p>
                  <p className={testAddressDelicious ? 'text-orange-600' : 'text-green-600'}>
                    {testAddressDelicious ? '✅ Voted' : '❌ Not Voted'}
                  </p>
                </div>
              </div>
            )}
            {databaseVotes.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-purple-700">Quick Test - Database Addresses:</p>
                <div className="space-y-1">
                  {[...new Set(databaseVotes.map(v => v.voterAddress))].map((addr, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => setTestAddress(addr)}
                      className="text-xs h-6 px-2"
                    >
                      Test {addr.slice(0, 6)}...{addr.slice(-4)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Network and Deployment Status */}
        <div className="bg-red-50 border border-red-200 p-3 rounded">
          <p className="text-sm font-medium text-red-800">🚨 Contract Deployment Issue</p>
          <div className="text-xs text-red-700 mt-2 space-y-1">
            <p><strong>Problem:</strong> The contract at {cakeVotingAddress[holesky.id]} doesn't exist on Holesky testnet.</p>
            <p><strong>Likely Cause:</strong> Contract was deployed to Remix VM (local) instead of Holesky testnet.</p>
            <p><strong>Solution:</strong> Deploy the contract to Holesky testnet using "Injected Provider - MetaMask" in Remix.</p>
            <p><strong>Steps:</strong></p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>In Remix, select "Injected Provider - MetaMask" (not Remix VM)</li>
              <li>Make sure MetaMask shows "Holesky" network</li>
              <li>Deploy the CakeVoting contract</li>
              <li>Update the contract address in config</li>
            </ol>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Contract Address: {cakeVotingAddress[holesky.id]}</p>
          <p>Chain ID: {holesky.id} (Holesky Testnet)</p>
          <p>Current Wallet: {address || 'Not connected'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractTest;
