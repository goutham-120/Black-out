"""
Automated Test for BLACKOUT Model Context Protocol (MCP) Server.
Tests tools/list and tools/call (blackout_checkpoint_step, blackout_local_gemma_synthesize, blackout_probe_capabilities).
"""

import asyncio
import sys
from pathlib import Path

# Configure UTF-8 stdout for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.engines.mcp_server import handle_tool_call, TOOLS_METADATA

async def test_mcp_tools():
    print("\n" + "="*70)
    print("TESTING MODEL CONTEXT PROTOCOL (MCP) INTEGRATION FOR ANTIGRAVITY")
    print("="*70)

    # 1. Test tools/list metadata
    print(f"[MCP DISCOVERY] Discovered {len(TOOLS_METADATA)} tools:")
    for t in TOOLS_METADATA:
        print(f"  - {t['name']}: {t['description'][:60]}...")
    assert len(TOOLS_METADATA) == 4, "Must expose 4 MCP tools."

    # 2. Test blackout_checkpoint_step
    chk_res = await handle_tool_call("blackout_checkpoint_step", {
        "step_id": "antigravity_step_01",
        "tool": "filesystem",
        "payload": {"action": "write_file", "path": "main.py"}
    })
    print(f"\n[MCP CALL: blackout_checkpoint_step] Result: {chk_res}")
    assert chk_res["status"] == "CHECKPOINT_COMMITTED"
    assert "wal_block" in chk_res

    # 3. Test blackout_local_gemma_synthesize
    synth_res = await handle_tool_call("blackout_local_gemma_synthesize", {
        "prompt": "Create a C program for array sorting",
        "artifact_type": "c"
    })
    print(f"\n[MCP CALL: blackout_local_gemma_synthesize] Result: {synth_res['file']} (SHA256: {synth_res['provenance_sha256'][:16]}...)")
    assert synth_res["status"] == "SYNTHESIZED_ON_DEVICE"

    # 4. Test blackout_probe_capabilities
    probe_res = await handle_tool_call("blackout_probe_capabilities", {})
    print(f"\n[MCP CALL: blackout_probe_capabilities] Probed tools: {list(probe_res['capabilities'].keys())}")
    assert probe_res["zero_cloud_egress"] is True

    print("\n" + "="*70)
    print("✓ ALL MCP TOOL CALLS VERIFIED AND PASSING 100%!")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(test_mcp_tools())
