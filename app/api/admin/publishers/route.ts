import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const publishers = await prisma.publisher.findMany({
      include: {
        adSlots: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
          },
        },
      },
    });
    
    return NextResponse.json(publishers);
  } catch (error) {
    console.error('Error fetching publishers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publishers' },
      { status: 500 }
    );
  }
}