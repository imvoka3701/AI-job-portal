import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

export interface WebSocketNotificationPayload {
  id: number;
  title: string;
  message: string;
  notif_type: string;
  is_read: boolean;
  created_at: string | null;
  extra_data?: Record<string, unknown>;
}

export interface ChatMessageRealtimePayload {
  id: number;
  conversation_id: number;
  application_id?: number;
  sender_id: number;
  sender_name: string | null;
  sender_avatar?: string | null;
  company_name?: string | null;
  company_logo?: string | null;
  job_title?: string | null;
  content: string;
  created_at?: string | null;
}

interface UseWebSocketNotificationsOptions {
  onNotification?: (notification: WebSocketNotificationPayload) => void;
  onChatMessage?: (chatData: ChatMessageRealtimePayload) => void;
}

export function getWebSocketNotificationUrl(token: string): string {
  const explicitWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicitWsUrl) {
    return `${explicitWsUrl.replace(/\/$/, "")}/ws/notifications?token=${encodeURIComponent(token)}`;
  }

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
    const wsProtocol = apiUrl.startsWith("https://") ? "wss:" : "ws:";
    const cleanHost = apiUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
    return `${wsProtocol}//${cleanHost}/ws/notifications?token=${encodeURIComponent(token)}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/notifications?token=${encodeURIComponent(token)}`;
}

export function useWebSocketNotifications(options?: UseWebSocketNotificationsOptions) {
  const token = useAuthStore((s) => s.token);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<WebSocketNotificationPayload | null>(null);

  const onNotificationRef = useRef(options?.onNotification);
  const onChatMessageRef = useRef(options?.onChatMessage);
  useEffect(() => {
    onNotificationRef.current = options?.onNotification;
    onChatMessageRef.current = options?.onChatMessage;
  }, [options?.onNotification, options?.onChatMessage]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyClosedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) return;

    clearTimers();
    isManuallyClosedRef.current = false;

    try {
      const url = getWebSocketNotificationUrl(token);
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Keep-alive heartbeat ping every 25 seconds
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25_000);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === "pong") return;
          const data = JSON.parse(event.data);
          if (data.type === "pong") return;

          if (data.type === "chat_message" && data.data) {
            const chatPayload = data.data as ChatMessageRealtimePayload;
            onChatMessageRef.current?.(chatPayload);
            window.dispatchEvent(
              new CustomEvent("aijob:chat_message", { detail: chatPayload })
            );
          } else if (data.type === "notification" && data.data) {
            const notif = data.data as WebSocketNotificationPayload;
            setLastNotification(notif);
            onNotificationRef.current?.(notif);
          }
        } catch {
          // Ignore non-JSON or heartbeat frames
        }
      };

      ws.onerror = () => {
        // Socket error handled in onclose
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // If closed because of auth violation (1008) or manual logout, don't reconnect
        if (event.code === 1008 || isManuallyClosedRef.current || !token) {
          return;
        }

        // Exponential backoff reconnect: 1s, 2s, 4s, 8s, up to 30s
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30_000);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch {
      setIsConnected(false);
    }
  }, [token, clearTimers]);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      isManuallyClosedRef.current = true;
      clearTimers();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    }

    return () => {
      isManuallyClosedRef.current = true;
      clearTimers();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, connect, clearTimers]);

  return {
    isConnected,
    lastNotification,
  };
}
