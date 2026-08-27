import { createServer } from "node:http"

const host = "127.0.0.1"
const port = Number.parseInt(process.env.MOCK_PLATFORM_PORT ?? "4310", 10)
const allowedScenarios = new Set(["owner", "member", "degraded", "unavailable"])
const requests = []
let scenario = "owner"

const now = "2026-08-27T12:00:00Z"
const ids = {
  owner: "018f0000-0000-7000-8000-000000000001",
  member: "018f0000-0000-7000-8000-000000000002",
  operation: "018f0000-0000-7000-8000-000000000101",
  partial: "018f0000-0000-7000-8000-000000000102",
  schedule: "018f0000-0000-7000-8000-000000000201",
  audit: "018f0000-0000-7000-8000-000000000301",
}

const status = () => ({
  generated_at: now,
  state:
    scenario === "unavailable"
      ? "unavailable"
      : scenario === "degraded"
        ? "degraded"
        : "operational",
  components: [
    { id: "api", state: "operational", observed_at: now, stale: false },
    {
      id: "storage",
      state: scenario === "unavailable" ? "unavailable" : "operational",
      observed_at: now,
      stale: false,
    },
    {
      id: "command_delivery",
      state: scenario === "degraded" ? "degraded" : "operational",
      observed_at: now,
      stale: scenario === "degraded",
    },
    {
      id: "connected_services",
      state: "operational",
      observed_at: now,
      stale: false,
    },
  ],
})

const operationPage = {
  items: [
    {
      operation_id: ids.operation,
      owner_user_id: ids.owner,
      kind: "content.document.extract",
      status: "failed",
      accepted_at: now,
      status_changed_at: now,
      failure_code: "content.extraction.failed",
    },
    {
      operation_id: ids.partial,
      owner_user_id: ids.member,
      kind: "social.source.sync",
      status: "partially_succeeded",
      accepted_at: now,
      status_changed_at: now,
    },
  ],
  next_cursor: null,
}

const schedulePage = {
  items: [
    {
      schedule_id: ids.schedule,
      service_name: "ratatoskr-social",
      name: "daily_sync",
      owner_user_id: ids.owner,
      enabled: false,
      next_due_at: now,
      last_outcome: "failed",
    },
  ],
  next_cursor: null,
}

const auditPage = {
  items: [
    {
      audit_event_id: ids.audit,
      occurred_at: now,
      action: "operation.read",
      target_kind: "operation",
      target_id: ids.operation,
      outcome: "allowed",
      correlation_id: `correlation:${ids.audit}`,
    },
  ],
  next_cursor: null,
}

function send(response, code, body) {
  response.writeHead(code, {
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  })
  response.end(JSON.stringify(body))
}

function error(response, code, errorCode, message) {
  send(response, code, {
    code: errorCode,
    message,
    retryable: code >= 500,
    partial_effects: false,
  })
}

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
}

function isOwner(request) {
  return request.headers.authorization === "Bearer owner-credential"
}

async function control(request, response, pathname) {
  if (pathname === "/__mock/health") return send(response, 200, { ready: true })
  if (pathname === "/__mock/requests" && request.method === "GET")
    return send(response, 200, requests)
  if (pathname === "/__mock/reset" && request.method === "POST") {
    requests.length = 0
    scenario = "owner"
    return send(response, 200, { scenario })
  }
  if (pathname === "/__mock/scenario" && request.method === "POST") {
    const next = (await readJson(request)).scenario
    if (!allowedScenarios.has(next))
      return error(response, 400, "mock.scenario.invalid", "Unknown scenario.")
    scenario = next
    return send(response, 200, { scenario })
  }
  return false
}

async function route(request, response) {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`)
  if (request.method === "OPTIONS") return send(response, 204, {})
  if (url.pathname.startsWith("/__mock/"))
    return control(request, response, url.pathname)

  requests.push({
    method: request.method,
    path: url.pathname,
    authenticated: request.headers.authorization !== undefined,
  })
  if (url.pathname === "/v1/status") return send(response, 200, status())
  if (url.pathname === "/v1/capabilities") {
    if (request.headers.authorization === undefined)
      return error(
        response,
        401,
        "platform.auth.unauthenticated",
        "Authentication is required."
      )
    return send(response, 200, {
      api_version: "1",
      minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
      services: [],
      capabilities: isOwner(request)
        ? [
            "platform.audit.inspect",
            "platform.operations.inspect",
            "platform.schedules.inspect",
          ]
        : [],
    })
  }
  if (url.pathname.startsWith("/v1/admin/") && !isOwner(request)) {
    return error(
      response,
      403,
      "platform.auth.forbidden",
      "Owner access is required."
    )
  }
  if (url.pathname === "/v1/admin/operations")
    return send(response, 200, operationPage)
  if (url.pathname === "/v1/admin/schedules")
    return send(response, 200, schedulePage)
  if (url.pathname === "/v1/admin/audit-events")
    return send(response, 200, auditPage)
  return error(
    response,
    404,
    "platform.route.not_found",
    "The requested route does not exist."
  )
}

const server = createServer((request, response) => {
  route(request, response).catch(() =>
    error(response, 500, "mock.internal", "Mock request failed.")
  )
})

server.listen(port, host, () =>
  process.stdout.write(`mock Platform listening on ${host}:${port}\n`)
)
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)))
}
