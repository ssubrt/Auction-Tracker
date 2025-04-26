import { AdRequest, Bid, Dsp, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function simulateDspBids(
  dsps: Dsp[],
  adRequest: AdRequest
): Promise<Bid[]> {
  const bids: Bid[] = [];
  
  for (const dsp of dsps) {
    try {
      const targetingRules = JSON.parse(dsp.targetingRules as string);
      
      // Check if DSP targets this geo and device
      if (
        targetingRules.geos.includes(adRequest.geo) && 
        targetingRules.devices.includes(adRequest.device)
      ) {
        // Determine bid price based on geo and device combination
        const geoDeviceKey = `${adRequest.geo}-${adRequest.device}`;
        let bidPrice = targetingRules.bidPricing[geoDeviceKey] || targetingRules.bidPricing.default;
        
        // Add some randomness to the bid (±10%)
        bidPrice = bidPrice * (0.9 + Math.random() * 0.2);
        bidPrice = parseFloat(bidPrice.toFixed(2));
        
        // Create a bid
        const bid = await prisma.bid.create({
          data: {
            dspId: dsp.id,
            adRequestId: adRequest.id,
            bidPrice,
            imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/400`,
            clickUrl: `https://example.com/landing?campaign=${dsp.id}&creative=${Math.floor(Math.random() * 1000)}`,
          },
        });
        
        bids.push(bid);
      }
    } catch (error) {
      console.error(`Error processing DSP ${dsp.id}:`, error);
      // Continue with other DSPs even if one fails
    }
  }
  
  return bids;
}