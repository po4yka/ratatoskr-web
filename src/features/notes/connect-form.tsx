import { useState, type ComponentProps, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConnectProgress } from "./connect-progress"
import {
  describeNotesFailure,
  type ConnectSync,
  type NotesSource,
} from "./notes-source"

interface Plain {
  readonly vaultKey: string
  readonly name: string
  readonly email: string
}

/** The typed secrets. They live here until the request ends, and no longer. */
interface Secrets {
  readonly password: string
  readonly mfa: string
  readonly e2e: string
}

const NO_SECRETS: Secrets = { password: "", mfa: "", e2e: "" }

function problemOf({
  plain,
  secrets,
  accepted,
}: {
  readonly plain: Plain
  readonly secrets: Secrets
  readonly accepted: boolean
}) {
  if (!plain.vaultKey.trim() || !plain.name.trim())
    return "Type the remote vault ID and a vault name."
  if (!plain.email.includes("@") || !secrets.password)
    return "Type your Obsidian email and password."
  if (!accepted) return "Accept the notice before you connect the vault."
  return null
}

function bodyOf(plain: Plain, secrets: Secrets): ConnectSync {
  return {
    channel: "sync",
    vault_key: plain.vaultKey.trim(),
    vault_display_name: plain.name.trim(),
    sync_login: {
      email: plain.email.trim(),
      password: secrets.password,
      ...(secrets.mfa ? { mfa_code: secrets.mfa.trim() } : {}),
      ...(secrets.e2e ? { e2e_password: secrets.e2e } : {}),
    },
  }
}

function Field({
  id,
  label,
  ...input
}: {
  readonly id: string
  readonly label: string
} & ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body font-medium" htmlFor={id}>
        {label}
      </label>
      <Input id={id} {...input} />
    </div>
  )
}

/** The connect flow for the `sync` channel, with the server-access notice. */
// eslint-disable-next-line max-lines-per-function -- one form owns its fields, notice and result.
export function ConnectForm({
  source,
  onChanged,
}: {
  readonly source: NotesSource
  readonly onChanged: () => void
}) {
  const [plain, setPlain] = useState<Plain>({
    vaultKey: "",
    name: "",
    email: "",
  })
  const [secrets, setSecrets] = useState<Secrets>(NO_SECRETS)
  const [accepted, setAccepted] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [operationId, setOperationId] = useState<string | null>(null)
  const plainField = (key: keyof Plain) => ({
    value: plain[key],
    onChange: (event: { target: { value: string } }) =>
      setPlain((current) => ({ ...current, [key]: event.target.value })),
  })
  const secretField = (key: keyof Secrets) => ({
    type: "password",
    autoComplete: "off",
    value: secrets[key],
    onChange: (event: { target: { value: string } }) =>
      setSecrets((current) => ({ ...current, [key]: event.target.value })),
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = problemOf({ plain, secrets, accepted })
    setProblem(found)
    if (found !== null) return
    setPending(true)
    setOperationId(null)
    try {
      const answer = await source.connect(bodyOf(plain, secrets))
      setOperationId(answer.operation_id)
      onChanged()
    } catch (failure) {
      setProblem(
        describeNotesFailure(failure, "The vault could not be connected.")
      )
    } finally {
      setSecrets(NO_SECRETS)
      setPending(false)
    }
  }

  return (
    <section
      aria-labelledby="notes-connect-heading"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <h2 className="text-heading-sm font-semibold" id="notes-connect-heading">
        Connect a vault with Obsidian Sync
      </h2>
      <form
        className="mt-4 flex flex-col gap-4"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        <Field
          id="notes-vault-key"
          label="Remote vault ID"
          {...plainField("vaultKey")}
        />
        <Field
          id="notes-vault-name"
          label="Vault name"
          {...plainField("name")}
        />
        <Field
          id="notes-email"
          label="Obsidian email"
          type="email"
          autoComplete="off"
          {...plainField("email")}
        />
        <Field
          id="notes-password"
          label="Obsidian password"
          {...secretField("password")}
        />
        <Field
          id="notes-mfa"
          label="MFA code (if your account uses MFA)"
          inputMode="numeric"
          {...secretField("mfa")}
        />
        <div className="rounded-lg border border-border p-4">
          <p className="text-body" id="notes-notice">
            Ratatoskr keeps a full copy of this vault on your server. The server
            can read every file of the vault, also when the vault uses
            end-to-end encryption. Give the end-to-end encryption password only
            if you accept this.
          </p>
          <label className="mt-3 flex items-center gap-2 text-body font-medium">
            <input
              aria-describedby="notes-notice"
              checked={accepted}
              className="size-4"
              onChange={(event) => {
                setAccepted(event.target.checked)
                if (!event.target.checked)
                  setSecrets((current) => ({ ...current, e2e: "" }))
              }}
              type="checkbox"
            />
            I accept that the server can read every file of this vault
          </label>
        </div>
        {accepted ? (
          <Field
            id="notes-e2e"
            label="End-to-end encryption password (if the vault uses one)"
            {...secretField("e2e")}
          />
        ) : null}
        {problem ? (
          <p className="text-body text-destructive" role="alert">
            {problem}
          </p>
        ) : null}
        <Button className="self-start" disabled={pending} type="submit">
          {pending ? "Connecting vault…" : "Connect vault"}
        </Button>
      </form>
      {operationId ? (
        <ConnectProgress onFinished={onChanged} operationId={operationId} />
      ) : null}
    </section>
  )
}
