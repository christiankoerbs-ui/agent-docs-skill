export type SessionToken = string & { readonly __brand: "SessionToken" };

export type Session = {
  userId: string;
  token: SessionToken;
  expiresAt: number;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const store = new Map<SessionToken, Session>();

export function createSession(userId: string): Session {
  const token = crypto.randomUUID() as SessionToken;
  const session: Session = {
    userId,
    token,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  store.set(token, session);
  return session;
}

export function validateSession(token: SessionToken): Session | null {
  const session = store.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    store.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token: SessionToken): void {
  store.delete(token);
}
