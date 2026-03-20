"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, Activity } from "lucide-react";

interface PortfolioOverviewProps {
  data: {
    totalValue: number;
    totalGain: number;
    totalGainPercentage: number;
    dayChange: number;
    dayChangePercentage: number;
  };
}

export const PortfolioOverview = ({ data }: PortfolioOverviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const isPositiveGain = data.totalGain >= 0;
  const isPositiveDayChange = data.dayChange >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Current portfolio value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          {isPositiveGain ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalGain)}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isPositiveGain ? "default" : "destructive"} className="text-xs">
              {formatPercentage(data.totalGainPercentage)}
            </Badge>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Day Change</CardTitle>
          {isPositiveDayChange ? (
            <Activity className="h-4 w-4 text-green-600" />
          ) : (
            <Activity className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.dayChange)}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isPositiveDayChange ? "default" : "destructive"} className="text-xs">
              {formatPercentage(data.dayChangePercentage)}
            </Badge>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Return Target</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">15%</div>
          <p className="text-xs text-muted-foreground">
            Annual goal
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
