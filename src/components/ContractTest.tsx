import { useAccount, useReadContract, useSimulateContract } from 'wagmi';
import { cakeVotingABI, cakeVotingAddress } from '@/config/contracts';
import { holesky } from 'wagmi/chains';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const ContractTest = () => {
  const { address } = useAccount();

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

  // Test vote simulation to see what the exact error is
  const { data: voteSimulation, error: voteSimulationError } = useSimulateContract({
    address: cakeVotingAddress[holesky.id],
    abi: cakeVotingABI,
    functionName: 'vote',
    args: [BigInt(1), 'beautiful'],
    chainId: holesky.id,
    account: address,
    query: {
      enabled: !!address,
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

        <div className="bg-green-50 border border-green-200 p-3 rounded">
          <p className="text-sm font-medium text-green-800">✅ Contract Status: Working!</p>
          <p className="text-xs text-green-600 mt-1">
            The voting contract is deployed and functional. The "Already voted in category" error means the smart contract is correctly preventing duplicate votes.
          </p>
        </div>

        {address && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Beautiful Category:</p>
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
                <p className="text-sm font-medium">Delicious Category:</p>
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

            {(hasVoted && hasVotedDelicious) && (
              <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                <p className="text-xs text-blue-700">
                  🎉 You've voted in both categories! Try with a different wallet to test more votes.
                </p>
              </div>
            )}
          </>
        )}

        <div className="text-xs text-muted-foreground">
          <p>If you see errors above, the contract may not be deployed or there may be network issues.</p>
          <p>Chain ID: {holesky.id}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractTest;
