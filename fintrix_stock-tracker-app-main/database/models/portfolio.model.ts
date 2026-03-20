import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioHolding extends Document {
  userId: string;
  symbol: string;
  companyName: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gain: number;
  gainPercentage: number;
  sector: string;
  weight: number;
  purchaseDate: Date;
  lastUpdated: Date;
}

export interface Portfolio extends Document {
  userId: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  holdings: PortfolioHolding[];
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioHoldingSchema = new Schema<PortfolioHolding>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    shares: { type: Number, required: true, min: 0 },
    avgCost: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    marketValue: { type: Number, required: true, min: 0 },
    gain: { type: Number, required: true },
    gainPercentage: { type: Number, required: true },
    sector: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    purchaseDate: { type: Date, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate symbols per user
PortfolioHoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });
PortfolioHoldingSchema.index({ userId: 1, sector: 1 });

const PortfolioSchema = new Schema<Portfolio>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    totalValue: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    totalGain: { type: Number, required: true },
    totalGainPercentage: { type: Number, required: true },
    dayChange: { type: Number, required: true },
    dayChangePercentage: { type: Number, required: true },
    holdings: [PortfolioHoldingSchema],
  },
  { timestamps: true }
);

// Index for efficient queries
PortfolioSchema.index({ userId: 1 });

export const PortfolioHolding: Model<PortfolioHolding> =
  (models?.PortfolioHolding as Model<PortfolioHolding>) || 
  model<PortfolioHolding>('PortfolioHolding', PortfolioHoldingSchema);

export const PortfolioModel: Model<Portfolio> =
  (models?.Portfolio as Model<Portfolio>) || 
  model<Portfolio>('Portfolio', PortfolioSchema);
