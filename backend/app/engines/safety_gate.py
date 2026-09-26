"""
Safety Gate and Provenance Engine for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Enforces strict data provenance rules during the CHECK phase.
Halts execution and triggers Human Handoff if data staleness or trust levels violate safety policies.
"""

import logging
from typing import Optional
from app.config import settings
from app.models.provenance import ProvenanceMetadata, SafetyGateResult

logger = logging.getLogger("blackout.engines.safety")

class SafetyGate:
    def __init__(
        self,
        stale_threshold_seconds: Optional[float] = None,
        trust_threshold: Optional[float] = None
    ):
        self.stale_threshold = stale_threshold_seconds or settings.STALE_DATA_THRESHOLD_SECONDS
        self.trust_threshold = trust_threshold or settings.CRITICAL_TRUST_THRESHOLD

    def evaluate(self, provenance: Optional[ProvenanceMetadata], step_description: str) -> SafetyGateResult:
        """
        Evaluates provenance metadata.
        Returns SafetyGateResult indicating whether to proceed, warn, or halt for human authorization.
        """
        if not provenance:
            logger.warning(f"Safety Gate: Missing provenance metadata for step '{step_description}'")
            return SafetyGateResult(
                is_safe=False,
                reason="Missing provenance metadata.",
                requires_human_approval=True,
                suggested_action="human_handoff"
            )

        # Check trust score
        if provenance.trust_score < self.trust_threshold:
            reason = f"Low trust score ({provenance.trust_score:.2f} < {self.trust_threshold:.2f}) from source '{provenance.source}'."
            logger.warning(f"Safety Gate alert: {reason}")
            return SafetyGateResult(
                is_safe=False,
                reason=reason,
                requires_human_approval=True,
                suggested_action="human_handoff"
            )

        # Check staleness
        if provenance.age_seconds > self.stale_threshold:
            reason = f"Data is excessively stale ({provenance.age_seconds:.0f}s old, limit {self.stale_threshold:.0f}s)."
            logger.warning(f"Safety Gate staleness alert: {reason}")
            return SafetyGateResult(
                is_safe=False,
                reason=reason,
                requires_human_approval=True,
                suggested_action="human_handoff"
            )

        return SafetyGateResult(
            is_safe=True,
            reason=f"Data verified nominal from '{provenance.source}' (trust={provenance.trust_score:.2f}, age={provenance.age_seconds:.1f}s).",
            requires_human_approval=False,
            suggested_action="proceed"
        )

safety_gate = SafetyGate()
