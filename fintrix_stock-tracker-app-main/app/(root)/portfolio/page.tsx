"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Target, Activity, AlertCircle } from "lucide-react";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { AddHoldingForm } from "@/components/portfolio/AddHoldingForm";
import { PerformanceChart } from "@/components/portfolio/PerformanceChart";
import { AllocationChart } from "@/components/portfolio/AllocationChart";
import { getUserPortfolio, getPortfolioPerformance } from "@/lib/actions/portfolio.actions";
import { toast } from "sonner";

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch portfolio data from API (will automatically get current user)
        const portfolio = await getUserPortfolio();

        if (portfolio) {
          setPortfolioData(portfolio);

          // Fetch performance data (will automatically get current user)
          const performance = await getPortfolioPerformance();
          setPerformanceData(performance);
        } else {
          // New user - empty portfolio
          setPortfolioData(null);
          setPerformanceData([]);
        }
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        setError("Failed to load portfolio data. Please try again.");
        toast.error("Failed to load portfolio data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  const handleAddHolding = async (newHolding: any) => {
    try {
      // Add holding via API (will automatically get current user)
      const result = await import("@/lib/actions/portfolio.actions").then(actions =>
        actions.addHolding("", newHolding)
      );

      if (result.success) {
        toast.success(result.message || "Holding added successfully");
        setIsAddDialogOpen(false);
        setEditingHolding(null);

        // Use returned portfolio data
        if (result.portfolio) {
          setPortfolioData(result.portfolio);
        }
      } else {
        toast.error(result.message || "Failed to add holding");
      }
    } catch (error) {
      console.error("Error adding holding:", error);
      toast.error("Failed to add holding");
    }
  };

  const handleEditHolding = async (holdingId: string, updateData: any) => {
    try {
      const result = await import("@/lib/actions/portfolio.actions").then(actions =>
        actions.updateHolding("", holdingId, updateData)
      );

      if (result.success) {
        toast.success(result.message || "Holding updated successfully");

        // Use returned portfolio data
        if (result.portfolio) {
          setPortfolioData(result.portfolio);
        }
      } else {
        toast.error(result.message || "Failed to update holding");
      }
    } catch (error) {
      console.error("Error updating holding:", error);
      toast.error("Failed to update holding");
    }
  };

  const handleEditClick = (holding: any) => {
    setEditingHolding(holding);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingHolding(null);
  };

  const handleDeleteHolding = async (holdingId: string) => {
    try {
      const result = await import("@/lib/actions/portfolio.actions").then(actions =>
        actions.deleteHolding("", holdingId)
      );

      if (result.success) {
        toast.success(result.message || "Holding deleted successfully");

        // Use returned portfolio data
        if (result.portfolio) {
          setPortfolioData(result.portfolio);
        }
      } else {
        toast.error(result.message || "Failed to delete holding");
      }
    } catch (error) {
      console.error("Error deleting holding:", error);
      toast.error("Failed to delete holding");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Portfolio</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!portfolioData || portfolioData.holdings?.length === 0) {
    return (
      <div className="flex min-h-screen flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Track your investments and monitor your portfolio performance
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Holding</DialogTitle>
                <DialogDescription>
                  Add a new stock to your portfolio to start tracking your investments.
                </DialogDescription>
              </DialogHeader>
              <AddHoldingForm onSubmit={handleAddHolding} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center max-w-md">
            <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Start Building Your Portfolio</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any holdings yet. Add your first stock to start tracking your investments and monitoring performance.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Holding
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Holding</DialogTitle>
                  <DialogDescription>
                    Add a new stock to your portfolio to start tracking your investments.
                  </DialogDescription>
                </DialogHeader>
                <AddHoldingForm onSubmit={handleAddHolding} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Portfolio</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!portfolioData || portfolioData.holdings?.length === 0) {
    return (
      <div className="flex min-h-screen flex-col space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Track your investments and monitor your portfolio performance
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Holding</DialogTitle>
                <DialogDescription>
                  Add a new stock to your portfolio to start tracking your investments.
                </DialogDescription>
              </DialogHeader>
              <AddHoldingForm onSubmit={handleAddHolding} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center max-w-md">
            <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Start Building Your Portfolio</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any holdings yet. Add your first stock to start tracking your investments and monitoring performance.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Holding
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Holding</DialogTitle>
                  <DialogDescription>
                    Add a new stock to your portfolio to start tracking your investments.
                  </DialogDescription>
                </DialogHeader>
                <AddHoldingForm onSubmit={handleAddHolding} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and monitor your portfolio performance
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {editingHolding ? "Edit Holding" : "Add Holding"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingHolding ? "Edit Holding" : "Add New Holding"}</DialogTitle>
              <DialogDescription>
                {editingHolding ? "Update your holding details." : "Add a new stock to your portfolio."}
              </DialogDescription>
            </DialogHeader>
            <AddHoldingForm
              onSubmit={handleAddHolding}
              initialData={editingHolding}
              isEdit={!!editingHolding}
            />
          </DialogContent>
        </Dialog>
      </div>

      <PortfolioOverview data={portfolioData || {
        totalValue: 0,
        totalGain: 0,
        totalGainPercentage: 0,
        dayChange: 0,
        dayChangePercentage: 0
      }} />

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">Holdings ({portfolioData.holdings?.length || 0})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <HoldingsTable
            holdings={portfolioData.holdings || []}
            onEditClick={handleEditClick}
            onDelete={async (holding: any) => {
              await handleDeleteHolding(holding.id);
            }}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceChart data={performanceData} />
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <AllocationChart data={portfolioData.sectorAllocation || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
