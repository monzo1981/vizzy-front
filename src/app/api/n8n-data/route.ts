import { NextResponse } from 'next/server';
import { getIoInstance } from '@/lib/socket-io-instance';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data from n8n:', data);

    const io = getIoInstance();
    if (io) {
      // Emit the received data to all connected Socket.IO clients
      io.emit('n8n-message', data);
    } else {
      console.warn('Socket.IO instance not available. Data not emitted.');
    }

    return NextResponse.json({ message: 'Data received and emitted' }, { status: 200 });
  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}
