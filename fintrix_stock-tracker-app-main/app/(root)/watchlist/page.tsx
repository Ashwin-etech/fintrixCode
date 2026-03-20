"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Star, Activity } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import SearchCommand from '@/components/SearchCommand';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { WatchlistTable } from '@/components/WatchlistTable';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [initialStocks, setInitialStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parallel API calls for better performance
      const [watchlistData, stocksData] = await Promise.all([
        getWatchlistWithData(),
        searchStocks()
      ]);

      setWatchlist(watchlistData);
      setInitialStocks(stocksData);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      setError("Failed to load watchlist data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize empty state check to prevent unnecessary re-renders
  const isEmpty = useMemo(() => watchlist.length === 0, [watchlist.length]);

  // Memoize loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading watchlist data...</p>
      </div>
    </div>
  ), []);

  // Memoize error component
  const ErrorComponent = useMemo(() => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <Activity className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Watchlist</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  ), [error]);

  // Memoize empty state component
  const EmptyStateComponent = useMemo(() => (
    <section className="flex watchlist-empty-container">
      <div className="watchlist-empty">
        <Star className="watchlist-star" />
        <h2 className="empty-title">Your watchlist is empty</h2>
        <p className="empty-description">
          Start building your watchlist by searching for stocks and clicking the star icon to add them.
        </p>
      </div>
      <SearchCommand initialStocks={initialStocks} />
    </section>
  ), [initialStocks]);

  if (isLoading) return LoadingComponent;
  if (error) return ErrorComponent;
  if (isEmpty) return EmptyStateComponent;

  return (
    <section className="watchlist">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">Watchlist</h2>
          <SearchCommand initialStocks={initialStocks} />
        </div>
        <WatchlistTable watchlist={watchlist} />
      </div>
    </section>
  );
};

export default Watchlist;


