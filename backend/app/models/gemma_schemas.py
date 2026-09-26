"""
Pydantic Schemas for Local Gemma 4 Output Validation.
Role in SENSE-REPLAN-ACT loop: Enforces rigid structural validation over the local LLM's
generated JSON responses during the UNDERSTAND, DECIDE, and REPLAN phases, eliminating hallucinations.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class GemmaStepOutput(BaseModel):
    description: str = Field(..., description="Actionable description of the step")
    tool: str = Field(..., description="Target tool name (e.g., 'weather_api', 'local_cache', 'calendar', 'filesystem', 'internet')")
    params: Dict[str, Any] = Field(default_factory=dict, description="Input arguments for the tool")

class GemmaPlanResponse(BaseModel):
    reasoning: str = Field(..., description="Step-by-step logic and environmental awareness breakdown")
    steps: List[GemmaStepOutput] = Field(..., min_length=1, description="Sequential steps formulated to accomplish the objective")
    risk_assessment: str = Field("low", description="Environmental risk level based on available capabilities")

class GemmaReplanResponse(BaseModel):
    failure_analysis: str = Field(..., description="Root cause analysis of the intercepted failure")
    strategy_chosen: str = Field(..., description="Strategy ladder choice: 'alt_tool', 'local_fallback', 'human_handoff', or 'skip'")
    revised_steps: List[GemmaStepOutput] = Field(..., description="Replacement sequence for remaining steps utilizing verified local capabilities")
    discarded_tools: List[str] = Field(default_factory=list, description="Tools explicitly blacklisted due to degradation or chaos")
