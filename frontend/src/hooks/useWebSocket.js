import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url = 'ws://localhost:8000/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('⚡ Connected to LifeBridge AI WebSocket server.');
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastEvent(parsed);
          setLastUpdatedTime(Date.now());
          setSecondsAgo(0);
        } catch (e) {
          console.warn('Failed to parse WebSocket message', event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.warn('WebSocket disconnected. Retrying in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection setup failed:', err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();

    // Heartbeat ticker for "Last updated X seconds ago"
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(ticker);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, lastUpdatedTime]);

  const send = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  };

  return {
    isConnected,
    lastEvent,
    secondsAgo,
    send,
  };
}
