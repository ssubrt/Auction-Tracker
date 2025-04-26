import { NextRequest, NextResponse } from 'next/server';
import { AdRequestInput, runAuction } from '@/lib/utils/auction-engine';
import { z } from 'zod';

// Validation schema for simulation request
const simulationSchema = z.object({
  publisher_id: z.string(),
  ad_slot_id: z.string(),
  geo: z.string(),
  device: z.string(),
  count: z.number().min(1).max(100).default(1),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const result = simulationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { publisher_id, ad_slot_id, geo, device, count } = result.data;
    
    // Run multiple auctions
    const results = [];
    for (let i = 0; i < count; i++) {
      const adRequestInput: AdRequestInput = {
        publisher_id,
        ad_slot_id,
        geo,
        device,
      };
      
      const auctionResult = await runAuction(adRequestInput);
      results.push(auctionResult);
    }
    
    // Count results by DSP
    const dspCounts: Record<string, number> = {};
    const dspTotalBids: Record<string, number> = {};
    
    results.forEach(result => {
      if (result) {
        dspCounts[result.winner_dsp] = (dspCounts[result.winner_dsp] || 0) + 1;
        dspTotalBids[result.winner_dsp] = (dspTotalBids[result.winner_dsp] || 0) + result.bid_price;
      }
    });
    
    // Calculate average bids
    const dspAverageBids: Record<string, number> = {};
    Object.keys(dspCounts).forEach(dsp => {
      dspAverageBids[dsp] = dspTotalBids[dsp] / dspCounts[dsp];
    });
    
    return NextResponse.json({
      total_auctions: count,
      successful_auctions: results.filter(r => r !== null).length,
      by_dsp: Object.keys(dspCounts).map(dsp => ({
        dsp_name: dsp,
        wins: dspCounts[dsp],
        win_rate: (dspCounts[dsp] / count) * 100,
        avg_bid: dspAverageBids[dsp],
      })),
      raw_results: results,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}