import { useEffect, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL;

export function useWebSocket(pollId, onUpdate) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!pollId) return;

    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}?pollId=${pollId}`);

      ws.onopen = () => {
        console.log('[WS] Conectado!');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'vote_update' && onUpdate) {
            onUpdate(data);
          }
        } catch (e) {
          console.error('[WS] Erro ao parsear mensagem:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Desconectado, tentando reconectar...');
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('[WS] Erro:', error);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [pollId]);

  return { isConnected };
}
