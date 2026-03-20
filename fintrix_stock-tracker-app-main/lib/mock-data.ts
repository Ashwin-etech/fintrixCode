// Mock data fallback for when Finnhub API is unavailable

export const mockQuoteData = (symbol: string) => ({
  c: 150.25, // current price
  d: 2.50,   // change
  dp: 1.69,  // percent change
  h: 152.00, // high price of the day
  l: 148.50, // low price of the day
  o: 149.75, // open price of the day
  pc: 147.75 // previous close price
});

export const mockProfileData = (symbol: string) => ({
  name: `${symbol} Company`,
  ticker: symbol,
  exchange: "NASDAQ",
  marketCapitalization: 1500000000000,
  country: "US",
  currency: "USD",
  weburl: `https://www.${symbol.toLowerCase()}.com`,
  logo: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
  phone: "+1-555-0000",
  finnhubIndustry: "Technology"
});

export const mockFinancialsData = (symbol: string) => ({
  metric: {
    peNormalizedAnnual: 25.5,
    psAnnual: 5.2,
    pbQuarterly: 3.8,
    marketCap: 1500000000000,
    grossMarginTTM: 0.65,
    operatingMarginTTM: 0.25,
    netProfitMarginTTM: 0.18,
    revenueTTM: 300000000000,
    revenuePerShareTTM: 45.50,
    epsNormalizedTTM: 6.25,
    epsNormalizedAnnual: 6.25,
    dividendYieldIndicatedAnnual: 0.015,
    dividendPerShareAnnual: 2.25,
    heldPercentInsiders: 0.08,
    heldPercentInstitutions: 0.72,
  }
});

export const createMockStockDetails = (symbol: string) => {
  const quote = mockQuoteData(symbol);
  const profile = mockProfileData(symbol);
  const financials = mockFinancialsData(symbol);

  return {
    symbol: symbol.toUpperCase(),
    company: profile.name,
    currentPrice: quote.c,
    changePercent: quote.dp,
    priceFormatted: `$${quote.c.toFixed(2)}`,
    changeFormatted: `+${quote.dp.toFixed(2)}%`,
    peRatio: financials.metric.peNormalizedAnnual?.toFixed(1) || '—',
    marketCapFormatted: `$${(profile.marketCapitalization / 1000000000).toFixed(1)}B`,
  };
};
