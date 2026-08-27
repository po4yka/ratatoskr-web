import { expect, test } from "@playwright/test"

const mockUrl = "http://127.0.0.1:4310"
const credentialKey = "ratatoskr.session.credential"

test.beforeEach(async ({ request }) => {
  await request.post(`${mockUrl}/__mock/reset`)
})

test("owner reads bounded operational views without private diagnostics", async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [credentialKey, "owner-credential"]
  )
  await page.goto("/ops")

  await expect(
    page.getByRole("heading", { name: /recent operations/i })
  ).toBeVisible()
  await expect(page.getByText(/^failed$/i)).toBeVisible()
  await expect(page.getByText(/partially succeeded/i)).toBeVisible()
  await expect(page.getByText("content.extraction.failed")).toBeVisible()
  await expect(page.getByText(/stack|payload|diagnostic/i)).toHaveCount(0)

  await page.getByRole("link", { name: "Schedules" }).click()
  await expect(
    page.getByRole("heading", { name: /schedule status/i })
  ).toBeVisible()
  await expect(page.getByText(/^disabled$/i)).toBeVisible()
  await expect(page.getByText(/^failed$/i)).toBeVisible()

  await page.getByRole("link", { name: "Audit" }).click()
  await expect(page.getByRole("heading", { name: /audit trail/i })).toBeVisible()
  await expect(page.getByText("operation.read")).toBeVisible()
  await expect(page.getByText(/unknown actor/i)).toBeVisible()
})

test("member cannot discover or deep-link to owner operations", async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [credentialKey, "member-credential"]
  )
  await page.goto("/ops")

  await expect(
    page.getByRole("heading", {
      name: /not available in this deployment/i,
    })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /^operations$/i })).toHaveCount(0)
})
