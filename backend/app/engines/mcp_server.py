"""
Model Context Protocol (MCP) Server for BLACKOUT.
Role: Provides standard JSON-RPC 2.0 MCP interface for Google Antigravity to invoke
BLACKOUT's atomic SQLite WAL checkpoints, local Gemma 4 code synthesis, and crash recovery.
"""

import sys
import json
import asyncio
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.database.repository import Repository
from app.tools.registry import tool_registry
from app.engines.capability_engine import capability_engine
from app.engines.agent_loop import agent_loop
from app.models.agent import Step, StepStatus

SANDBOX_DIR = Path(__file__).resolve().parent.parent.parent / "sandbox_fs"
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

TOOLS_METADATA = [
    {
        "name": "blackout_checkpoint_step",
        "description": "Logs an atomic pre-execution checkpoint to SQLite WAL before performing a workspace file write or tool action.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "step_id": {"type": "string", "description": "Unique identifier for the step"},
                "tool": {"type": "string", "description": "Target tool being invoked (e.g. filesystem, code_engine)"},
                "payload": {"type": "object", "description": "Action parameters or file payload"}
            },
            "required": ["step_id", "tool"]
        }
    },
    {
        "name": "blackout_local_gemma_synthesize",
        "description": "Synthesizes code, files, or vector SVG diagrams on-device using Quantized Gemma 4 (Zero Cloud Egress).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Natural language coding objective"},
                "artifact_type": {"type": "string", "enum": ["code", "svg", "test", "c"], "default": "code"}
            },
            "required": ["prompt"]
        }
    },
    {
        "name": "blackout_resume_after_crash",
        "description": "Scans SQLite WAL Write-Ahead Log for missions interrupted by sudden power loss (SIGKILL) and returns resume state.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "blackout_probe_capabilities",
        "description": "Probes local NVMe storage, hardware latency, and offline tool availability.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

async def handle_tool_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatches MCP tool calls to BLACKOUT internal engines."""
    
    if name == "blackout_checkpoint_step":
        step_id = arguments.get("step_id", f"step_{int(datetime.now().timestamp())}")
        tool_name = arguments.get("tool", "filesystem")
        payload = arguments.get("payload", {})
        
        # Save to SQLite WAL repository
        mission_id = arguments.get("mission_id", "antigravity_session")
        if not Repository.get_mission(mission_id):
            from app.models.agent import Mission, MissionStatus
            Repository.save_mission(Mission(
                id=mission_id,
                objective="Google Antigravity Air-Gapped Session",
                status=MissionStatus.RUNNING,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            ))

        dummy_step = Step(
            id=step_id,
            index=1,
            description=f"Antigravity In-Flight Action: {tool_name}",
            tool=tool_name,
            params=payload,
            status=StepStatus.RUNNING,
        )
        Repository.save_step_pre_execution(mission_id, dummy_step)
        
        return {
            "status": "CHECKPOINT_COMMITTED",
            "wal_block": f"wal_chk_{hashlib.sha256(step_id.encode()).hexdigest()[:12]}",
            "step_id": step_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    elif name == "blackout_local_gemma_synthesize":
        prompt = arguments.get("prompt", "Generate basic resilient program")
        artifact_type = arguments.get("artifact_type", "code")
        
        code_tool = tool_registry.get_tool("code_engine")
        if not code_tool:
            return {"error": "Code engine not registered."}
            
        output, prov = await code_tool.execute(
            params={"prompt": prompt, "artifact_type": artifact_type}
        )
        return {
            "status": "SYNTHESIZED_ON_DEVICE",
            "file": output.get("file"),
            "path": output.get("path"),
            "language": output.get("language"),
            "provenance_sha256": prov.checksum,
            "trust_score": prov.trust_score,
            "code_snippet": output.get("code_snippet")
        }

    elif name == "blackout_resume_after_crash":
        active_mission = Repository.get_latest_active_mission()
        if not active_mission:
            return {"status": "NO_INTERRUPTED_SESSION", "resumed": False}
            
        steps = Repository.get_mission_steps(active_mission.id)
        return {
            "status": "RESUMED_FROM_SQLITE_WAL",
            "mission_id": active_mission.id,
            "objective": active_mission.objective,
            "total_steps": len(steps),
            "completed_steps": sum(1 for s in steps if s.status == StepStatus.COMPLETED),
            "pending_steps": [s.description for s in steps if s.status != StepStatus.COMPLETED]
        }

    elif name == "blackout_probe_capabilities":
        caps = await capability_engine.probe_all()
        return {
            "status": "PROBED",
            "capabilities": {k: {"state": v.state.value, "latency_ms": v.latency_ms} for k, v in caps.items()},
            "zero_cloud_egress": True
        }

    else:
        return {"error": f"Unknown tool: {name}"}

async def run_mcp_stdio_server():
    """Reads JSON-RPC messages from stdin and writes responses to stdout."""
    # Ensure stdout is UTF-8 encoded
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break

        line_str = line.decode("utf-8").strip()
        if not line_str:
            continue

        try:
            req = json.loads(line_str)
            req_id = req.get("id")
            method = req.get("method")
            params = req.get("params", {})

            if method == "tools/list":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"tools": TOOLS_METADATA}
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                tool_args = params.get("arguments", {})
                result = await handle_tool_call(tool_name, tool_args)
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"content": [{"type": "text", "text": json.dumps(result, indent=2)}]}
                }
            elif method == "initialize":
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "serverInfo": {"name": "blackout-resilience-sidecar", "version": "1.0.0"}
                    }
                }
            else:
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Method not found: {method}"}
                }

            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(e)}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(run_mcp_stdio_server())
