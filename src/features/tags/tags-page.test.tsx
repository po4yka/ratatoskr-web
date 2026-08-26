import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import TagsPage from "@/features/tags/tags-page"
import {
  createFixtureCurationSource,
  type CurationSource,
} from "@/features/collections/curation-source"

function renderTags(source: CurationSource) {
  return render(
    <MemoryRouter>
      <TagsPage source={source} />
    </MemoryRouter>
  )
}

describe("TagsPage", () => {
  it("shows tag counts and renames a tag", async () => {
    renderTags(createFixtureCurationSource())

    expect(await screen.findByText(/contracts.*1 record/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/rename contracts/i), {
      target: { value: "contracts-v1" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save contracts/i }))

    expect(await screen.findByLabelText(/rename contracts-v1/i)).toHaveValue(
      "contracts-v1"
    )
  })

  it("previews the records and resulting count before merge", async () => {
    renderTags(createFixtureCurationSource())

    fireEvent.change(await screen.findByLabelText(/source tag/i), {
      target: { value: "provenance" },
    })
    fireEvent.change(screen.getByLabelText(/target tag/i), {
      target: { value: "contracts" },
    })

    expect(
      await screen.findByText(/document ir: evidence at the boundary/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/contracts will contain 1 record/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /merge provenance into contracts/i })
    ).toBeEnabled()
  })

  it("rolls back a rejected merge", async () => {
    const base = createFixtureCurationSource()
    const source: CurationSource = {
      read: base.read,
      mutate: async (command) => {
        if (command.kind === "merge-tags") throw new Error("merge rejected")
        return base.mutate(command)
      },
    }
    renderTags(source)

    fireEvent.change(await screen.findByLabelText(/source tag/i), {
      target: { value: "provenance" },
    })
    fireEvent.change(screen.getByLabelText(/target tag/i), {
      target: { value: "contracts" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: /merge provenance into contracts/i })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /previous view was restored/i
    )
    expect(screen.getByLabelText(/rename provenance/i)).toHaveValue(
      "provenance"
    )
  })
})
