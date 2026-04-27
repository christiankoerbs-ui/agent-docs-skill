export type ApiClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
};

export function createClient(baseUrl: string): ApiClient {
  const url = (p: string) => new URL(p, baseUrl).toString();
  return {
    async get<T>(path: string): Promise<T> {
      const r = await fetch(url(path));
      if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
      return (await r.json()) as T;
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const r = await fetch(url(path), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
      return (await r.json()) as T;
    },
  };
}
