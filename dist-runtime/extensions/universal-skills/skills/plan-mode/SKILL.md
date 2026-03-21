---
name: plan-mode
description: Create, manage, and update multi-step execution plans for complex tasks. Use when the user asks for a plan/roadmap/phases/checklist, or when work has multiple dependent steps, higher risk, or requires coordination. Skip for straightforward tasks.
---

# Plan Mode

## Overview

Provide a concise workflow for producing actionable plans and keeping them updated during execution.

## Decide Whether to Plan

- Use plan mode when the task is multi-step, risky, cross-cutting, or explicitly requests a plan.
- Skip planning for trivial or single-action tasks.

## Create the Plan

- Identify the smallest set of steps that cover the full task end-to-end.
- Use 3-7 steps; avoid single-step plans.
- Write outcome-based steps (verb + object), not low-level implementation details.
- Include a verification step when testing or validation is expected.
- Initialize all steps as pending; set only one step to in_progress at a time.
- Use the plan tool to publish the plan.

## Execute and Update

- Move the current step to completed when done.
- Set the next step to in_progress before starting it.
- Revise the plan if scope changes; keep the explanation brief and focused.
- Avoid re-planning unless the change is material.

## Output Style

- Keep the plan concise and scannable.
- Prefer short, specific step names over long sentences.
- Do not include unrelated commentary inside the plan.

## Examples of Triggers

- "Make a phased plan to merge branches and keep custom features."
- "Give me a roadmap to refactor the orchestration system."
- "Create a checklist for a release and verification run."
