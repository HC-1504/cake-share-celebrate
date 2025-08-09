import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/App";
import { ExternalLink, CheckCircle } from "lucide-react";

interface VoteDetail {
  category: string;
  txHash: string;
  voterAddress: string;
  timestamp: string;
  cake: {
    id: number;
    title: string;
    owner: string;
  };
}

const VotingHistory = () => {
  const { token } = useAuth();
  const [votes, setVotes] = useState<VoteDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVotingHistory = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const res = await fetch('/api/votes/my-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setVotes(data);
        } else {
          throw new Error('Failed to fetch voting history');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load voting history');
      } finally {
        setLoading(false);
      }
    };

    fetchVotingHistory();
  }, [token]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Your Voting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading voting history...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Your Voting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Your Voting History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {votes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No votes recorded yet. Start voting to see your blockchain evidence here!
          </div>
        ) : (
          <div className="space-y-4">
            {votes.map((vote, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={vote.category === 'beautiful' ? 'default' : 'secondary'}>
                      {vote.category === 'beautiful' ? 'Most Beautiful' : 'Most Delicious'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      for "{vote.cake.title}" by {vote.cake.owner}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(vote.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Voter Address (Blockchain Evidence)</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                      {vote.voterAddress}
                    </p>
                  </div>
                  
                  {vote.txHash && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm bg-muted p-2 rounded break-all flex-1">
                          {vote.txHash}
                        </p>
                        <a
                          href={`https://holesky.etherscan.io/tx/${vote.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Etherscan
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VotingHistory;
