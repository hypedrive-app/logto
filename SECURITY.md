# Security Policy

We take the security of Logto seriously. Thank you for helping keep Logto and its users safe.

## Supported versions

Security fixes are applied to the latest release. We recommend always running the most recent
version of Logto.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull
requests.**

Instead, report them privately through either of the following channels:

- **GitHub Security Advisories** (preferred): use the
  ["Report a vulnerability"](https://github.com/logto-io/logto/security/advisories/new) button on
  this repository to open a private advisory.
- **Email**: send the details to **security@logto.io**.

Please include as much of the following as you can, to help us triage quickly:

- The type of issue (e.g. authentication bypass, token leakage, injection, SSRF).
- The affected component, endpoint, or package (e.g. `core`, `experience`, the OIDC provider).
- Step-by-step instructions to reproduce the issue, including any proof-of-concept.
- The impact, including how an attacker might exploit it.
- The version / commit you tested against, and your environment if relevant.

## What to expect

- We will acknowledge your report within **3 business days**.
- We will keep you informed of our progress as we investigate and work on a fix.
- We follow **coordinated disclosure**: we ask that you give us a reasonable window to release a fix
  before any public disclosure, and we will credit you in the advisory unless you prefer to remain
  anonymous.

## Scope

In scope: the source code in this repository and the official Logto releases/images built from it.

Out of scope: third-party dependencies (please report those upstream), social-engineering attacks,
and findings that require physical access or a compromised host.
