import { useEffect, useState } from "react"
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
import {
  fixtureSocialAiArchiveSource,
  type Provider,
  type SocialAiArchiveSnapshot,
  type SocialAiArchiveSource,
} from "@/features/social-ai-archive/archive-source"
import {
  ArchiveState,
  FixtureIntegrationNotice,
} from "@/features/social-ai-archive/archive-support"

export default function ConnectionsPage({
  source = fixtureSocialAiArchiveSource,
}: {
  readonly source?: SocialAiArchiveSource
}) {
  const [snapshot, setSnapshot] = useState<SocialAiArchiveSnapshot | null>(null)
  const [pending, setPending] = useState<Provider | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  useEffect(() => {
    source.read().then(setSnapshot)
  }, [source])
  if (!snapshot) return <ArchiveState title="Loading provider connections" />
  async function disconnect() {
    if (!pending) return
    setSnapshot(await source.disconnect(pending))
    setStatus(
      `${pending} disconnected in this fixture; no provider-side revocation was claimed.`
    )
    setPending(null)
  }
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-heading-sm font-semibold">Provider connections</h1>
      </header>
      <FixtureIntegrationNotice surface="Provider connections" />
      <ul className="flex flex-col gap-3" role="list">
        {snapshot.connections.map((connection) => (
          <li
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
            key={connection.provider}
          >
            <h2 className="text-subheading font-semibold">
              {connection.provider}
            </h2>
            <p className="mt-1 text-body">
              Authorization: {connection.authorizationStatus}
            </p>
            {connection.authorizationUrl ? (
              <a
                className="mt-3 inline-block text-body font-medium hover:underline"
                href={connection.authorizationUrl}
              >
                Connect {connection.provider} with OAuth
              </a>
            ) : (
              <p className="mt-3 text-body text-muted-foreground">
                {connection.provider} authorization cannot start because this
                source supplied no authorization URL.
              </p>
            )}
            {connection.connected ? (
              <Button
                className="mt-4"
                onClick={() => setPending(connection.provider)}
                variant="outline"
              >
                Disconnect {connection.provider}
              </Button>
            ) : (
              <p className="mt-3 text-body">Disconnected</p>
            )}
          </li>
        ))}
      </ul>
      {status ? <p role="status">{status}</p> : null}
      <DisconnectDialog
        provider={pending}
        onCancel={() => setPending(null)}
        onConfirm={() => void disconnect()}
      />
    </section>
  )
}

function DisconnectDialog({
  onCancel,
  onConfirm,
  provider,
}: {
  readonly onCancel: () => void
  readonly onConfirm: () => void
  readonly provider: Provider | null
}) {
  return (
    <AlertDialog
      onOpenChange={(open) => !open && onCancel()}
      open={provider !== null}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {provider}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the current fixture connection for {provider}.
            Provider-side revocation is not claimed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep connected</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Disconnect {provider}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
