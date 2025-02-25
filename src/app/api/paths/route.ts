import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const paths = await prisma.path.findMany({
      include: {
        courses: true
      }
    })
    
    return NextResponse.json(paths)
  } catch (error) {
    console.error('Error fetching paths:', error)
    return NextResponse.json(
      { error: 'Failed to fetch paths' },
      { status: 500 }
    )
  }
}
