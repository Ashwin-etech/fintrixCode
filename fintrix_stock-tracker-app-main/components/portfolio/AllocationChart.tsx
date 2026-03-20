"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChart as PieChartIcon, TrendingUp, TrendingDown } from "lucide-react";

interface AllocationData {
  sector: string;
  value: number;
  percentage: number;
}

interface AllocationChartProps {
  data: AllocationData[];
}

export const AllocationChart = ({ data }: AllocationChartProps) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSectorColor = (sector: string) => {
    const colors: Record<string, string> = {
      "Technology": "#3b82f6",
      "Finance": "#10b981",
      "Healthcare": "#ef4444",
      "Energy": "#eab308",
      "Consumer": "#a855f7",
      "Industrial": "#f97316",
      "Real Estate": "#ec4899",
      "Utilities": "#06b6d4",
      "Materials": "#6b7280",
      "Communication": "#6366f1"
    };
    return colors[sector] || "#9ca3af";
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const handleSectorClick = (sector: string) => {
    setSelectedSector(selectedSector === sector ? null : sector);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Value: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 5) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percentage).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>
              Distribution of your portfolio across different sectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="space-y-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => handleSectorClick(item.sector)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getSectorColor(item.sector) }}
                      />
                      <span className="text-sm font-medium">{item.sector}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(item.value)}
                      </span>
                      <Badge
                        variant={selectedSector === item.sector ? "default" : "outline"}
                        className="text-xs"
                      >
                        {item.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={item.percentage}
                    className="h-2"
                    style={{
                      '--progress-background': getSectorColor(item.sector)
                    } as any}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Value</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {data.length} sectors • Click on any sector to highlight
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allocation Chart</CardTitle>
            <CardDescription>
              Visual representation of your sector allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getSectorColor(entry.sector)}
                        stroke={selectedSector === entry.sector ? '#1f2937' : 'none'}
                        strokeWidth={selectedSector === entry.sector ? 2 : 0}
                        style={{
                          filter: selectedSector && selectedSector !== entry.sector ? 'opacity(0.3)' : 'opacity(1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSectorClick(entry.sector)}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {data.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSectorClick(item.sector)}
                    className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full border transition-colors ${selectedSector === item.sector
                        ? 'border-gray-800 bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSectorColor(item.sector) }}
                    />
                    <span>{item.sector}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedSector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {selectedSector} Sector Details
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your {selectedSector} allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Sector Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.find(d => d.sector === selectedSector)?.value || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((data.find(d => d.sector === selectedSector)?.value || 0) / totalValue * 100).toFixed(1)}% of portfolio
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Diversification</p>
                <p className={`text-2xl font-bold ${(data.find(d => d.sector === selectedSector)?.percentage || 0) > 30 ? 'text-red-600' :
                    (data.find(d => d.sector === selectedSector)?.percentage || 0) > 20 ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {(data.find(d => d.sector === selectedSector)?.percentage || 0).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(data.find(d => d.sector === selectedSector)?.percentage || 0) > 30 ? 'High Concentration' :
                    (data.find(d => d.sector === selectedSector)?.percentage || 0) > 20 ? 'Moderate' :
                      'Well Diversified'}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                <p className={`text-2xl font-bold ${['Technology', 'Consumer'].includes(selectedSector) ? 'text-orange-600' :
                    ['Finance', 'Industrial'].includes(selectedSector) ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {['Technology', 'Consumer'].includes(selectedSector) ? 'High' :
                    ['Finance', 'Industrial'].includes(selectedSector) ? 'Medium' : 'Low'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on sector volatility
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
