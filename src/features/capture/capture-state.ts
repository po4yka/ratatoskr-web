export type CaptureSubmitter = (
  url: string,
  idempotencyKey: string
) => Promise<string>

export function validateCaptureUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.host
        ? null
        : "Enter a URL with a host."
      : "Enter an HTTP or HTTPS URL."
  } catch {
    return "Enter an HTTP or HTTPS URL."
  }
}

function key(): string {
  return crypto.randomUUID()
}

/** Holds exactly one replay key for an in-flight user intent. */
export class CaptureSubmission {
  private readonly pending = new Map<string, string>()
  private readonly submitter: CaptureSubmitter

  constructor(submitter: CaptureSubmitter) {
    this.submitter = submitter
  }

  async submit(url: string): Promise<string> {
    const problem = validateCaptureUrl(url)
    if (problem) throw new Error(problem)
    const idempotencyKey = this.pending.get(url) ?? key()
    this.pending.set(url, idempotencyKey)
    const operationId = await this.submitter(url, idempotencyKey)
    this.pending.delete(url)
    return operationId
  }

  async retryTerminal(url: string): Promise<string> {
    this.pending.delete(url)
    return this.submit(url)
  }
}
