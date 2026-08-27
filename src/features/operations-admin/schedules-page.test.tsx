import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { components } from "@/api/generated/schema"
import { forbidden, offline, renderOwnerView } from "@/test/owner-view-harness"

type Page = components["schemas"]["ScheduleInspectionPage"]

const schedulePage: Page = {
  items: [
    {
      schedule_id: "018f0000-0000-7000-8000-000000000010",
      service_name: "telegram",
      name: "daily_sync",
      owner_user_id: "018f0000-0000-7000-8000-000000000099",
      enabled: true,
      next_due_at: "2026-08-28T10:00:00Z",
    },
    {
      schedule_id: "018f0000-0000-7000-8000-000000000011",
      service_name: "github",
      name: "weekly_backup",
      owner_user_id: "018f0000-0000-7000-8000-000000000099",
      enabled: false,
      next_due_at: "2026-08-29T10:00:00Z",
      last_outcome: "failed",
    },
  ],
  next_cursor: "schedule-page-two",
}

describe("schedule inspector", () => {
  it("announces a pending bounded read", async () => {
    renderOwnerView({
      path: "/ops/schedules",
      response: () => new Promise(() => {}),
    })
    expect(await screen.findByText(/loading schedules/i)).toHaveAttribute(
      "role",
      "status"
    )
  })

  it("renders unknown disabled and failed schedule truthfully", async () => {
    const { requests } = renderOwnerView({
      path: "/ops/schedules",
      response: schedulePage,
    })

    expect(
      await screen.findByRole("heading", { name: /schedule status/i })
    ).toBeInTheDocument()
    expect(await screen.findByText(/not run yet/i)).toBeInTheDocument()
    expect(screen.getByText(/^disabled$/i)).toBeInTheDocument()
    expect(screen.getByText(/^failed$/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /next page/i }))
    await waitFor(() =>
      expect(requests.some((path) => path.includes("schedule-page-two"))).toBe(
        true
      )
    )
  })

  it("separates empty offline and forbidden schedules", async () => {
    const empty = renderOwnerView({
      path: "/ops/schedules",
      response: { items: [] },
    })
    expect(
      await screen.findByText(/no schedules were returned/i)
    ).toBeInTheDocument()
    empty.unmount()
    cleanup()

    renderOwnerView({
      path: "/ops/schedules",
      response: () => Promise.reject(offline),
    })
    expect(await screen.findByRole("alert")).toHaveTextContent(/offline/i)
    cleanup()

    renderOwnerView({
      path: "/ops/schedules",
      response: () => Promise.reject(forbidden),
    })
    expect(
      await screen.findByRole("heading", { name: /owner access is required/i })
    ).toBeInTheDocument()
  })
})
