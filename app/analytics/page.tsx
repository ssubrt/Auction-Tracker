"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart } from "@/components/dashboard/LineChart";
import { BarChart } from "@/components/dashboard/BarChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsSummary {
  totalRequests: number;
  totalBids: number;
  fillRate: number;
  avgCpm: number;
  dspsCount: number;
}

interface DailyTrend {
  date: string;
  requests: number;
  filled: number;
  fillRate: number;
  avgCpm: number;
}

interface DspPerformance {
  name: string;
  bids: number;
  wins: number;
  winRate: number;
  avgCpm: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  dailyTrends: DailyTrend[];
  dspPerformance: DspPerformance[];
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return (
    <DashboardLayout title="Analytics">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Auction Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="h-[350px]">
              <CardHeader>
                <div className="h-6 w-1/3 rounded bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-[250px] rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <Tabs defaultValue="trends">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="trends">Traffic Trends</TabsTrigger>
            <TabsTrigger value="dsp">DSP Performance</TabsTrigger>
            <TabsTrigger value="rates">Rates & CPM</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-6">
            <LineChart
              title="Daily Requests & Fill Rate"
              data={data.dailyTrends.map(trend => ({
                name: format(new Date(trend.date), "MMM dd"),
                requests: trend.requests,
                filled: trend.filled,
                fillRate: trend.fillRate,
              }))}
              lines={[
                { key: "requests", name: "Ad Requests", color: "hsl(var(--chart-1))" },
                { key: "filled", name: "Filled Requests", color: "hsl(var(--chart-2))" },
                { key: "fillRate", name: "Fill Rate %", color: "hsl(var(--chart-3))" },
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Summary</CardTitle>
                <CardDescription>Request volume and fill rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Total Requests</h4>
                    <div className="text-2xl font-bold">{data.summary.totalRequests.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Over the last {timeRange} days</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Filled Requests</h4>
                    <div className="text-2xl font-bold">
                      {Math.round(data.summary.totalRequests * (data.summary.fillRate / 100)).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Requests with winning bids</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Fill Rate</h4>
                    <div className="text-2xl font-bold">{data.summary.fillRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Average across all requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dsp" className="space-y-6">
            <BarChart
              title="DSP Win Rates"
              data={data.dspPerformance}
              bars={[
                { key: "winRate", name: "Win Rate %", color: "hsl(var(--chart-1))" },
              ]}
            />
            
            <BarChart
              title="DSP Bid Volume"
              data={data.dspPerformance}
              bars={[
                { key: "bids", name: "Total Bids", color: "hsl(var(--chart-2))" },
                { key: "wins", name: "Winning Bids", color: "hsl(var(--chart-3))" },
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>DSP Performance Comparison</CardTitle>
                <CardDescription>Comparing DSP metrics side by side</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">DSP</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Bids</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Wins</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Win Rate</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Avg CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dspPerformance.map((dsp) => (
                        <tr key={dsp.name} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2 text-sm font-medium">{dsp.name}</td>
                          <td className="px-4 py-2 text-right text-sm">{dsp.bids.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-sm">{dsp.wins.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-sm">{dsp.winRate.toFixed(1)}%</td>
                          <td className="px-4 py-2 text-right text-sm">${dsp.avgCpm.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rates" className="space-y-6">
            <LineChart
              title="Daily CPM Trends"
              data={data.dailyTrends.map(trend => ({
                name: format(new Date(trend.date), "MMM dd"),
                avgCpm: trend.avgCpm,
              }))}
              lines={[
                { key: "avgCpm", name: "Average CPM ($)", color: "hsl(var(--chart-1))" },
              ]}
            />
            
            <BarChart
              title="CPM by DSP"
              data={data.dspPerformance}
              bars={[
                { key: "avgCpm", name: "Average CPM ($)", color: "hsl(var(--chart-2))" },
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Potential</CardTitle>
                <CardDescription>Estimated revenue based on CPM rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Average CPM</h4>
                    <div className="text-2xl font-bold">${data.summary.avgCpm.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across all impressions</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Estimated Revenue</h4>
                    <div className="text-2xl font-bold">
                      ${((data.summary.avgCpm * data.summary.totalRequests * (data.summary.fillRate / 100)) / 1000).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Based on filled requests</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Revenue Opportunity</h4>
                    <div className="text-2xl font-bold">
                      ${((data.summary.avgCpm * data.summary.totalRequests * ((100 - data.summary.fillRate) / 100)) / 1000).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Potential from unfilled requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      )}
    </DashboardLayout>
  );
}