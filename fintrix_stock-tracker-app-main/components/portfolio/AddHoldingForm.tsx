"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddHoldingFormProps {
  onSubmit: (holding: any) => void;
  initialData?: any;
  isEdit?: boolean;
}

export const AddHoldingForm = ({ onSubmit, initialData, isEdit = false }: AddHoldingFormProps) => {
  const [formData, setFormData] = useState({
    symbol: initialData?.symbol || "",
    companyName: initialData?.companyName || "",
    shares: initialData?.shares?.toString() || "",
    avgCost: initialData?.avgCost?.toString() || "",
    sector: initialData?.sector || "",
    purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate) : new Date(),
    notes: initialData?.notes || ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectors = [
    "Technology",
    "Finance",
    "Healthcare",
    "Energy",
    "Consumer Goods",
    "Industrial",
    "Real Estate",
    "Utilities",
    "Materials",
    "Communication Services"
  ];

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newHolding = {
        symbol: formData.symbol.toUpperCase(),
        companyName: formData.companyName,
        shares: parseFloat(formData.shares),
        avgCost: parseFloat(formData.avgCost),
        sector: formData.sector,
        purchaseDate: new Date(formData.purchaseDate), // Ensure it's a Date object
        notes: formData.notes
      };

      onSubmit(newHolding);

      // Reset form only if not in edit mode
      if (!isEdit) {
        setFormData({
          symbol: "",
          companyName: "",
          shares: "",
          avgCost: "",
          sector: "",
          purchaseDate: new Date(),
          notes: ""
        });
      }
    } catch (error) {
      console.error("Error adding holding:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            placeholder="e.g., AAPL"
            value={formData.symbol}
            onChange={(e) => handleInputChange("symbol", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            placeholder="e.g., Apple Inc."
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shares">Number of Shares *</Label>
          <Input
            id="shares"
            type="number"
            placeholder="e.g., 100"
            value={formData.shares}
            onChange={(e) => handleInputChange("shares", e.target.value)}
            min="1"
            step="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgCost">Average Cost per Share *</Label>
          <Input
            id="avgCost"
            type="number"
            placeholder="e.g., 150.00"
            value={formData.avgCost}
            onChange={(e) => handleInputChange("avgCost", e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sector">Sector *</Label>
          <Select
            value={formData.sector}
            onValueChange={(value) => handleInputChange("sector", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Purchase Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.purchaseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.purchaseDate ? (
                  format(formData.purchaseDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.purchaseDate}
                onSelect={(date) => date && handleInputChange("purchaseDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this investment..."
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        {!isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                symbol: "",
                companyName: "",
                shares: "",
                avgCost: "",
                sector: "",
                purchaseDate: new Date(),
                notes: ""
              });
            }}
          >
            Clear
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update Holding" : "Add Holding")}
        </Button>
      </div>
    </form>
  );
};
