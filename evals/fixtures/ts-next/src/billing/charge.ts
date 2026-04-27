export type ChargeStatus = "pending" | "succeeded" | "failed" | "refunded";

export type Charge = {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: ChargeStatus;
  createdAt: number;
};

const ledger: Charge[] = [];

export function charge(userId: string, amountCents: number, currency = "USD"): Charge {
  if (amountCents <= 0) throw new Error("amountCents must be positive");
  const c: Charge = {
    id: crypto.randomUUID(),
    userId,
    amountCents,
    currency,
    status: "succeeded",
    createdAt: Date.now(),
  };
  ledger.push(c);
  return c;
}

export function refund(chargeId: string): Charge {
  const c = ledger.find((x) => x.id === chargeId);
  if (!c) throw new Error(`charge not found: ${chargeId}`);
  if (c.status === "refunded") throw new Error("already refunded");
  c.status = "refunded";
  return c;
}

export function listCharges(userId: string): Charge[] {
  return ledger.filter((c) => c.userId === userId);
}
