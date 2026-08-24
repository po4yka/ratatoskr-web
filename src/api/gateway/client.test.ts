import { describe, expect, it } from "vitest"
import { createGateway } from "./client"
import {
  baseDeps,
  envelope,
  expectHttpError,
  jsonResponse,
  scriptedFetch,
  settledRejection,
} from "./gateway-fixtures"

describe("issuing requests against the configured Edge API", () => {
  it("joins the base URL with the request path and passes the method", async () => {
    const script = scriptedFetch([() => jsonResponse(200)])
    const gateway = createGateway(baseDeps(script.fetchImpl))

    await gateway.request({ path: "/v1/capabilities" })

    expect(script.calls()).toBe(1)
    expect(script.inits[0].method).toBe("GET")
  })

  it("attaches the bearer token from the source when there is one", async () => {
    const script = scriptedFetch([() => jsonResponse(200)])
    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      tokenSource: { current: () => "credential-1" },
    })

    await gateway.request({ path: "/v1/capabilities" })

    const headers = new Headers(script.inits[0].headers)
    expect(headers.get("authorization")).toBe("Bearer credential-1")
  })

  it("sends no Authorization header when the source holds no token", async () => {
    const script = scriptedFetch([() => jsonResponse(200)])
    const gateway = createGateway(baseDeps(script.fetchImpl))

    await gateway.request({ path: "/v1/capabilities" })

    const headers = new Headers(script.inits[0].headers)
    expect(headers.get("authorization")).toBeNull()
  })

  it("serializes a JSON body and parses a JSON response", async () => {
    const script = scriptedFetch([
      () => jsonResponse(200, { api_version: "1", capabilities: [] }),
    ])
    const gateway = createGateway(baseDeps(script.fetchImpl))

    const payload = await gateway.request({
      path: "/v1/captures",
      method: "POST",
      body: { url: "https://example.org/article" },
      headers: { "Idempotency-Key": "key-1" },
    })

    const headers = new Headers(script.inits[0].headers)
    expect(headers.get("content-type")).toContain("application/json")
    expect(headers.get("idempotency-key")).toBe("key-1")
    expect(JSON.parse(String(script.inits[0].body))).toEqual({
      url: "https://example.org/article",
    })
    expect(payload).toEqual({ api_version: "1", capabilities: [] })
  })

  it("resolves undefined for an empty success body instead of failing to parse", async () => {
    const script = scriptedFetch([() => jsonResponse(202)])
    const gateway = createGateway(baseDeps(script.fetchImpl))

    await expect(
      gateway.request({ path: "/v1/captures", method: "POST" })
    ).resolves.toBeUndefined()
  })

  it("normalizes a failed response through the envelope contract", async () => {
    const script = scriptedFetch([
      () =>
        jsonResponse(400, {
          ...envelope({ code: "platform.validation.failed" }),
          field_violations: [
            {
              code: "platform.capture.url_invalid",
              field_path: "/url",
              message: "No usable host.",
            },
          ],
        }),
    ])
    const gateway = createGateway(baseDeps(script.fetchImpl))

    const error = await settledRejection(
      gateway.request({ path: "/v1/captures", method: "POST" })
    )

    expect(error.kind).toBe("invalid")
    expectHttpError(error)
    expect(error.fieldViolations).toHaveLength(1)
  })
})
