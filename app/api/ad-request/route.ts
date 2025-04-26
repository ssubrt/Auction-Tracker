import { NextRequest, NextResponse } from 'next/server';
import { AdRequestInput, runAuction } from '@/lib/utils/auction-engine';
import { z } from 'zod';

// Validation schema for ad request
const adRequestSchema = z.object({
  publisher_id: z.string(),
  ad_slot_id: z.string(),
  geo: z.string(),
  device: z.string(),
  time: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request body
    const result = adRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const adRequestInput: AdRequestInput = result.data;
    
    // Run the auction
    const auctionResult = await runAuction(adRequestInput);
    
    if (!auctionResult) {
      return NextResponse.json(
        { message: 'No eligible bids received' },
        { status: 204 }
      );
    }
    
    // Return auction result
    return NextResponse.json(auctionResult);
  } catch (error) {
    console.error('Ad request error:', error);
    return NextResponse.json(
      { error: 'Failed to process ad request' },
      { status: 500 }
    );
  }
}