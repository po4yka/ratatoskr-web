import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function expectManifestDetailsFit(page: Page) {
  const overflow = await page
    .locator('section[aria-labelledby="site-manifest-heading"] dl')
    .evaluate((list) => {
      const right = list.getBoundingClientRect().right
      return Array.from(list.querySelectorAll("dd"))
        .map((cell, index) => ({
          index,
          overflows:
            cell.scrollWidth > cell.clientWidth + 1 ||
            cell.getBoundingClientRect().right > right + 1,
        }))
        .filter((cell) => cell.overflows)
        .map((cell) => cell.index)
    })
  expect(overflow).toEqual([])
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 320, height: 900 },
]) {
  test(`${viewport.name}: repository approval, keyboard and stale error`, async ({
    page,
  }, info) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.addInitScript(() =>
      sessionStorage.setItem("ratatoskr.session.credential", "owner-credential")
    )
    let binding: { repository: string; repository_id: string } | null = {
      repository: "new-owner/documentation-site",
      repository_id: "1420131953",
    }
    const digest = "3".repeat(64)
    await page.route("**/v1/sites", async (route) =>
      route.fulfill({
        json: {
          sites: [
            {
              site_id: "blog",
              submitted_manifest_sha256: digest,
              approved_manifest_sha256: "2".repeat(64),
              approval_state: "approved",
            },
          ],
        },
      })
    )
    await page.route("**/v1/sites/blog/manifest", async (route) =>
      route.fulfill({
        json: {
          site_id: "blog",
          manifest_sha256: digest,
          hostname: "blog.example.org",
          github_repository: binding,
          publications: [],
          capabilities: ["pages.read"],
        },
      })
    )
    await page.route("**/v1/sites/blog/publications", async (route) =>
      route.fulfill({ json: { publications: [] } })
    )
    await page.route("**/v1/sites/blog/releases**", async (route) =>
      route.fulfill({
        json: { current_release_id: null, releases: [], failed_builds: [] },
      })
    )
    await page.route("**/v1/notes/connections", async (route) =>
      route.fulfill({ json: { connections: [] } })
    )
    const approvals: unknown[] = []
    await page.route("**/v1/sites/blog/manifest/approval", async (route) => {
      approvals.push(route.request().postDataJSON())
      await route.fulfill({
        status: 409,
        json: {
          code: "platform.site.manifest_digest_stale",
          message: "The manifest changed.",
          retryable: false,
          partial_effects: false,
        },
      })
    })
    await page.goto("/sites/blog")
    await expect(page.getByText(binding.repository)).toBeVisible()
    await expect(page.getByText(binding.repository_id)).toBeVisible()
    const approve = page.getByRole("button", { name: "Approve this manifest" })
    await expect(approve).toBeEnabled()
    await approve.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByText(/A newer manifest became active/)).toBeVisible()
    expect(approvals).toEqual([{ manifest_sha256: digest }])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth
      )
    ).toBeLessThanOrEqual(1)
    await expectManifestDetailsFit(page)
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
    expect(
      accessibility.violations.filter(
        (issue) => issue.impact === "serious" || issue.impact === "critical"
      )
    ).toEqual([])
    await page.screenshot({
      path: info.outputPath(`repository-${viewport.name}.png`),
      fullPage: true,
    })
    binding = null
    await page.reload()
    await expect(approve).toBeDisabled()
    await expect(page.getByText("Not bound", { exact: true })).toHaveCount(2)
    await expectManifestDetailsFit(page)
    await page.screenshot({
      path: info.outputPath(`unbound-${viewport.name}.png`),
      fullPage: true,
    })
    expect(approvals).toHaveLength(1)
  })
}
