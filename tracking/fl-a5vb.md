+++
id = "fl-a5vb"
title = "Layer H1 errors explain the rule, the problem and the fix"
kind = "fix"
state = "built"
created_at = "2026-11-25T13:45:01.662Z"
updated_at = "2026-11-25T13:54:41.580898509Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:a5vb",
]
branch = "bridle/a5vb"
commit = "7711090cd2b580200901d0df74518d55a7399fdf"
summary = """
Every error about a layer file's H1 now gives three things: the rule (every layer file has exactly one H1, the same as the H1 of the layer below, named), the problem in that layer, and both fixes (start the file with the H1 below and put sections under it as H2s with @add, @append or @remove as needed; or put @replace on the H1). Errors covered: no H1, text before the H1, a heading before the H1, a second H1, an H1 that differs from the H1 below, and @add or @remove on the H1. For the first layer, which has no layer below, the fix is "start the file with its one H1 (# Title)".

Where: src/core/layers.ts (the H1 messages are built by h1Message; the name of the layer below is resolved at merge time, since parsing runs before the layers below are merged). Tests: test/layers.test.ts, s-b418. Spec: design/specs/workflow-layers.md, requirement r-4030 and scenario s-b418. CHANGELOG: one line under Unreleased, Changed.

Choices: the message text is one line per error, prefixed with the same problem phrase as before, so existing matches still hold. The @add/@remove-on-H1 case is included because the spec lists it with the H1 errors; the ticket's Design did not name it. No merge rule changed. No warning about an untagged H1 replacing the opening text, per the advisor's note."""
ticket = "a5vb"
+++

docs/tickets/open/layer-h1-errors-explain-the-rule-the-problem-and-the-fix-a5vb.md

## Thread

### note · external:advisor · 2026-11-25T13:45:06.136Z
readied by external:advisor

### note · external:advisor · 2026-11-25T13:45:06.158Z
advisor: filed from the human's words and readied (kind fix). Fix text built on the rules as merged; if the human wants H2-only layer files allowed, that is a rule change on its own ticket.

### note · external:orchestrator · 2026-11-25T13:50:44.706Z
From orchestrator: fl-a5vb planned and queued. Haiku is fine. Done when every H1 layer error gives the rule, the problem and both fixes as the Design says, with a test per error case and the check green.

### note · external:advisor · 2026-11-25T13:51:29.580Z
advisor: the human, 2026-11-25: an untagged '# Flume workflow' with text replacing the opening text is correct, as designed, not a trap. The agent and project lines move into flume itself (fl-hq8k), so the fix text needs no warning about them.

### note · agent:a5vb · 2026-11-25T13:54:40.257Z
Choices (a5vb): H1 error text is one line per error: the problem, then the rule (one H1, the same as the layer below, named), then both fixes. The first layer (no layer below) gets the fix without the named H1. The name of the layer below is resolved at merge time, since parsing runs before the layers below are merged. @add or @remove on the H1 is included (the spec lists it with the H1 errors). Spec r-4030 / s-b418. No merge rule changed.

### note · agent:a5vb · 2026-11-25T13:54:41.580Z
built: 7711090cd2b580200901d0df74518d55a7399fdf (branch bridle/a5vb)
