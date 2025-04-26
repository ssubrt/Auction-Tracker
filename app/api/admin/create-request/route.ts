import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAuction } from '@/lib/utils/auction-engine';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createRequestSchema = z.object({
  publisherId: z.string(),
  adSlotId: z.string(),
  geo: z.string(),
  device: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { publisherId, adSlotId, geo, device } = result.data;

    // Run auction with the provided data
    const auctionResult = await runAuction({
      publisher_id: publisherId,
      ad_slot_id: adSlotId,
      geo,
      device,
    });

    return NextResponse.json({
      success: true,
      auctionResult,
    });
  } catch (error) {
    console.error('Error creating ad request:', error);
    return NextResponse.json(
      { error: 'Failed to create ad request' },
      { status: 500 }
    );
  }
}