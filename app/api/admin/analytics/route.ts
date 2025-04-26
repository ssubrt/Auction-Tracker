import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    
    // Get start date (days ago from now)
    const startDate = subDays(new Date(), days);
    
    // Get summary stats
    const totalRequests = await prisma.adRequest.count();
    const totalBids = await prisma.bid.count();
    const dspsCount = await prisma.dsp.count();
    
    // Calculate fill rate
    const filledRequests = await prisma.adRequest.count({
      where: {
        winningBidId: { not: null },
      },
    });
    const fillRate = totalRequests > 0 ? (filledRequests / totalRequests) * 100 : 0;
    
    // Calculate average CPM
    const bidStats = await prisma.bid.aggregate({
      _avg: { bidPrice: true },
    });
    const avgCpm = bidStats._avg.bidPrice ? bidStats._avg.bidPrice * 1000 : 0;
    
    // Get daily trends
    const dailyData = [];
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const dailyRequests = await prisma.adRequest.count({
        where: {
          requestTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      
      const dailyFilled = await prisma.adRequest.count({
        where: {
          requestTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          winningBidId: { not: null },
        },
      });
      
      const dailyBidStats = await prisma.bid.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _avg: { bidPrice: true },
      });
      
      dailyData.push({
        date: format(startOfDay, 'yyyy-MM-dd'),
        requests: dailyRequests,
        filled: dailyFilled,
        fillRate: dailyRequests > 0 ? (dailyFilled / dailyRequests) * 100 : 0,
        avgCpm: dailyBidStats._avg.bidPrice ? dailyBidStats._avg.bidPrice * 1000 : 0,
      });
    }
    
    // Get DSP performance
    const dspPerformance = await prisma.dsp.findMany({
      select: {
        id: true,
        name: true,
        bids: {
          select: {
            bidPrice: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });
    
    const dspStats = await Promise.all(
      dspPerformance.map(async (dsp) => {
        const wins = await prisma.adRequest.count({
          where: {
            winningBid: {
              dspId: dsp.id,
            },
          },
        });
        
        const avgBid = dsp.bids.length > 0
          ? dsp.bids.reduce((sum, bid) => sum + bid.bidPrice, 0) / dsp.bids.length
          : 0;
        
        return {
          name: dsp.name,
          bids: dsp._count.bids,
          wins,
          winRate: dsp._count.bids > 0 ? (wins / dsp._count.bids) * 100 : 0,
          avgCpm: avgBid * 1000,
        };
      })
    );
    
    return NextResponse.json({
      summary: {
        totalRequests,
        totalBids,
        fillRate,
        avgCpm,
        dspsCount,
      },
      dailyTrends: dailyData.reverse(), // Reverse to get chronological order
      dspPerformance: dspStats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}