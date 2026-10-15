/**
 * The one place where the consent page leaves this client for the site. A
 * test replaces `replace`, because jsdom does not navigate.
 */
export const browserLocation = {
  replace(url: string): void {
    window.location.replace(url)
  },
}
