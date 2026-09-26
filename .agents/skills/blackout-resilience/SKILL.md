---
name: blackout-resilience
description: >-
  Air-gapped resilience and offline failover engine for Google Antigravity.
  Use when internet connectivity is degraded or lost, power outages occur, or when
  atomic SQLite WAL pre-execution checkpoints are required to prevent lost in-flight work.
---

# BLACKOUT: Antigravity Offline Resilience & Crash Recovery Skill

This skill equips Antigravity with **air-gapped autonomy, zero-cloud local execution via Quantized Gemma 4, and SQLite Write-Ahead Logging (WAL) pre-execution checkpoints**.

---

## When to Activate This Skill

* **Network Degradation / Disconnect**: When cloud AI APIs return timeouts, DNS errors, or 503 Service Unavailable.
* **Pre-Execution Checkpointing**: Before performing irreversible workspace changes (creating files, executing terminal commands, compiling binaries).
* **Crash Recovery**: When restarting Antigravity after a sudden power loss (SIGKILL) to resume in-flight missions without losing progress.

---

## Core Capabilities Provided by BLACKOUT

### 1. Atomic Pre-Execution Checkpointing (`SQLite WAL`)
Before invoking any modifying tool, Antigravity logs the pending transaction:
```python
# Invoked via MCP tool: blackout_checkpoint_step
mcp_client.call_tool("blackout_checkpoint_step", {
    "step_id": "step-02",
    "tool": "filesystem",
    "payload": {"action": "write_file", "path": "main.py"}
})
```

### 2. Local-First Gemma 4 Synthesis (Zero Cloud Egress)
When offline, route prompts directly to the local on-device Gemma 4 engine:
```python
# Invoked via MCP tool: blackout_local_gemma_synthesize
result = mcp_client.call_tool("blackout_local_gemma_synthesize", {
    "prompt": "Create a FastAPI service for emergency triage",
    "artifact_type": "code"
})
```

### 3. Crash Recovery Checkpoint Resume
On startup or after a power outage, query uncommitted in-flight steps:
```python
# Invoked via MCP tool: blackout_resume_after_crash
uncompleted_steps = mcp_client.call_tool("blackout_resume_after_crash", {})
```

---

## Strategy Ladder Hierarchy

When an Antigravity tool fails:
1. **Level 1: Direct Retry** (suppressed if hardware is down).
2. **Level 2: Dynamic Local Fallback** (switch to verified offline SQLite WAL replica).
3. **Level 3: On-Device Gemma 4 Replan** (reconstruct remaining steps with local tools).
4. **Level 4: Operator Handoff** (Safety Gate alert if data staleness > 30m).
