import { expect, test } from "@playwright/test"

const credentialKey = "ratatoskr.session.credential"

test("route changes and disclosures keep visible logical focus", async ({
  page,
}) => {
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [credentialKey, "owner-credential"]
  )
  await page.goto("/ops")

  const operationsHeading = page.getByRole("heading", {
    name: /recent operations/i,
  })
  await expect(operationsHeading).toBeFocused()

  await page.keyboard.press("Tab")
  const schedules = page.getByRole("link", { name: "Schedules" })
  await schedules.focus()
  await page.keyboard.press("Enter")
  await expect(
    page.getByRole("heading", { name: /schedule status/i })
  ).toBeFocused()

  const dark = page.getByRole("button", { name: "Dark" })
  await dark.focus()
  await page.keyboard.press("Space")
  await expect(dark).toHaveAttribute("aria-pressed", "true")

  const account = page.getByRole("button", { name: "Account" })
  await account.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(account).toBeFocused()
})

test("skip link reaches the main landmark", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => sessionStorage.setItem(key, value),
    [credentialKey, "owner-credential"]
  )
  await page.goto("/ops")
  await page.keyboard.press("Tab")
  const skip = page.getByRole("link", { name: /skip to content/i })
  await expect(skip).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("main")).toBeFocused()
})
