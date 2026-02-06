# 2026-02-06 Exclude .bak files from Git tracking

## Objective

The goal was to prevent `.bak` files (backup files) from being tracked by Git.

## Changes

- Updated [.gitignore](file:///c:/Users/downl/Desktop/clawdbot-main3/clawdbot-main/.gitignore) to include `*.bak`.
- Removed existing `.bak` files from the Git index using `git rm --cached`.

## Verification

- Verified with `git ls-files "*.bak"` that no `.bak` files are currently tracked.
