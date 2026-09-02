// apps/webapp/api/kvk/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the company name from the URL (e.g., /api/kvk?naam=test)
  const { searchParams } = new URL(request.url);
  const naam = searchParams.get('naam') || 'test';

  // const url = `https://api.kvk.nl/test/api/v2/zoeken?naam=${naam}`;
  const url = `https://api.kvk.nl/test/api/v2/zoeken?kvkNummer=${naam}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': 'l7xx1f2691f2520d487b902f4e0b57a0b197',
      },
    });

    // console.log('kvk response === ',response);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from KVK' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}