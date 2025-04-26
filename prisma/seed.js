import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create publishers
  const publisher1 = await prisma.publisher.create({
    data: {
      name: 'News Site',
      adSlots: {
        create: [
          { name: 'Header Banner', type: 'banner', size: '728x90' },
          { name: 'Sidebar', type: 'banner', size: '300x250' },
        ],
      },
    },
  });

  const publisher2 = await prisma.publisher.create({
    data: {
      name: 'Gaming Portal',
      adSlots: {
        create: [
          { name: 'Top Banner', type: 'banner', size: '970x250' },
          { name: 'In-content', type: 'native', size: '600x400' },
        ],
      },
    },
  });

  // Create DSPs with targeting rules
  const dsp1 = await prisma.dsp.create({
    data: {
      name: 'Brand Advertisers',
      targetingRules: JSON.stringify({
        geos: ['US', 'CA', 'UK'],
        devices: ['desktop', 'mobile'],
        bidPricing: {
          'US-desktop': 4.5,
          'US-mobile': 3.8,
          'CA-desktop': 3.2,
          'CA-mobile': 2.8,
          'UK-desktop': 3.0,
          'UK-mobile': 2.5,
          default: 1.0,
        },
      }),
    },
  });

  const dsp2 = await prisma.dsp.create({
    data: {
      name: 'Performance Network',
      targetingRules: JSON.stringify({
        geos: ['US', 'CA', 'UK', 'AU', 'DE'],
        devices: ['desktop', 'mobile', 'tablet'],
        bidPricing: {
          'US-mobile': 5.0,
          'US-tablet': 4.2,
          'US-desktop': 3.5,
          'CA-mobile': 3.2,
          'UK-mobile': 3.0,
          default: 1.5,
        },
      }),
    },
  });

  const dsp3 = await prisma.dsp.create({
    data: {
      name: 'Global Reach',
      targetingRules: JSON.stringify({
        geos: ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'JP', 'BR', 'MX'],
        devices: ['desktop', 'mobile', 'tablet', 'tv'],
        bidPricing: {
          'US-mobile': 4.2,
          'JP-desktop': 5.0,
          'UK-mobile': 3.5,
          'DE-tablet': 3.0,
          'FR-desktop': 2.8,
          default: 2.0,
        },
      }),
    },
  });

  // Create some sample ad requests and bids
  // Sample data for the past week
  const geos = ['US', 'CA', 'UK', 'DE', 'FR'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const slots = await prisma.adSlot.findMany();
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  // Generate 100 random ad requests
  for (let i = 0; i < 100; i++) {
    const geo = geos[Math.floor(Math.random() * geos.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const date = dates[Math.floor(Math.random() * dates.length)];
    
    const dsps = await prisma.dsp.findMany();
    
    // Create the ad request
    const adRequest = await prisma.adRequest.create({
      data: {
        publisherId: slot.publisherId,
        adSlotId: slot.id,
        geo,
        device,
        requestTime: date,
      },
    });

    // Generate bids from DSPs
    const bids = [];
    for (const dsp of dsps) {
      const targetingRules = JSON.parse(dsp.targetingRules);
      
      // Check if DSP targets this geo and device
      if (targetingRules.geos.includes(geo) && targetingRules.devices.includes(device)) {
        // Determine bid price
        const geoDeviceKey = `${geo}-${device}`;
        const bidPrice = targetingRules.bidPricing[geoDeviceKey] || targetingRules.bidPricing.default;
        
        // Add some random variation to bid price
        const finalBidPrice = bidPrice * (0.8 + Math.random() * 0.4);
        
        const bid = await prisma.bid.create({
          data: {
            dspId: dsp.id,
            adRequestId: adRequest.id,
            bidPrice: finalBidPrice,
            imageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/600/400`,
            clickUrl: `https://example.com/landing?campaign=${dsp.id}&creative=${Math.floor(Math.random() * 1000)}`,
          },
        });
        
        bids.push(bid);
      }
    }

    // Determine winning bid
    if (bids.length > 0) {
      const winningBid = bids.reduce((prev, current) => 
        prev.bidPrice > current.bidPrice ? prev : current
      );
      
      await prisma.adRequest.update({
        where: { id: adRequest.id },
        data: { winningBidId: winningBid.id },
      });
    }
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });