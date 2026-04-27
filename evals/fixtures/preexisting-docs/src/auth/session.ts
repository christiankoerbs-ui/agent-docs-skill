export type Session = { userId: string; token: string; expiresAt: number };

const store = new Map<string, Session>();

export function createSession(userId: string): Session {
  const session: Session = {
    userId,
    token: crypto.randomUUID(),
    expiresAt: Date.now() + 86_400_000,
  };
  store.set(session.token, session);
  return session;
}

export function validateSession(token: string): Session | null {
  const s = store.get(token);
  if (!s || s.expiresAt < Date.now()) return null;
  return s;
}
