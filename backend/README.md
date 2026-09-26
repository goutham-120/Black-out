# BLACKOUT Backend Engine

Autonomous local-first AI agent demonstrating extreme environmental resilience powered by quantized Gemma 4.

## System Architecture

The engine executes on a continuous loop:
$$\text{SENSE} \rightarrow \text{UNDERSTAND} \rightarrow \text{DECIDE} \rightarrow \text{ACT} \rightarrow \text{CHECK} \rightarrow \text{RECOVER} \rightarrow \text{REPLAN}$$

### Core Subsystems

1. **Capability Engine (`app/engines/capability_engine.py`)**:
   Continuously probes tools (`internet`, `weather_api`, `calendar`, `local_cache`, `filesystem`). Evaluates operational states (`AVAILABLE`, `DEGRADED`, `STALE`, `UNAVAILABLE`).
2. **Chaos Switchboard (`app/engines/chaos_switchboard.py`)**:
   Intercepts every tool execution. Deterministically injects faults (`kill`, `latency`, `corrupt`, `stale`) triggered on-demand via the judge's UI.
3. **Recovery Engine (`app/engines/recovery_engine.py`)**:
   Enforces the multi-tier Strategy Ladder (`Retry` $\rightarrow$ `Alt-Tool` $\rightarrow$ `Local Fallback` $\rightarrow$ `Human Handoff`) and prompts Gemma 4 to regenerate remaining plans without hallucinating.
4. **State Persistence (`app/database/`)**:
   SQLite3 configured strictly in **Write-Ahead Logging (WAL)** mode. Every pending step and plan mutation is recorded *before* execution. If killed (`SIGKILL`), restarts resume from the exact last checkpoint.
5. **Safety Gate & Provenance (`app/engines/safety_gate.py`)**:
   Every data payload tracks `source`, `age_seconds`, and `trust_score`. If critical data is stale or untrusted, execution halts and raises a Human Handoff prompt.

---

## API Contract

| Endpoint | Method | Description |
|---|---|---|
| `/agent/stream` | `GET` | Native Server-Sent Events (SSE) streaming real-time `AgentState` |
| `/agent/chaos` | `POST` | Deterministic fault injection (`{ "target": str, "action": str, "intensity": float }`) |
| `/agent/chaos` | `GET` | List active chaos rules |
| `/agent/chaos/clear` | `POST` | Clear all active chaos rules and restore systems |
| `/agent/mission` | `POST` | Launch an autonomous mission objective (`{ "objective": str }`) |
| `/agent/human-response` | `POST` | Submit human approval/override for Safety Gate handoff |
| `/agent/state` | `GET` | Direct REST snapshot of agent state |
| `/agent/capabilities` | `GET` | Current tool health and latency metrics |
| `/agent/audit-logs` | `GET` | Persistent audit trail from SQLite WAL store |
| `/health` | `GET` | Backend health check |

---

## Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Local Gemma 4
Ensure Ollama is running with Gemma:
```bash
ollama run gemma:latest
```
*(If Ollama is not running, the engine automatically engages its deterministic local offline generator for zero-crash testing).*

### 3. Launch the Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
