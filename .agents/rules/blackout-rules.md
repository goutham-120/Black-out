# BLACKOUT Resilience Rules for Antigravity

These rules are loaded by Google Antigravity to guarantee zero data loss and deterministic offline execution.

## Rule 1: Pre-Execution Checkpointing (Atomic Write-Ahead Log)
* Before modifying any file on disk or running destructive commands, Antigravity MUST record the pending transaction with `blackout_checkpoint_step`.
* If a power outage or crash occurs, Antigravity WILL recover the in-flight state from SQLite WAL without prompting the user to restart from scratch.

## Rule 2: Air-Gapped Local Gemma 4 Fallback
* When network latency exceeds 3000ms or HTTP 503/DNS errors occur, Antigravity MUST delegate plan formulation and code generation to `blackout_local_gemma_synthesize`.
* Zero data shall be transmitted to external cloud APIs while operating in local-first isolation mode.

## Rule 3: Cryptographic SHA256 Data Provenance
* All files generated or updated in the workspace sandbox MUST be hashed with SHA256 and verified for data integrity.
