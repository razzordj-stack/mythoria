import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./route";

describe("verifyStripeSignature", () => {
  it("akzeptiert eine aktuelle, korrekt signierte Stripe-Nachricht", () => {
    const body = '{"type":"checkout.session.completed"}';
    const secret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    expect(verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret)).toBe(true);
  });

  it("verwirft manipulierte oder alte Nachrichten", () => {
    expect(verifyStripeSignature("{}", "t=1,v1=abc", "whsec_test")).toBe(false);
  });
});
