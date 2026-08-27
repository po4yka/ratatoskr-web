import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const credentialKey = "ratatoskr.session.credential"

const routes = [
  { name: "status", path: "/status", credential: null },
  { name: "member ops", path: "/ops", credential: "member-credential" },
  { name: "owner operations", path: "/ops", credential: "owner-credential" },
  {
    name: "owner schedules",
    path: "/ops/schedules",
    credential: "owner-credential",
  },
  { name: "owner audit", path: "/ops/audit", credential: "owner-credential" },
  { name: "login", path: "/login", credential: null },
  { name: "search", path: "/", credential: "owner-credential" },
  {
    name: "reader",
    path: "/documents/document-ir",
    credential: "owner-credential",
  },
] as const

const themes = ["light", "dark"] as const
const viewports = [
  { name: "narrow", width: 320, height: 720 },
  { name: "wide", width: 1280, height: 800 },
] as const

for (const route of routes) {
  for (const theme of themes) {
    for (const viewport of viewports) {
      test(`${route.name} · ${theme} · ${viewport.name} has no serious axe finding`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport)
        await page.addInitScript(
          ({ credential, key, selectedTheme }) => {
            localStorage.setItem("theme", selectedTheme)
            if (credential) sessionStorage.setItem(key, credential)
          },
          {
            credential: route.credential,
            key: credentialKey,
            selectedTheme: theme,
          }
        )
        await page.goto(route.path)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
        const blocking = result.violations.filter(
          (violation) =>
            violation.impact === "serious" || violation.impact === "critical"
        )
        expect(blocking).toEqual([])
        expect(await page.getByRole("main").count()).toBe(1)

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
        expect(overflow).toBeLessThanOrEqual(1)

        const smallTargets = await page
          .locator("a, button, input, select, textarea")
          .evaluateAll((elements) =>
            elements.flatMap((element) => {
              if (element.classList.contains("sr-only")) return []
              const rect = element.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0) return []
              return rect.width < 24 || rect.height < 24
                ? [
                    `${element.tagName}:${Math.round(rect.width)}x${Math.round(rect.height)}`,
                  ]
                : []
            })
          )
        expect(smallTargets).toEqual([])
      })
    }
  }
}
