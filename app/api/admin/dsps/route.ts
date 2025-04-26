import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dsps = await prisma.dsp.findMany({
      include: {
        _count: {
          select: { bids: true },
        },
      },
    });
    
    // For each DSP, calculate win rate and avg bid
    const dspsWithStats = await Promise.all(
      dsps.map(async (dsp) => {
        // Get total bids by this DSP
        const totalBids = await prisma.bid.count({
          where: { dspId: dsp.id },
        });
        
        // Get winning bids by this DSP
        const winningBids = await prisma.adRequest.count({
          where: {
            winningBid: {
              dspId: dsp.id,
            },
          },
        });
        
        // Get average bid price
        const bidStats = await prisma.bid.aggregate({
          where: { dspId: dsp.id },
          _avg: { bidPrice: true },
          _max: { bidPrice: true },
          _min: { bidPrice: true },
        });
        
        const winRate = totalBids > 0 ? (winningBids / totalBids) * 100 : 0;
        
        return {
          ...dsp,
          stats: {
            totalBids,
            winningBids,
            winRate: parseFloat(winRate.toFixed(2)),
            avgBidPrice: bidStats._avg.bidPrice ? parseFloat(bidStats._avg.bidPrice.toFixed(2)) : 0,
            maxBidPrice: bidStats._max.bidPrice || 0,
            minBidPrice: bidStats._min.bidPrice || 0,
          },
        };
      })
    );
    
    return NextResponse.json(dspsWithStats);
  } catch (error) {
    console.error('Error fetching DSPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DSPs' },
      { status: 500 }
    );
  }
}