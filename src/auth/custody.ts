/**
 * Where the bearer credential lives between requests.
 *
 * The storage decision is ADR-0006: sessionStorage, one key, discarded
 * completely on sign-out or confirmed revocation. Revisiting that decision
 * means editing this file and the ADR, not the session store or the shell.
 */
const CUSTODY_KEY = "ratatoskr.session.credential"

export function storeCustody(credential: string): void {
  sessionStorage.setItem(CUSTODY_KEY, credential)
}

/** The live credential, or null when none is held. */
export function readCustody(): string | null {
  return sessionStorage.getItem(CUSTODY_KEY)
}

export function discardCustody(): void {
  sessionStorage.removeItem(CUSTODY_KEY)
}
