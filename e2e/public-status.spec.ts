import { expect, test } from "@playwright/test"

const mockUrl = "http://127.0.0.1:4310"

test.beforeEach(async ({ request }) => {
  await request.post(`${mockUrl}/__mock/reset`)
  await request.post(`${mockUrl}/__mock/scenario`, {
    data: { scenario: "degraded" },
  })
})

test("anonymous degraded status stays outside session boot", async ({
  page,
  request,
}) => {
  await page.goto("/status")

  await expect(
    page.getByRole("heading", { name: /system status/i })
  ).toBeVisible()
  await expect(page.getByText(/^degraded$/i).first()).toBeVisible()
  await expect(page.getByText(/command delivery/i)).toBeVisible()
  await expect(page.getByText(/stale/i)).toBeVisible()
  await expect(page).toHaveURL(/\/status$/)

  const response = await request.get(`${mockUrl}/__mock/requests`)
  const calls = (await response.json()) as {
    method: string
    path: string
    authenticated: boolean
  }[]
  expect(calls.length).toBeGreaterThan(0)
  expect(calls.every((call) => call.method === "GET")).toBe(true)
  expect(calls.every((call) => call.path === "/v1/status")).toBe(true)
  expect(calls.every((call) => !call.authenticated)).toBe(true)

  await page.getByRole("button", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(
    page.getByRole("heading", { name: /system status/i })
  ).toBeVisible()
})

test("offline status remains an explicit unknown result", async ({ page }) => {
  await page.route("**/v1/status", (route) => route.abort("connectionfailed"))
  await page.goto("/status")

  await expect(
    page.getByRole("heading", { name: /current status is unreachable/i })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible()
  await expect(page.getByText(/^operational$/i)).toHaveCount(0)
})
