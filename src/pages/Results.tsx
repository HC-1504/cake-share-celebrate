import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ModelViewer from '@/components/ModelViewer';

interface Cake {
  id: number;
  title: string;
  description: string;
  story?: string;
  imageUrl: string;
  fileType: 'image' | 'model';
  tableNumber: number;
  seatNumber: number;
  User?: {
    firstName: string;
    lastName: string;
  };
  votes?: {
    beautiful: number;
    delicious: number;
  };
  voters?: {
    beautiful: string[];
    delicious: string[];
  };
}

interface VotingResults {
  beautiful: Cake[];
  delicious: Cake[];
  totalVotes: {
    beautiful: number;
    delicious: number;
  };
}

export default function Results() {
  const [results, setResults] = useState<VotingResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/voting/results');
      if (!response.ok) {
        throw new Error('Failed to fetch voting results');
      }
      const data = await response.json();
      console.log('Voting results data:', data); // Debug log
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading voting results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchResults}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No voting results available yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCakeCard = (cake: Cake, rank: number, category: 'beautiful' | 'delicious') => (
    <Card key={`${category}-${cake.id}`} className={`relative transition-all hover:shadow-lg ${rank === 1 ? 'ring-2 ring-yellow-400 shadow-lg bg-yellow-50' : 'hover:shadow-md'}`}>
      {rank === 1 && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-yellow-500 text-yellow-900 px-3 py-1 text-sm font-bold shadow-md">
            🏆 WINNER
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            {getRankIcon(rank)}
            <span>{cake.title}</span>
          </div>
          <Badge className={getRankBadgeColor(rank)}>
            {cake.votes?.[category] || 0} votes
          </Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Table {cake.tableNumber} · Seat {cake.seatNumber}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Smaller Image */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-48 mx-auto">
              {cake.fileType === 'image' ? (
                <img
                  src={`http://localhost:5001${cake.imageUrl}`}
                  alt={cake.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ErrorBoundary modelUrl={`http://localhost:5001${cake.imageUrl}`} className="w-full h-full">
                  <ModelViewer modelUrl={`http://localhost:5001${cake.imageUrl}`} className="w-full h-full" />
                </ErrorBoundary>
              )}
            </div>
          </div>

          {/* Cake Details */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Created by</p>
              <p className="font-medium">
                {cake.User ? `${cake.User.firstName} ${cake.User.lastName}` : 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{cake.description}</p>
            </div>

            {cake.story && (
              <div>
                <p className="text-sm text-muted-foreground">Story</p>
                <p className="text-sm bg-muted p-2 rounded">{cake.story}</p>
              </div>
            )}
          </div>

          {/* Voter Evidence */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                🗳️ Voters ({category === 'beautiful' ? cake.votes?.beautiful || 0 : cake.votes?.delicious || 0})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cake.voters && cake.voters[category] && cake.voters[category].length > 0 ? (
                  cake.voters[category].map((address, index) => (
                    <div key={index} className="text-xs font-mono bg-white p-1 rounded border">
                      <a
                        href={`https://holesky.etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No voters yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🏆 Voting Results</h1>
        <p className="text-lg text-muted-foreground">
          See which cakes are winning in each category!
        </p>
      </div>

      {/* Results Sections */}
      <div className="space-y-16">
        {/* Most Beautiful Results */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-8">
            <Trophy className="w-10 h-10 text-pink-500" />
            <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Most Beautiful Cakes
            </h2>
          </div>

          {results.beautiful.length > 0 ? (
            <div className="space-y-8">
              {results.beautiful.map((cake, index) => renderCakeCard(cake, index + 1, 'beautiful'))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">No votes for beautiful cakes yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Be the first to vote!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Most Delicious Results */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-8">
            <Award className="w-10 h-10 text-orange-500" />
            <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Most Delicious Cakes
            </h2>
          </div>

          {results.delicious.length > 0 ? (
            <div className="space-y-8">
              {results.delicious.map((cake, index) => renderCakeCard(cake, index + 1, 'delicious'))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">No votes for delicious cakes yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Be the first to vote!</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>


    </div>
  );
}
