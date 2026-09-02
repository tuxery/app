import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LuUserCheck, LuShieldCheck, LuPencilLine } from "@qwikest/icons/lucide";
import { getAppById } from "~/catalog";
import { resolveServerEnv } from "~/server-env";

// `?app=<id>` is optional, purely cosmetic (a "Claim <name>" headline
// instead of the generic one) — the page itself is the same static
// explainer either way, no per-app content. A bad/missing id just falls
// back to the generic heading rather than a 404, since arriving here
// straight from a bookmark or a shared link should still work.
export const useClaimedApp = routeLoader$(async (requestEvent) => {
  const appId = requestEvent.url.searchParams.get("app");
  if (!appId) return null;
  const app = await getAppById(resolveServerEnv(requestEvent.platform), appId);
  return app ? { id: app.id, name: app.name } : null;
});

const PREREQUISITES = [
  {
    icon: LuUserCheck,
    title: "User accounts",
    body: "Claiming has to be tied to a real, logged-in identity — there's no login system yet.",
  },
  {
    icon: LuShieldCheck,
    title: "A certification process",
    body: "How to actually confirm someone is the real developer or publisher, not just someone who says so, is still an open question.",
  },
  {
    icon: LuPencilLine,
    title: "Per-field editing",
    body: "Today's source overrides are binary include/exclude/merge decisions on the whole listing — not a way for a developer to edit their own entry field by field.",
  },
];

export default component$(() => {
  const claimedApp = useClaimedApp();
  const app = claimedApp.value;

  return (
    <div class="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2">{app ? `Claim ${app.name}` : "Claim your listing"}</h1>
        <p class="text-base-content/70">
          Not live yet — claiming a listing needs three things Tuxery doesn't have today.
        </p>
      </div>

      <ul class="flex flex-col gap-4">
        {PREREQUISITES.map(({ icon: Icon, title, body }) => (
          <li key={title} class="flex gap-3">
            <Icon class="text-xl text-base-content/50 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium">{title}</p>
              <p class="text-sm text-base-content/70">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <p class="text-sm text-base-content/60">
        Got a question, or a problem in the meantime?{" "}
        <a href="/contribute/" class="link link-primary">
          Get in touch
        </a>
        .
      </p>

      {app && (
        <a href={`/app/${encodeURIComponent(app.id)}/`} class="link link-primary text-sm">
          ← Back to {app.name}
        </a>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Claim your listing — Tuxery",
  meta: [
    {
      name: "description",
      content: "Claiming an app or game's listing isn't live yet — here's what's still needed.",
    },
  ],
};
