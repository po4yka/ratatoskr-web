import type { components } from "../generated/schema"
import { describe, expect, it } from "vitest"
import { API_ERROR_KINDS, normalizeHttpFailure } from "./errors"

type ErrorEnvelope = components["schemas"]["ErrorEnvelope"]
type FieldViolation = components["schemas"]["FieldViolation"]

/**
 * Fixtures typed against the generated contract on purpose: if the platform
 * moves `ErrorEnvelope`, these lines stop compiling and the drift is visible
 * in this suite instead of in a user's session.
 */
const violation: FieldViolation = {
  code: "platform.capture.url_invalid",
  field_path: "/url",
  message: "The address has no usable host.",
}

const fullEnvelope: ErrorEnvelope = {
  code: "platform.validation.failed",
  correlation_id: "operation:018f0000-0000-7000-8000-000000000001",
  field_violations: [violation],
  message: "The request was rejected.",
  retryable: false,
  trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
}

describe("error normalization from the platform contract", () => {
  it("maps each HTTP status to its documented kind", () => {
    expect(normalizeHttpFailure(400, fullEnvelope).kind).toBe("invalid")
    expect(normalizeHttpFailure(401, fullEnvelope).kind).toBe("unauthenticated")
    expect(normalizeHttpFailure(403, fullEnvelope).kind).toBe("forbidden")
    expect(normalizeHttpFailure(404, fullEnvelope).kind).toBe("not-found")
    expect(normalizeHttpFailure(501, fullEnvelope).kind).toBe("unsupported")
    expect(normalizeHttpFailure(409, fullEnvelope).kind).toBe("terminal")
  })

  it("carries every field the platform envelope supplied", () => {
    const error = normalizeHttpFailure(400, fullEnvelope)
    expect(error.status).toBe(400)
    expect(error.code).toBe("platform.validation.failed")
    expect(error.message).toBe("The request was rejected.")
    expect(error.retryable).toBe(false)
    expect(error.correlationId).toBe(
      "operation:018f0000-0000-7000-8000-000000000001"
    )
    expect(error.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736")
    expect(error.fieldViolations).toEqual([
      {
        code: "platform.capture.url_invalid",
        field_path: "/url",
        message: "The address has no usable host.",
      },
    ])
  })

  it("carries nothing when the envelope omits it", () => {
    const sparse: ErrorEnvelope = {
      code: "platform.operation.not_found",
      message: "The requested document does not exist.",
      retryable: false,
    }

    const error = normalizeHttpFailure(404, sparse)

    expect(error.kind).toBe("not-found")
    expect(error.code).toBe("platform.operation.not_found")
    expect(error.message).toBe("The requested document does not exist.")
    expect(error.retryable).toBe(false)
    expect(error.correlationId).toBeUndefined()
    expect(error.traceId).toBeUndefined()
    expect(error.fieldViolations).toBeUndefined()
  })

  it("classifies an unparseable body by status without inventing fields", () => {
    for (const body of ["<html>Gateway Timeout</html>", null, undefined]) {
      const error = normalizeHttpFailure(404, body)

      expect(error.kind).toBe("not-found")
      expect(error.code).toBeUndefined()
      expect(error.message).toBeUndefined()
      expect(error.retryable).toBeUndefined()
      expect(error.fieldViolations).toBeUndefined()
    }
  })

  it("exposes exactly the nine failure kinds the architecture names", () => {
    expect([...API_ERROR_KINDS].sort()).toEqual(
      [
        "offline",
        "unauthenticated",
        "revoked",
        "forbidden",
        "unsupported",
        "not-found",
        "invalid",
        "partial",
        "terminal",
      ].sort()
    )
  })
})
