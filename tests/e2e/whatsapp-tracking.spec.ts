import { expect, test } from "@playwright/test";

type CapturedGtag = [string, string, Record<string, unknown>?];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: Date.now(),
      version: "1.0",
    };
    localStorage.setItem("byimperiodog_consent_v1", JSON.stringify(state));

    const captured: CapturedGtag[] = [];
    Object.defineProperty(window, "__capturedGtag", {
      configurable: true,
      value: captured,
    });
    Object.defineProperty(window, "gtag", {
      configurable: true,
      writable: true,
      value: (...args: CapturedGtag) => captured.push(args),
    });

    window.addEventListener("DOMContentLoaded", () => {
      document.addEventListener(
        "click",
        (event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-analytics="whatsapp-click"]')
          ) {
            event.preventDefault();
          }
        },
        true,
      );
    });
  });
});

test("todos os links de contato da home ficam instrumentados e um clique gera um evento", async ({
  page,
}) => {
  await page.goto("/");

  const contactLinks = page.locator(
    'a[href*="wa.me/5511968633239"],a[href*="api.whatsapp.com"][href*="5511968633239"],a[href*="web.whatsapp.com"][href*="5511968633239"],a[href^="whatsapp:"][href*="5511968633239"]',
  );
  const total = await contactLinks.count();
  expect(total).toBeGreaterThan(0);

  await expect
    .poll(async () =>
      contactLinks.evaluateAll(
        (links) => links.filter((link) => link.getAttribute("data-analytics") !== "whatsapp-click").length,
      ),
    )
    .toBe(0);

  const before = await page.evaluate(
    () =>
      ((window as unknown as { __capturedGtag: CapturedGtag[] }).__capturedGtag ?? []).filter(
        (args) => args[0] === "event" && args[1] === "whatsapp_click",
      ).length,
  );
  expect(before).toBe(0);

  await page.locator('[data-wa-placement="hero"][data-analytics="whatsapp-click"]').first().click();

  const events = await page.evaluate(() =>
    ((window as unknown as { __capturedGtag: CapturedGtag[] }).__capturedGtag ?? [])
      .filter((args) => args[0] === "event" && args[1] === "whatsapp_click")
      .map((args) => args[2]),
  );
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    channel: "whatsapp",
    cta_location: "hero",
    page_path: "/",
    content_type: "home",
  });
  expect(JSON.stringify(events[0])).not.toMatch(/phone|telefone|email|message|mensagem|gclid/i);
});
