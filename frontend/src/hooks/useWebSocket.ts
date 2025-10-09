import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Connecting to WebSocket:', WS_URL);

    const socketInstance = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError('Ошибка подключения к WebSocket');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connected, error };
};

// Хук для подписки на события очереди
export const useQueueStats = (
  onStats: (stats: any) => void
) => {
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    // Подписываемся на статистику
    socket.emit('subscribe:queue');

    // Слушаем обновления
    socket.on('queue:stats', onStats);

    return () => {
      socket.off('queue:stats', onStats);
    };
  }, [socket, connected, onStats]);

  return { connected };
};

// Хук для отслеживания задачи
export const useJobUpdates = (
  jobId: string | null,
  onUpdate: (update: any) => void
) => {
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    if (!socket || !connected || !jobId) return;

    // Подписываемся на задачу
    socket.emit('subscribe:job', jobId);

    // Слушаем обновления
    socket.on('job:update', onUpdate);

    return () => {
      socket.off('job:update', onUpdate);
    };
  }, [socket, connected, jobId, onUpdate]);

  return { connected };
};

// Хук для всех событий задач
export const useTaskEvents = () => {
  const { socket, connected } = useWebSocket();
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [lastCompleted, setLastCompleted] = useState<any>(null);
  const [lastFailed, setLastFailed] = useState<any>(null);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('task:created', (task) => {
      console.log('📝 Task created:', task);
      setLastCreated(task);
    });

    socket.on('task:completed', (result) => {
      console.log('✅ Task completed:', result);
      setLastCompleted(result);
    });

    socket.on('task:failed', (error) => {
      console.error('❌ Task failed:', error);
      setLastFailed(error);
    });

    return () => {
      socket.off('task:created');
      socket.off('task:completed');
      socket.off('task:failed');
    };
  }, [socket, connected]);

  return {
    connected,
    lastCreated,
    lastCompleted,
    lastFailed
  };
};