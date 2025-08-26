import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketContextType } from '../types';
import { useAuth } from './AuthContext';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection when user is authenticated
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token,
          userId: user.id,
          username: user.username,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.IO server:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚫 Socket.IO connection error:', error);
        setConnected(false);
      });

      // Reconnection handlers
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected to Socket.IO server (attempt ' + attemptNumber + ')');
        setConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🔄 Reconnection failed:', error);
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Clean up socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, token]);

  const joinBoard = (boardId: string) => {
    if (socket && connected) {
      socket.emit('join-board', boardId);
      console.log(`🏠 Joining board: ${boardId}`);
    }
  };

  const leaveBoard = (boardId: string) => {
    if (socket && connected) {
      socket.emit('leave-board', boardId);
      console.log(`👋 Leaving board: ${boardId}`);
    }
  };

  const emitTyping = (boardId: string, isTyping: boolean) => {
    if (socket && connected && user) {
      socket.emit('user:typing', {
        userId: user.id,
        username: user.username,
        boardId,
        isTyping,
      });
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    joinBoard,
    leaveBoard,
    emitTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Custom hook for board-specific socket events
export function useBoardSocket(boardId: string | null) {
  const { socket, connected, joinBoard, leaveBoard } = useSocket();

  useEffect(() => {
    if (boardId && connected) {
      joinBoard(boardId);
      
      return () => {
        leaveBoard(boardId);
      };
    }
  }, [boardId, connected, joinBoard, leaveBoard]);

  return { socket, connected };
}

export default SocketContext;
