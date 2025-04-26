"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoadingButton } from "@/components/dashboard/LoadingButton";

interface AdRequestData {
  id: string;
  publisher: { name: string };
  adSlot: { name: string; type: string; size: string };
  geo: string;
  device: string;
  requestTime: string;
  bids: {
    id: string;
    dsp: { name: string };
    bidPrice: number;
  }[];
  winningBid: {
    id: string;
    dsp: { name: string };
    bidPrice: number;
    imageUrl: string;
    clickUrl: string;
  } | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface Publisher {
  id: string;
  name: string;
  adSlots: AdSlot[];
}

interface AdSlot {
  id: string;
  name: string;
  type: string;
  size: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<AdRequestData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [selectedAdSlot, setSelectedAdSlot] = useState("");
  const [geo, setGeo] = useState("");
  const [device, setDevice] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingPublishers, setLoadingPublishers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPublishers = async () => {
    try {
      setLoadingPublishers(true);
      const response = await fetch('/api/admin/publishers');
      if (!response.ok) throw new Error('Failed to fetch publishers');
      const data = await response.json();
      setPublishers(data);
    } catch (error) {
      console.error('Error fetching publishers:', error);
      toast.error('Failed to load publishers');
    } finally {
      setLoadingPublishers(false);
    }
  };

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/requests?page=${page}&limit=${pagination.limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchPublishers();
  }, []);

  // Reset ad slot when publisher changes
  useEffect(() => {
    setSelectedAdSlot("");
  }, [selectedPublisher]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchRequests(newPage);
    }
  };

  const handleCreateRequest = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/create-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publisherId: selectedPublisher,
          adSlotId: selectedAdSlot,
          geo,
          device,
        }),
      });

      if (!response.ok) throw new Error('Failed to create request');

      toast.success('Ad request created successfully');
      setIsDialogOpen(false);
      fetchRequests(1); // Refresh the list
      
      // Reset form
      setSelectedPublisher("");
      setSelectedAdSlot("");
      setGeo("");
      setDevice("");
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create ad request');
    }  finally {
      setIsSubmitting(false);
    }
  };

  const selectedPublisherData = publishers.find(p => p.id === selectedPublisher);

  return (
    <DashboardLayout title="Ad Requests">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Ad Requests</CardTitle>
              <CardDescription>
                View and analyze recent ad requests and auction results
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Ad Request</DialogTitle>
                  <DialogDescription>
                    Create a new ad request and run an auction
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Select
                      value={selectedPublisher}
                      onValueChange={setSelectedPublisher}
                      disabled={loadingPublishers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingPublishers ? "Loading..." : "Select publisher"} />
                      </SelectTrigger>
                      <SelectContent>
                        {publishers.map((publisher) => (
                          <SelectItem key={publisher.id} value={publisher.id}>
                            {publisher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="adSlot">Ad Slot</Label>
                    <Select
                      value={selectedAdSlot}
                      onValueChange={setSelectedAdSlot}
                      disabled={!selectedPublisher || !selectedPublisherData}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedPublisher ? "Select a publisher first" : "Select ad slot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPublisherData?.adSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.name} ({slot.size})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="geo">Geo Location</Label>
                    <Select value={geo} onValueChange={setGeo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select geo location" />
                      </SelectTrigger>
                      <SelectContent>
                        {['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU'].map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="device">Device Type</Label>
                    <Select value={device} onValueChange={setDevice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['desktop', 'mobile', 'tablet'].map((deviceType) => (
                          <SelectItem key={deviceType} value={deviceType}>
                            {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                <LoadingButton
                    onClick={handleCreateRequest}
                    disabled={!selectedPublisher || !selectedAdSlot || !geo || !device}
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                  >
                    Create Request
                  </LoadingButton>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Request Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Publisher</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ad Slot</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Geo/Device</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Bids</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Winning Bid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(request.requestTime), "MMM dd, yyyy HH:mm:ss")}
                        </td>
                        <td className="px-4 py-3 text-sm">{request.publisher.name}</td>
                        <td className="px-4 py-3 text-sm">
                          {request.adSlot.name}
                          <div className="text-xs text-muted-foreground">
                            {request.adSlot.type} ({request.adSlot.size})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {request.geo} / {request.device}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {request.bids.length}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {request.winningBid ? (
                            <div>
                              <div className="font-medium">{request.winningBid.dsp.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ${request.winningBid.bidPrice.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No winning bid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {requests.length} of {pagination.total} requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={i}
                          variant={pagination.page === pageNumber ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                    {pagination.pages > 5 && <span className="px-2">...</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}