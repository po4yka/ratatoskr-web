import { useMemo } from "react"
import { useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { BrowseView } from "./browse-view"
import { ConnectionsView } from "./connections-view"
import { notesSource } from "./notes-source"

/** `/notes` lists and connects vaults; `/notes/:connectionId` browses one. */
export default function NotesPage() {
  const gateway = useGateway()
  const source = useMemo(() => notesSource(gateway), [gateway])
  const { connectionId } = useParams()
  return connectionId === undefined ? (
    <ConnectionsView source={source} />
  ) : (
    <BrowseView
      connectionId={connectionId}
      key={connectionId}
      source={source}
    />
  )
}
