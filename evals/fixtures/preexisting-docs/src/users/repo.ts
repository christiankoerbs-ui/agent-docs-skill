export type User = { id: string; email: string };

const users = new Map<string, User>();

export function createUser(u: User): User {
  if (users.has(u.id)) throw new Error("user exists");
  users.set(u.id, u);
  return u;
}

export function getUser(id: string): User | undefined {
  return users.get(id);
}
