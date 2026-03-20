"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface PerformanceData {
  date: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const filterDataByPeriod = (data: PerformanceData[], period: string) => {
    if (period === 'ALL') return data;

    const now = new Date();
    const monthsMap = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };
    const months = monthsMap[period as keyof typeof monthsMap] || 12;

    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const calculatePerformance = () => {
    if (data.length < 2) return { change: 0, changePercentage: 0 };

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercentage = (change / firstValue) * 100;

    return { change, changePercentage };
  };

  const calculateAdditionalMetrics = () => {
    if (data.length < 2) return { volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };

    const values = data.map(d => d.value);
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }

    // Calculate volatility (standard deviation of returns)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100; // Convert to percentage

    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = values[0];
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) peak = values[i];
      const drawdown = (peak - values[i]) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    maxDrawdown *= 100; // Convert to percentage

    // Calculate Sharpe ratio (simplified, assuming risk-free rate = 2%)
    const riskFreeRate = 0.02;
    const annualizedReturn = (values[values.length - 1] / values[0]) - 1;
    const annualizedVolatility = volatility * Math.sqrt(12); // Monthly to annual
    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - riskFreeRate) / annualizedVolatility : 0;

    return { volatility, maxDrawdown, sharpeRatio };
  };

  const filteredData = filterDataByPeriod(data, period);
  const { change, changePercentage } = calculatePerformance();
  const { volatility, maxDrawdown, sharpeRatio } = calculateAdditionalMetrics();
  const isPositive = change >= 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance</CardTitle>
              <CardDescription>
                Portfolio value over time
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="6M">6M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                </SelectContent>
              </Select>
              <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {change >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: any) => value !== undefined ? [formatCurrency(value), 'Portfolio Value'] : ['N/A', 'Portfolio Value']}
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Start Value</p>
              <p className="font-semibold">{formatCurrency(filteredData[0]?.value || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold">{formatCurrency(filteredData[filteredData.length - 1]?.value || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Change</p>
              <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{formatCurrency(change)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className="font-semibold">{volatility.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Maximum Drawdown</p>
              <p className={`text-2xl font-bold ${maxDrawdown > 10 ? 'text-red-600' : maxDrawdown > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                {maxDrawdown.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {maxDrawdown > 10 ? 'High Risk' : maxDrawdown > 5 ? 'Moderate Risk' : 'Low Risk'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Sharpe Ratio</p>
              <p className={`text-2xl font-bold ${sharpeRatio > 1 ? 'text-green-600' : sharpeRatio > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {sharpeRatio.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {sharpeRatio > 1 ? 'Excellent' : sharpeRatio > 0.5 ? 'Good' : 'Poor'}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Annualized Return</p>
              <p className={`text-2xl font-bold ${changePercentage > 10 ? 'text-green-600' : changePercentage > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {changePercentage.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {changePercentage > 10 ? 'Outstanding' : changePercentage > 0 ? 'Positive' : 'Negative'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
