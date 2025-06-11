import 'express-session';

declare module 'express-session' {
  interface SessionData {
    sessionId?: string;
    userId?: number;
  }
}

export interface AuthenticatedRequest extends Express.Request {
  session: {
    sessionId?: string;
    userId?: number;
    destroy: (callback: (err: any) => void) => void;
  };
}