import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('⚡ Socket connected to BidX Real-Time Gateway:', s.id);
      setIsConnected(true);

      // Perform server time synchronization
      const t0 = Date.now();
      s.emit('time:sync', t0, (data) => {
        if (data && data.serverTime) {
          const t1 = Date.now();
          const latency = (t1 - t0) / 2;
          const estimatedServerNow = data.serverTime + latency;
          const offset = estimatedServerNow - Date.now();
          setServerOffsetMs(offset);
          console.log(`⏱ Server clock offset synchronized: ${offset}ms`);
        }
      });
    });

    s.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      setIsConnected(false);
    });

    // Handle global platform toast announcements
    s.on('platform:toast', (toast) => {
      addToast(toast);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Update socket authentication when token changes
  useEffect(() => {
    if (socket && isConnected) {
      if (token) {
        socket.emit('auth:authenticate', { token }, (res) => {
          if (res?.success) {
            console.log('⚡ Socket authenticated as:', res.user?.name);
          }
        });
      }
    }
  }, [token, socket, isConnected]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const joinAuction = (auctionId) => {
    if (socket && auctionId) {
      socket.emit('auction:join', { auctionId });
    }
  };

  const leaveAuction = (auctionId) => {
    if (socket && auctionId) {
      socket.emit('auction:leave', { auctionId });
    }
  };

  const placeBid = (auctionId, amount) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        return reject(new Error('Real-time connection is currently unavailable.'));
      }
      socket.emit('bid:place', { auctionId, amount, token }, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.message || 'Failed to place bid.'));
        }
      });
    });
  };

  const value = {
    socket,
    isConnected,
    serverOffsetMs,
    toasts,
    addToast,
    removeToast,
    joinAuction,
    leaveAuction,
    placeBid,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
