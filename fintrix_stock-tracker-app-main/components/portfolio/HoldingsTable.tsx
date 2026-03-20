"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Holding {
  id: string;
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
}

interface HoldingsTableProps {
  holdings: Holding[];
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
  onEditClick?: (holding: Holding) => void;
}

export const HoldingsTable = ({ holdings, onEdit, onDelete, onEditClick }: HoldingsTableProps) => {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

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

  const isPositiveGain = (gain: number) => gain >= 0;

  const handleEditHolding = (holding: Holding) => {
    setSelectedHolding(holding);
    if (onEditClick) {
      onEditClick(holding);
    } else if (onEdit) {
      onEdit(holding);
    } else {
      console.log("Edit holding:", holding);
    }
  };

  const handleDeleteHolding = (holding: Holding) => {
    if (onDelete) {
      onDelete(holding);
    } else {
      console.log("Delete holding:", holding);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>
          Your current stock holdings and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="hidden sm:table-cell">Company</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding, index) => (
                <TableRow key={holding.id || `${holding.symbol}-${index}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{holding.symbol}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {holding.companyName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {holding.companyName}
                  </TableCell>
                  <TableCell className="text-right">
                    {holding.shares.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(holding.avgCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(holding.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(holding.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <div className={`flex items-center ${isPositiveGain(holding.gain) ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositiveGain(holding.gain) ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatCurrency(holding.gain)}
                      </div>
                      <Badge variant={isPositiveGain(holding.gain) ? "default" : "destructive"} className="text-xs">
                        {formatPercentage(holding.gainPercentage)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {holding.weight.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditHolding(holding)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteHolding(holding)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {holdings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No holdings found. Add your first stock to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
