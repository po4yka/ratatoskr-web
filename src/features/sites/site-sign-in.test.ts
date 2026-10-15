import { describe, expect, it } from "vitest"
import { isSignInCallback } from "./site-sign-in"

const CALLBACK = "/.ratatoskr/sign-in/?code=code-1"

/** The callback page with user information, made here and not written out. */
function withUser(username: string, password = ""): string {
  const url = new URL(`https://blog.example.org${CALLBACK}`)
  url.username = username
  url.password = password
  return url.href
}

describe("the callback address of a site sign-in", () => {
  it.each([
    {
      name: "the callback page",
      url: `https://blog.example.org${CALLBACK}`,
      accepted: true,
    },
    {
      name: "a host that ends in the hostname",
      url: `https://evilblog.example.org${CALLBACK}`,
      accepted: false,
    },
    {
      name: "the hostname as a prefix",
      url: `https://blog.example.org.evil.example${CALLBACK}`,
      accepted: false,
    },
    {
      name: "a user name",
      url: withUser("owner"),
      accepted: false,
    },
    {
      name: "a user name and a password",
      url: withUser("owner", "secret"),
      accepted: false,
    },
    {
      name: "http",
      url: `http://blog.example.org${CALLBACK}`,
      accepted: false,
    },
    {
      name: "a port",
      url: `https://blog.example.org:8443${CALLBACK}`,
      accepted: false,
    },
    {
      name: "a trailing dot",
      url: `https://blog.example.org.${CALLBACK}`,
      accepted: false,
    },
    {
      name: "another path",
      url: "https://blog.example.org/account/?code=code-1",
      accepted: false,
    },
    {
      name: "the path without its slash",
      url: "https://blog.example.org/.ratatoskr/sign-in?code=code-1",
      accepted: false,
    },
    { name: "no address", url: "not an address", accepted: false },
  ])(
    "accepts only the callback page of the approved hostname: $name",
    ({ url, accepted }) => {
      expect(isSignInCallback(url, "blog.example.org")).toBe(accepted)
    }
  )
})
