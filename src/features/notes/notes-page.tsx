import { useMemo } from "react"
import { useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { BrowseView } from "./browse-view"
import { ConflictView } from "./conflict-view"
import { ConnectionsView } from "./connections-view"
import { notesSource } from "./notes-source"

/**
 * `/notes` lists and connects vaults; `/notes/:connectionId` browses one;
 * `/notes/conflicts/:conflictId` resolves one conflict of a write.
 */
export default function NotesPage() {
  const gateway = useGateway()
  const source = useMemo(() => notesSource(gateway), [gateway])
  const { connectionId, conflictId } = useParams()
  if (conflictId !== undefined)
    return <ConflictView conflictId={conflictId} key={conflictId} />
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
