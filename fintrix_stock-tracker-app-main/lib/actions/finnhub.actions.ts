'use server';

import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getWatchlistSymbolsByEmail } from './watchlist.actions';
import { cache } from 'react';
import { fetchJSONWithCache, batchRequests, apiCache } from '@/lib/cache';
import { POPULAR_STOCK_SYMBOLS } from '../constants';
import { formatPrice } from '@/lib/utils';
import { formatChangePercent } from '@/lib/utils';
import { formatMarketCapValue } from '@/lib/utils';
import { createMockStockDetails } from '@/lib/mock-data';


export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) redirect('/sign-in');

      const userWatchlistSymbols = await getWatchlistSymbolsByEmail(
        session.user.email
      );

      const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
      if (!token) {
        console.error(
          'Error in stock search:',
          new Error('FINNHUB API key is not configured')
        );
        return [];
      }

      const trimmed = typeof query === 'string' ? query.trim() : '';

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles with batch requests
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profileRequests = top.map((sym) => ({
          key: `profile2-${sym}`,
          fetcher: async () => {
            const url = `${process.env.FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            return fetchJSONWithCache<any>(url, { revalidate: 3600, cacheKey: `profile2-${sym}` });
          },
          ttl: 3600000 // 1 hour
        }));

        const profiles = await batchRequests(profileRequests);

        results = profiles
          .map((profile, index) => {
            const sym = top[index];
            if (!profile) return undefined;

            const symbol = sym.toUpperCase();
            const name: string | undefined = profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;

            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: 'Common Stock',
            };
            (r as any).__exchange = exchange;
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const cacheKey = `search-${trimmed}`;
        const data = await fetchJSONWithCache<FinnhubSearchResponse>(
          `${process.env.FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`,
          { revalidate: 1800, cacheKey }
        );
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || '').toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as any).__exchange as string | undefined;
          const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
          const type = r.type || 'Stock';
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: userWatchlistSymbols.includes(r.symbol.toUpperCase()),
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error('Error in stock search:', err);
      return [];
    }
  }
);

// Fetch stock details by symbol with optimized caching
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    // Check if API key is available
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }

    // Batch all requests for better performance
    const [quote, profile, financials] = await Promise.all([
      fetchJSONWithCache<QuoteData>(
        `${process.env.FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${token}`,
        { revalidate: 60, cacheKey: `quote-${cleanSymbol}` }
      ),
      fetchJSONWithCache<ProfileData>(
        `${process.env.FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${token}`,
        { revalidate: 3600, cacheKey: `profile2-${cleanSymbol}` }
      ),
      fetchJSONWithCache<FinancialsData>(
        `${process.env.FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${token}`,
        { revalidate: 1800, cacheKey: `metric-${cleanSymbol}` }
      ),
    ]);

    // Type cast the responses
    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    // Check if we got valid quote and profile data
    if (!quoteData?.c || !profileData?.name) {
      throw new Error(`Invalid stock data received from API for ${cleanSymbol}`);
    }

    const changePercent = quoteData.dp || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || null;

    return {
      symbol: cleanSymbol,
      company: profileData?.name,
      currentPrice: quoteData.c,
      changePercent,
      priceFormatted: formatPrice(quoteData.c),
      changeFormatted: formatChangePercent(changePercent),
      peRatio: peRatio?.toFixed(1) || '—',
      marketCapFormatted: formatMarketCapValue(
        profileData?.marketCapitalization || 0
      ),
    };
  } catch (error) {
    console.error(`Error fetching details for ${cleanSymbol}:`, error);

    // Check if we should use mock data (development or API issues)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isApiError = error instanceof Error && (
      error.message.includes('API access forbidden') ||
      error.message.includes('API authentication failed') ||
      error.message.includes('API rate limit exceeded') ||
      error.message.includes('Unable to connect to market data')
    );

    if (isDevelopment || isApiError) {
      console.warn(`Using mock data for ${cleanSymbol} due to API error or development mode`);
      try {
        return createMockStockDetails(cleanSymbol);
      } catch (mockError) {
        console.error('Mock data fallback failed:', mockError);
      }
    }

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('FINNHUB API key')) {
        throw new Error('Market data service is not configured. Please contact support.');
      }
      if (error.message.includes('API access forbidden')) {
        throw new Error('Market data access restricted. Please try again later or contact support.');
      }
      if (error.message.includes('API authentication failed')) {
        throw new Error('Market data authentication failed. Please contact support.');
      }
      if (error.message.includes('API rate limit exceeded')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (error.message.includes('Data not found')) {
        throw new Error(`No data available for stock symbol "${cleanSymbol}".`);
      }
      if (error.message.includes('Unable to connect to market data')) {
        throw new Error('Cannot connect to market data service. Please check your connection and try again.');
      }
      if (error.message.includes('Invalid stock data')) {
        throw new Error(`Invalid data received for "${cleanSymbol}". The symbol may not be available.`);
      }
    }

    throw new Error(`Unable to load stock data for ${cleanSymbol}. Please try again later.`);
  }
});

export const getFinnhubQuote = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }

    const quoteData = await fetchJSONWithCache<QuoteData>(
      `${process.env.FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${token}`,
      { revalidate: 60, cacheKey: `quote-${cleanSymbol}` } // Real-time: 1 minute
    );

    if (!quoteData) {
      throw new Error('No quote data received');
    }

    return quoteData;
  } catch (error) {
    console.error(`Error fetching quote for ${cleanSymbol}:`, error);
    throw new Error(`Failed to fetch quote for ${cleanSymbol}`);
  }
});

export const getNews = cache(async (symbols?: string[]): Promise<MarketNewsArticle[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return [];

    const cacheKey = symbols ? `news-${symbols.join(',')}` : 'news-general';

    // Finnhub "general" market news
    const articles = await fetchJSONWithCache<MarketNewsArticle[]>(
      `${process.env.FINNHUB_BASE_URL}/news?category=general&token=${token}`,
      { revalidate: 1800, cacheKey } // 30 minutes
    );

    const wanted = (symbols || [])
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (wanted.length === 0) return articles;

    // Best-effort filter: Finnhub includes comma-separated tickers in "related"
    return articles.filter((a) => {
      const related = (a.related || "").toUpperCase();
      return wanted.some((sym) => related.includes(sym));
    });
  } catch (e) {
    console.error("Error fetching news:", e);
    return [];
  }
});

// Clear cache for specific symbol
export const clearSymbolCache = async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  apiCache.clear(cleanSymbol);
};