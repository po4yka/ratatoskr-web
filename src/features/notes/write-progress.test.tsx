import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { GatewayProvider } from "@/api/gateway/context"
import { gatewayOf } from "@/test/app-harness"
import { WriteProgress } from "./write-progress"
import { writeOperation } from "./write-fixtures"

describe("the progress of a write", () => {
  it("runs onSucceeded once for a succeeded operation, also after renders", async () => {
    const gateway = gatewayOf(async () =>
      writeOperation("notes.file.write", "succeeded")
    )
    const succeeded = vi.fn()
    const view = (label: string) => (
      <GatewayProvider gateway={gateway}>
        <WriteProgress
          done={label}
          onSucceeded={() => succeeded()}
          operationId="operation-7"
        />
      </GatewayProvider>
    )
    const { rerender } = render(view("Saved."))
    await screen.findByText("Saved.")

    rerender(view("Saved again."))
    rerender(view("Saved a third time."))
    await screen.findByText("Saved a third time.")

    expect(succeeded).toHaveBeenCalledTimes(1)
  })
})
