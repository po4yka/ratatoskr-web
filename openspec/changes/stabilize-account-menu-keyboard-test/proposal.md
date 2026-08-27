# Why

Hosted CI run 33092164295 failed in the shell keyboard smoke test because the test described keyboard-only account-menu access but opened the menu with a synthetic pointer click. Base UI did not materialize the menu portal reliably under the hosted runner, so the test neither proved its stated accessibility behavior nor ran deterministically.

# What Changes

- Activate the account-menu trigger through its keyboard contract in the shell test.
- Keep the production behavior and public specifications unchanged.
- Prove the correction with the targeted test, the full Web gate, and hosted CI.

# Capabilities

No product capability changes. This change corrects test evidence for the existing keyboard-operability requirement.

# Impact

- Affected code: `src/components/shell/shell.test.tsx` only.
- Public API, runtime behavior, dependencies, and generated sources: unchanged.
