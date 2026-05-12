export type RealtimeSocket = {
  connected: boolean;
  on(event: string, handler: (...args: any[]) => void): RealtimeSocket;
  emit(event: string, ...args: any[]): RealtimeSocket;
  emitWithAck<T = unknown>(event: string, ...args: any[]): Promise<T>;
  connect(): RealtimeSocket;
  disconnect(): RealtimeSocket;
};

export declare const REALTIME_URL: string;
export declare function createRealtimeSocket(): RealtimeSocket;
