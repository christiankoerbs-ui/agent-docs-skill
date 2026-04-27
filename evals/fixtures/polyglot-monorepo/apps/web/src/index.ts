import { createClient } from "@fixture/sdk";
import { Dashboard } from "../components/Dashboard";

export const client = createClient(import.meta.env.VITE_API_URL ?? "http://localhost:8080");

export { Dashboard };
