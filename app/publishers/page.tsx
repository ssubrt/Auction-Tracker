"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdSlot {
  id: string;
  name: string;
  type: string;
  size: string;
}

interface Publisher {
  id: string;
  name: string;
  adSlots: AdSlot[];
  createdAt: string;
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublishers = async () => {
      try {
        const response = await fetch('/api/admin/publishers');
        if (!response.ok) {
          throw new Error('Failed to fetch publishers');
        }
        const data = await response.json();
        setPublishers(data);
      } catch (error) {
        console.error('Error fetching publishers:', error);
      
      } finally {
        setLoading(false);
      }
    };

    fetchPublishers();
  }, []);

  return (
    <DashboardLayout title="Publishers">
      {loading ? (
        <div className="grid gap-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {publishers.map((publisher) => (
            <Card key={publisher.id}>
              <CardHeader>
                <CardTitle>{publisher.name}</CardTitle>
                <CardDescription>
                  {publisher.adSlots.length} ad slots configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="slots">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="slots">Ad Slots</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="slots" className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Size</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {publisher.adSlots.map((slot) => (
                            <tr key={slot.id} className="border-b hover:bg-muted/50">
                              <td className="px-4 py-2 text-sm font-medium">{slot.name}</td>
                              <td className="px-4 py-2 text-sm">{slot.type}</td>
                              <td className="px-4 py-2 text-sm">{slot.size}</td>
                              <td className="px-4 py-2 text-sm font-mono text-xs text-muted-foreground">{slot.id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="performance" className="mt-4">
                    <div className="rounded-md border p-4">
                      <p className="text-center text-muted-foreground">
                        Performance metrics will be available soon
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}