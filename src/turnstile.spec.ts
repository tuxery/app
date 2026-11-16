import { describe, expect, it, vi } from "vitest";
import { TURNSTILE_ACTION, verifyTurnstile } from "./turnstile";

function answering(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
}

const PASS = { success: true, action: TURNSTILE_ACTION, hostname: "tuxery.store" };

describe("verifyTurnstile", () => {
  it("accepts a valid token for this form on this site", async () => {
    expect(await verifyTurnstile("token", "secret", "203.0.113.7", answering(PASS))).toEqual({
      ok: true,
    });
  });

  it("sends the secret, the token and the visitor's IP to siteverify", async () => {
    const fetchImpl = answering(PASS);
    await verifyTurnstile("token", "secret", "203.0.113.7", fetchImpl);
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = new URLSearchParams(String(init?.body));
    expect(Object.fromEntries(body)).toEqual({
      secret: "secret",
      response: "token",
      remoteip: "203.0.113.7",
    });
  });

  it("refuses without asking Cloudflare when the form carries no usable token", async () => {
    const fetchImpl = answering(PASS);
    const verdicts = await Promise.all(
      [undefined, "", 42, "x".repeat(2049)].map((token) =>
        verifyTurnstile(token, "secret", null, fetchImpl),
      ),
    );
    for (const verdict of verdicts) expect(verdict).toEqual({ ok: false, reason: "missing-token" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses what Cloudflare refuses, with its error codes", async () => {
    const answer = { success: false, "error-codes": ["timeout-or-duplicate"] };
    expect(await verifyTurnstile("token", "secret", null, answering(answer))).toEqual({
      ok: false,
      reason: "timeout-or-duplicate",
    });
  });

  it("refuses a token minted for another action or another site", async () => {
    expect(
      await verifyTurnstile("t", "s", null, answering({ ...PASS, action: "login" })),
    ).toMatchObject({ ok: false, reason: "wrong-action" });
    expect(
      await verifyTurnstile("t", "s", null, answering({ ...PASS, hostname: "evil.example" })),
    ).toMatchObject({ ok: false, reason: "wrong-hostname" });
    expect(
      await verifyTurnstile("t", "s", null, answering({ ...PASS, hostname: "nottuxery.store" })),
    ).toMatchObject({ ok: false, reason: "wrong-hostname" });
  });

  it("accepts the answer to Cloudflare's test keys, which carries no action", async () => {
    const answer = {
      success: true,
      hostname: "example.com",
      metadata: { result_with_testing_key: true },
    };
    expect(await verifyTurnstile("t", "s", null, answering(answer))).toEqual({ ok: true });
    expect(
      await verifyTurnstile("t", "s", null, answering({ success: true, hostname: "example.com" })),
    ).toMatchObject({ ok: false, reason: "wrong-action" });
  });

  it("accepts a Preview's hostname", async () => {
    const answer = { ...PASS, hostname: "pr-12.preview.tuxery.store" };
    expect(await verifyTurnstile("t", "s", null, answering(answer))).toEqual({ ok: true });
  });

  it("refuses when siteverify can't be reached or answers an HTTP error", async () => {
    const failing = vi.fn<typeof fetch>(async () => {
      throw new Error("network");
    });
    expect(await verifyTurnstile("t", "s", null, failing)).toEqual({
      ok: false,
      reason: "siteverify-unreachable",
    });
    expect(await verifyTurnstile("t", "s", null, answering({}, 500))).toEqual({
      ok: false,
      reason: "siteverify-http-500",
    });
  });
});
