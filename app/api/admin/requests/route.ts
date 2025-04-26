import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await prisma.adRequest.count();
    
    // Get requests with relations
    const requests = await prisma.adRequest.findMany({
      skip,
      take: limit,
      orderBy: { requestTime: 'desc' },
      include: {
        publisher: { select: { name: true } },
        adSlot: { select: { name: true, type: true, size: true } },
        bids: {
          include: {
            dsp: { select: { name: true } },
          },
        },
        winningBid: {
          include: {
            dsp: { select: { name: true } },
          },
        },
      },
    });
    
    return NextResponse.json({
      data: requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad requests' },
      { status: 500 }
    );
  }
}