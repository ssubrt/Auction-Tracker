"use client";

import { useEffect, useState } from "react";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  BarChart, 
  DollarSign, 
  Percent, 
  PieChart, 
  Users 
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LineChart } from "@/components/dashboard/LineChart";
import { BarChart as BarChartComponent } from "@/components/dashboard/BarChart";

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

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
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
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:gap-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="h-[350px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <StatsCard
              title="Total Ad Requests"
              value={data.summary.totalRequests.toLocaleString()}
              icon={<BarChart className="h-4 w-4" />}
              description="Last 7 days"
            />
            <StatsCard
              title="Fill Rate"
              value={data.summary.fillRate.toFixed(1)}
              valueSuffix="%"
              icon={<Percent className="h-4 w-4" />}
              description="Requests with winning bids"
              trend={2.5}
              trendText="vs last week"
            />
            <StatsCard
              title="Average CPM"
              value={data.summary.avgCpm.toFixed(2)}
              valuePrefix="$"
              icon={<DollarSign className="h-4 w-4" />}
              description="All impressions"
              trend={-1.2}
              trendText="vs last week"
            />
            <StatsCard
              title="Active DSPs"
              value={data.summary.dspsCount}
              icon={<Users className="h-4 w-4" />}
              description="Bidding on inventory"
            />
          </div>

          <div className="mt-6 grid gap-6">
            <LineChart
              title="Daily Performance"
              data={data.dailyTrends.map(trend => ({
                name: trend.date,
                requests: trend.requests,
                fillRate: trend.fillRate,
                cpm: trend.avgCpm,
              }))}
              lines={[
                { key: "requests", name: "Ad Requests", color: "hsl(var(--chart-1))" },
                { key: "fillRate", name: "Fill Rate %", color: "hsl(var(--chart-2))" },
                { key: "cpm", name: "CPM ($)", color: "hsl(var(--chart-3))" },
              ]}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <BarChartComponent
                title="DSP Performance"
                data={data.dspPerformance}
                bars={[
                  { key: "winRate", name: "Win Rate %", color: "hsl(var(--chart-1))" },
                  { key: "avgCpm", name: "Avg CPM ($)", color: "hsl(var(--chart-2))" },
                ]}
              />

              <BarChartComponent
                title="DSP Bid Volume"
                data={data.dspPerformance}
                bars={[
                  { key: "bids", name: "Total Bids", color: "hsl(var(--chart-3))" },
                  { key: "wins", name: "Winning Bids", color: "hsl(var(--chart-4))" },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}