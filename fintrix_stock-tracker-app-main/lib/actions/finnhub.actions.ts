'use server';

import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getWatchlistSymbolsByEmail } from './watchlist.actions';
import { cache } from 'react';
import { fetchJSON } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '../constants';
import { formatPrice } from '@/lib/utils';
import { formatChangePercent } from '@/lib/utils';
import { formatMarketCapValue } from '@/lib/utils';


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
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          'Error in stock search:',
          new Error('FINNHUB API key is not configured')
        );
        return [];
      }

      const trimmed = typeof query === 'string' ? query.trim() : '';

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${process.env.FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
                sym
              )}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<any>(url, 3600);
              return { sym, profile } as { sym: string; profile: any };
            } catch (e) {
              console.error('Error fetching profile2 for', sym, e);
              return { sym, profile: null } as { sym: string; profile: any };
            }
          })
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: 'Common Stock',
            };
            // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
            // To keep pipeline simple, attach exchange via closure map stage
            // We'll reconstruct exchange when mapping to final type
            (r as any).__exchange = exchange; // internal only
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const url = `${process.env.FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
          trimmed
        )}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || '').toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as any).__exchange as
            | string
            | undefined;
          const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
          const type = r.type || 'Stock';
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: userWatchlistSymbols.includes(
              r.symbol.toUpperCase()
            ),
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



// Fetch stock details by symbol
export const getStocksDetails = cache(async (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const [quote, profile, financials] = await Promise.all([
      fetchJSON(
        // Price data - no caching for accuracy
        `${process.env.FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`
      ),
      fetchJSON(
        // Company info - cache 1hr (rarely changes)
        `${process.env.FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`,
        3600
      ),
      fetchJSON(
        // Financial metrics (P/E, etc.) - cache 30min
        `${process.env.FINNHUB_BASE_URL}/stock/metric?symbol=${cleanSymbol}&metric=all&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`,
        1800
      ),
    ]);

    // Type cast the responses
    const quoteData = quote as QuoteData;
    const profileData = profile as ProfileData;
    const financialsData = financials as FinancialsData;

    // Check if we got valid quote and profile data
    if (!quoteData?.c || !profileData?.name)
      throw new Error('Invalid stock data received from API');

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
    throw new Error('Failed to fetch stock details');
  }
});

export const getNews = cache(async (symbols?: string[]): Promise<MarketNewsArticle[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return [];

    // Finnhub "general" market news
    const url = `${process.env.FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const raw = await fetchJSON<MarketNewsArticle[]>(url, 1800);
    const articles = Array.isArray(raw) ? raw : [];

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