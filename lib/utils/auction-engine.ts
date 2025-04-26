import { prisma } from '@/lib/prisma';
import { simulateDspBids } from './dsp-simulator';

export type AdRequestInput = {
  publisher_id: string;
  ad_slot_id: string;
  geo: string;
  device: string;
  time?: string;
};

export type AuctionResult = {
  winner_dsp: string;
  bid_price: number;
  creative: {
    image_url: string;
    click_url: string;
  };
};

export async function runAuction(adRequestInput: AdRequestInput): Promise<AuctionResult | null> {
  try {
    // Check if publisher and ad slot exist
    const publisher = await prisma.publisher.findUnique({
      where: { id: adRequestInput.publisher_id },
    });
    
    const adSlot = await prisma.adSlot.findUnique({
      where: { id: adRequestInput.ad_slot_id },
    });
    
    if (!publisher || !adSlot) {
      throw new Error('Invalid publisher or ad slot');
    }
    
    // Create ad request in database
    const adRequest = await prisma.adRequest.create({
      data: {
        publisherId: adRequestInput.publisher_id,
        adSlotId: adRequestInput.ad_slot_id,
        geo: adRequestInput.geo,
        device: adRequestInput.device,
        requestTime: adRequestInput.time ? new Date(adRequestInput.time) : new Date(),
      },
    });
    
    // Get all DSPs
    const dsps = await prisma.dsp.findMany();
    
    // Simulate bids from DSPs
    const bids = await simulateDspBids(dsps, adRequest);
    
    if (bids.length === 0) {
      return null; // No bids received
    }
    
    // Find the winning bid
    const winningBid = bids.reduce((highest, current) => 
      current.bidPrice > highest.bidPrice ? current : highest
    );
    
    // Update ad request with winning bid
    await prisma.adRequest.update({
      where: { id: adRequest.id },
      data: { winningBidId: winningBid.id },
    });
    
    // Get DSP info for response
    const winnerDsp = await prisma.dsp.findUnique({
      where: { id: winningBid.dspId },
    });
    
    if (!winnerDsp) {
      throw new Error('Winner DSP not found');
    }
    
    return {
      winner_dsp: winnerDsp.name,
      bid_price: winningBid.bidPrice,
      creative: {
        image_url: winningBid.imageUrl,
        click_url: winningBid.clickUrl,
      },
    };
  } catch (error) {
    console.error('Auction error:', error);
    throw error;
  }
}