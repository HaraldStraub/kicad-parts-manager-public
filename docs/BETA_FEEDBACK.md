# Beta feedback workflow — item 53

Prepared for Windows Beta 1 (`v0.1.0-beta.1`). This document defines a manual workflow; it does not enable automatic monitoring, contact reporters or publish a new release.

## Intake

Use [GitHub Issues](https://github.com/HaraldStraub/kicad-parts-manager-public/issues) and the existing bug/feature templates. Check existing reports before opening a duplicate. Security reports follow [SECURITY.md](../SECURITY.md).

Minimum useful information:

- Application version and exact download/package used.
- Operating system, Python, KiCad and browser versions; ngspice if relevant.
- Numbered steps, expected result and actual result.
- Whether the problem repeats; fresh setup or upgrade; first start or subsequent start.
- Sanitised error text or screenshot. For an import problem, request a small freely redistributable example if needed.

Do not request private databases, proprietary component files, credentials or entire unsanitised logs. Keep personal file paths out of public screenshots. Incomplete reports stay open for clarification; they are not treated as confirmed defects.

## Triage

| Priority | Meaning | Next action |
| --- | --- | --- |
| P0 | Confirmed data loss/corruption or security issue | Stop the affected workflow; preserve evidence and a backup; investigate first. Handle security privately. |
| P1 | Cannot install/start, or essential import/KiCad/SIM workflow fails without a workaround | Reproduce promptly in an isolated public-package installation. |
| P2 | Incorrect behaviour with a workaround, such as category, filter, preview or duplicate handling | Add a focused reproduction and schedule a small fix. |
| P3 | Cosmetic issue, documentation improvement or feature idea | Clarify benefit; batch with related work or add to backlog. |

Priority follows impact and reproducibility, not the order reports arrive. A simulation result that could mislead users may deserve higher priority than an ordinary display defect. Distinguish program defects, missing upstream library files, unsupported configurations and user setup problems.

Suggested states: **New → Needs information / Reproduced → Fix prepared → Verified → Released → Closed**. These are workflow states, not claims that GitHub labels have already been created. Link duplicate reports to the original.

## Reproduction record

Copy this block into a local working record or maintainer issue comment after removing private information:

```text
Issue URL:
Affected version/package:
Environment:
Area: setup / startup / search / filters / import / KiCad / simulation / data / docs
Reproduction steps:
Expected / actual:
Reproduced: yes / no / needs information
Impact and priority:
Workaround:
Suspected cause / evidence:
Fix scope:
Verification and result:
Target release / actual released version:
```

Use a separate test folder and Release-DB copy. Keep the maintainer's private database, existing installation and private repository unchanged. Capture before/after evidence; never reproduce a destructive operation on the user's live data.

## Fix and release

1. Make the smallest change that addresses the confirmed cause.
2. Add a regression test where it verifies meaningful behaviour; run relevant existing checks. Check DE/EN and both themes when UI changes are involved.
3. Recheck the original reproduction, neighbouring workflows and data retention as appropriate.
4. Record affected issues, validation, known limits and any migration/update instructions in release notes.
5. Prepare matching source/package versions, checksums and an isolated package smoke test. Publish a further Beta only after the user explicitly authorises publication.
6. Close an issue only when the released fix is verified, or record another explicit resolution. A local fix is not yet a released fix.

## Readiness

- Existing public bug/feature forms provide the intake channel.
- This workflow and reproduction template are prepared locally.
- No reports have been evaluated as part of this preparation.
- No automatic polling, GitHub labels, responses or new release have been configured.

## Shared documentation and website — items 41 and 51

Plan these as one work package: an English project landing page plus a short illustrated getting-started guide. Reuse one set of instructions for download, prerequisites, extraction, first launch, desktop restart, search, import, KiCad connection, simulation, updates and uninstall/data retention. Link the complete Windows package clearly; keep source downloads distinct. Include known Beta limits, licences and feedback links.

Use screenshots from an isolated Release-DB installation. The repository README remains the project overview; the site links to the same maintained guide rather than creating a second set of instructions. Prepare a local preview and agree the content with the user before publishing the website. A YouTube introduction can follow this same tested sequence later.
