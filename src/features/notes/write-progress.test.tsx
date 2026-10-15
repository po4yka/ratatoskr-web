import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { GatewayProvider } from "@/api/gateway/context"
import { gatewayOf } from "@/test/app-harness"
import { WriteProgress } from "./write-progress"
import { writeOperation } from "./write-fixtures"

/** Mount the progress of one operation that the gateway answers with `snapshot`. */
async function progressOf(snapshot: object) {
  const gateway = gatewayOf(async () => snapshot)
  render(
    <GatewayProvider gateway={gateway}>
      <WriteProgress done="Saved." operationId="operation-7" />
    </GatewayProvider>
  )
}

describe("the progress of a write", () => {
  it.each([
    [
      "awaiting_device",
      "The change waits for the device of the vault. The device applies it when it connects.",
    ],
    [
      "awaiting_obsidian",
      "The change waits for the copy of the vault on the server and for Obsidian Sync.",
    ],
  ])("names the stage %s of a running write", async (stage, text) => {
    await progressOf({
      ...writeOperation("notes.file.write", "running"),
      stage,
    })

    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it.each([
    [
      "notes.write.unsafe_path",
      {
        kind: "notes.file.write",
        text: "A folder of this path is a symbolic link, or a file is where a folder must be. Ratatoskr did not write the change.",
      },
    ],
    [
      "notes.write.unsupported",
      {
        kind: "notes.file.write",
        text: "The file is not UTF-8 text, or its frontmatter has no end. Ratatoskr cannot change this file.",
      },
    ],
    [
      "notes.sync.reconfigure_failed",
      {
        kind: "notes.connection.write_mode",
        text: "The sync client did not start again with the new write mode. Try again.",
      },
    ],
  ])("names the failure %s of a write", async (code, { kind, text }) => {
    await progressOf({
      ...writeOperation(kind, "failed"),
      errors: [
        {
          code,
          message: "The vault did not apply the write.",
          retryable: false,
        },
      ],
    })

    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it("names the warning notes.write.transformed of a succeeded write", async () => {
    await progressOf({
      ...writeOperation("notes.file.write", "succeeded"),
      warnings: [
        {
          code: "notes.write.transformed",
          message: "The vault acknowledged other bytes.",
        },
      ],
    })

    expect(
      await screen.findByText(
        "The vault changed the file when it saved it, for example a plugin formatted it. The saved version is now the current one."
      )
    ).toBeInTheDocument()
  })

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
