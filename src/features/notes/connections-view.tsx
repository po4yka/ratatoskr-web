import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ConnectForm } from "./connect-form"
import {
  describeNotesFailure,
  type NotesConnection,
  type NotesSource,
} from "./notes-source"

type ListState =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "ready"; readonly connections: readonly NotesConnection[] }

const STATE_TEXT: Readonly<Record<string, string>> = {
  connecting: "Connecting",
  active: "Active",
  failed: "Failed",
  login_expired: "Login expired: disconnect the vault and connect it again",
}

function ConnectionItem({
  connection,
  onDisconnect,
}: {
  readonly connection: NotesConnection
  readonly onDisconnect: (connection: NotesConnection) => void
}) {
  const nameId = `notes-connection-${connection.connection_id}`
  return (
    <li
      aria-labelledby={nameId}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <div>
        <Link
          className="text-subheading font-semibold hover:underline"
          id={nameId}
          to={`/notes/${encodeURIComponent(connection.connection_id)}`}
        >
          {connection.vault_display_name}
        </Link>
        <p className="mt-1 text-body text-muted-foreground">
          Channel: {connection.channel} · State:{" "}
          {STATE_TEXT[connection.state] ?? connection.state}
        </p>
      </div>
      <Button onClick={() => onDisconnect(connection)} variant="outline">
        Disconnect {connection.vault_display_name}
      </Button>
    </li>
  )
}

function ConnectionList({
  state,
  onDisconnect,
}: {
  readonly state: ListState
  readonly onDisconnect: (connection: NotesConnection) => void
}) {
  if (state.kind === "loading")
    return <p role="status">Loading the vault connections</p>
  if (state.kind === "failed")
    return (
      <p className="text-body text-destructive" role="alert">
        {state.message}
      </p>
    )
  if (state.connections.length === 0)
    return (
      <p className="text-body text-muted-foreground">No vault is connected.</p>
    )
  return (
    <ul className="flex flex-col gap-3">
      {state.connections.map((connection) => (
        <ConnectionItem
          connection={connection}
          key={connection.connection_id}
          onDisconnect={onDisconnect}
        />
      ))}
    </ul>
  )
}

function DisconnectDialog({
  connection,
  onCancel,
  onConfirm,
}: {
  readonly connection: NotesConnection | null
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const name = connection?.vault_display_name
  return (
    <AlertDialog
      onOpenChange={(open) => !open && onCancel()}
      open={connection !== null}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ratatoskr stops the sync of {name}, deletes its copy of the vault
            and its index, and deletes the stored passwords. The vault in
            Obsidian does not change.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep the vault connected</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Disconnect vault
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** The connection list, the connect flow and the confirmed disconnect. */
export function ConnectionsView({ source }: { readonly source: NotesSource }) {
  const [state, setState] = useState<ListState>({ kind: "loading" })
  const [pending, setPending] = useState<NotesConnection | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const reload = useCallback(() => {
    source.connections().then(
      (connections) => setState({ kind: "ready", connections }),
      (failure: unknown) =>
        setState({
          kind: "failed",
          message: describeNotesFailure(
            failure,
            "The vault connections could not load."
          ),
        })
    )
  }, [source])
  useEffect(reload, [reload])

  async function disconnect() {
    if (pending === null) return
    const name = pending.vault_display_name
    setPending(null)
    try {
      await source.disconnect(pending.connection_id)
      setOutcome(`${name} is disconnected.`)
    } catch (failure) {
      setOutcome(describeNotesFailure(failure, `${name} was not disconnected.`))
    }
    reload()
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-heading font-semibold">Obsidian vaults</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Ratatoskr reads the connected vaults. It does not change their files.
        </p>
      </header>
      <ConnectionList onDisconnect={setPending} state={state} />
      <p aria-live="polite" className="text-body" role="status">
        {outcome}
      </p>
      <ConnectForm onChanged={reload} source={source} />
      <DisconnectDialog
        connection={pending}
        onCancel={() => setPending(null)}
        onConfirm={() => void disconnect()}
      />
    </section>
  )
}
