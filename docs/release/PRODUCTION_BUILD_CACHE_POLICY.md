# VKVTT Production Build & Browser Freshness Policy

Current central build: `2026.09.08.1`

## Purpose

Prevent Chrome, Edge, Firefox or an installed/PWA-like browser context from continuing to run an older VKVTT helper after a production release.

This layer is deliberately conservative. It does **not** cache application JavaScript or CSS. It only provides a central build identity and removes stale runtime Cache Storage/service-worker residue when the build changes.

## Authoritative files

- `vkv-build.json` — single central release/build identity.
- `vkv-cache-bootstrap.js` — no-store build check and stale runtime-cache cleanup.

## Current production gateways

The freshness bootstrap is wired into:

1. VKVTT Home (`vkv-home-notice-attachments.js`)
2. Question Bank (`vkv-qb-master-options.js`)
3. Examination Module (`vkv-exam-approved-print-guard.js` compatibility shim)

The Examination Module's approved timetable print presentation remains independent and frozen. Cache/version work must never alter `vkv-exam-output-finalizer.js` or `vkv-exam-final-print-layout.js` merely to force freshness.

## Release rule

For every production release that changes HTML, JavaScript or CSS:

1. Update `vkv-build.json` to a new build value, for example `2026.09.08.2`.
2. Bump the query version of the top-level bootstrap/loader reference changed in that release when applicable.
3. Do not create a second renderer or compatibility copy simply to bypass browser cache.
4. Open VKVTT once in Chrome, Edge and Firefox and confirm `document.documentElement.dataset.vkvBuild` reports the same build.
5. Confirm the Examination timetable still uses the frozen approved print renderer.
6. Confirm Question Bank bulk import and Staff Notice Board still open normally.

## What the bootstrap does

On each protected entry surface it fetches `vkv-build.json` using `cache: "no-store"` and a timestamp query.

When a new central build is detected it:

- stores the new build identity in browser local storage;
- clears Cache Storage entries, if any exist;
- unregisters stale service workers, if any exist;
- reloads the current page once with `vkv_build=<build>`.

It does not create an application cache and does not make VKVTT offline-first.

## Production safety principle

A feature fix must change the feature source. A cache fix must change build/version metadata. Do not duplicate feature code to work around stale browser assets.

### Locked Examination print baseline

The approved Senior timetable print baseline is commit `c3fe9c21` (`Freeze final senior examination print layout`). Shared/Manager/approval features may supply data to that renderer but must not replace its presentation layer.
