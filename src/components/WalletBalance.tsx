import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Coins, TrendingUp } from 'lucide-react';

interface ExchangeRates {
  ETH: number;
  MYR: number;
  USD: number;
}

const WalletBalance = () => {
  const { address } = useAccount();
  const { data: balance, isLoading } = useBalance({ address });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    ETH: 1,
    MYR: 0,
    USD: 0
  });
  const [loadingRates, setLoadingRates] = useState(true);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoadingRates(true);
        
        // Fetch ETH to USD rate
        const ethUsdResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,myr');
        if (ethUsdResponse.ok) {
          const ethData = await ethUsdResponse.json();
          const ethUsdRate = ethData.ethereum.usd;
          const ethMyrRate = ethData.ethereum.myr;
          
          setExchangeRates({
            ETH: 1,
            USD: ethUsdRate,
            MYR: ethMyrRate
          });
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Fallback rates (approximate)
        setExchangeRates({
          ETH: 1,
          USD: 3000, // Approximate ETH price
          MYR: 14000  // Approximate MYR rate
        });
      } finally {
        setLoadingRates(false);
      }
    };

    if (address) {
      fetchExchangeRates();
    }
  }, [address]);

  if (!address) {
    return null;
  }

  const ethBalance = balance ? parseFloat(formatEther(balance.value)) : 0;
  const usdBalance = ethBalance * exchangeRates.USD;
  const myrBalance = ethBalance * exchangeRates.MYR;

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'ETH') {
      return `${value.toFixed(4)} ETH`;
    } else if (currency === 'USD') {
      return `$${value.toFixed(2)}`;
    } else if (currency === 'MYR') {
      return `RM ${value.toFixed(2)}`;
    }
    return value.toFixed(2);
  };

  return (
    <Card className="w-full border-0 shadow-cake">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Wallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || loadingRates ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {/* ETH Balance */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-800">ETH</span>
              </div>
              <span className="font-bold text-orange-900">
                {formatCurrency(ethBalance, 'ETH')}
              </span>
            </div>

            {/* USD Balance */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">USD</span>
              </div>
              <span className="font-bold text-green-900">
                {formatCurrency(usdBalance, 'USD')}
              </span>
            </div>

            {/* MYR Balance */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">MYR</span>
              </div>
              <span className="font-bold text-blue-900">
                {formatCurrency(myrBalance, 'MYR')}
              </span>
            </div>

            {/* Exchange Rate Info */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-gray-200">
              <p>1 ETH ≈ ${exchangeRates.USD.toFixed(2)} ≈ RM {exchangeRates.MYR.toFixed(2)}</p>
              <p className="mt-1">Rates from CoinGecko API</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
