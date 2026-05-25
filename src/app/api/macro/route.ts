import { NextResponse } from 'next/server';
import { getMacroData } from '@/lib/data/macro';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const data = await getMacroData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch macro data' }, { status: 500 });
  }
}
