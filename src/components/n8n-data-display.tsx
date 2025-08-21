'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const N8nDataDisplay: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io(); // Connects to the current host (localhost:3000 in dev)

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('n8n-message', (data: any) => {
      console.log('Received n8n message:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    // Clean up on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-4 border rounded-md mt-4">
      <h2 className="text-lg font-semibold mb-2">Messages from n8n:</h2>
      {messages.length === 0 ? (
        <p>No messages received yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {messages.map((msg, index) => (
            <li key={index} className="break-all">
              <pre>{JSON.stringify(msg, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default N8nDataDisplay;
