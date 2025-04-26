"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DspTargetingRules {
  geos: string[];
  devices: string[];
  bidPricing: {
    [key: string]: number;
    default: number;
  };
}

interface DspStats {
  totalBids: number;
  winningBids: number;
  winRate: number;
  avgBidPrice: number;
  maxBidPrice: number;
  minBidPrice: number;
}

interface DspData {
  id: string;
  name: string;
  targetingRules: string;
  stats: DspStats;
  createdAt: string;
}

export default function DspsPage() {
  const [dsps, setDsps] = useState<DspData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDsps = async () => {
      try {
        const response = await fetch('/api/admin/dsps');
        if (!response.ok) {
          throw new Error('Failed to fetch DSPs');
        }
        const data = await response.json();
        setDsps(data);
      } catch (error) {
        console.error('Error fetching DSPs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDsps();
  }, []);

  return (
    <DashboardLayout title="Demand Side Platforms">
      <div className="grid gap-6">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))
        ) : (
          dsps.map((dsp) => {
            const targetingRules: DspTargetingRules = JSON.parse(dsp.targetingRules);
            
            return (
              <Card key={dsp.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{dsp.name}</CardTitle>
                      <CardDescription>
                        Targeting {targetingRules.geos.length} geos and {targetingRules.devices.length} device types
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">
                      {dsp.stats.winRate.toFixed(1)}% Win Rate
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Performance</h4>
                      <dl className="grid grid-cols-2 gap-1 text-sm">
                        <dt className="text-muted-foreground">Total Bids:</dt>
                        <dd className="text-right font-medium">{dsp.stats.totalBids.toLocaleString()}</dd>
                        <dt className="text-muted-foreground">Winning Bids:</dt>
                        <dd className="text-right font-medium">{dsp.stats.winningBids.toLocaleString()}</dd>
                        <dt className="text-muted-foreground">Win Rate:</dt>
                        <dd className="text-right font-medium">{dsp.stats.winRate.toFixed(1)}%</dd>
                        <dt className="text-muted-foreground">Avg Bid:</dt>
                        <dd className="text-right font-medium">${dsp.stats.avgBidPrice.toFixed(2)}</dd>
                      </dl>
                    </div>
                    
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Geo Targeting</h4>
                      <div className="flex flex-wrap gap-1">
                        {targetingRules.geos.map((geo) => (
                          <Badge key={geo} variant="secondary" className="text-xs">
                            {geo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Device Targeting</h4>
                      <div className="flex flex-wrap gap-1">
                        {targetingRules.devices.map((device) => (
                          <Badge key={device} variant="secondary" className="text-xs">
                            {device}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Bid Range</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min:</span>
                          <span className="font-medium">${dsp.stats.minBidPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg:</span>
                          <span className="font-medium">${dsp.stats.avgBidPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max:</span>
                          <span className="font-medium">${dsp.stats.maxBidPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="pricing">
                      <AccordionTrigger className="text-sm">View Bid Pricing Rules</AccordionTrigger>
                      <AccordionContent>
                        <div className="mt-2 rounded-md border bg-muted/50 p-4">
                          <div className="grid gap-2 md:grid-cols-3">
                            {Object.entries(targetingRules.bidPricing).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between rounded bg-card p-2">
                                <span className="text-sm font-medium">
                                  {key === 'default' ? 'Default' : key}
                                </span>
                                <span className="font-mono text-sm">${value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}