"""
StreamShield Schemas — Fraud DNA Structural Pattern Recognition
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DNAStrandSchema(BaseModel):
    name: str = Field(..., description="Name of the structural strand (e.g. Fan-In Concentration, Boundary Structuring)")
    code: str = Field(..., description="Short identifier code (e.g. STRAND_FAN_IN)")
    weight: float = Field(..., description="Importance weight of this strand (0.0 to 1.0)")
    observed_value: float = Field(..., description="Normalized observed value in network (0.0 to 1.0)")
    reference_value: float = Field(..., description="Normalized expected value in archetype (0.0 to 1.0)")
    alignment: float = Field(..., description="Similarity/alignment score for this strand (0.0 to 1.0)")
    explanation: str = Field(..., description="Plain-English explanation of strand behavior")


class FraudDNAProfileSchema(BaseModel):
    dna_id: str = Field(..., description="Unique DNA signature identifier (e.g. DNA-FANIN-0x8F4A1E)")
    signature_vector: List[float] = Field(..., description="Normalized multi-dimensional structural vector")
    vector_dimension: int = Field(..., description="Dimensionality of feature space")
    dominant_typology: str = Field(..., description="Inferred dominant crime typology")
    strands: List[DNAStrandSchema] = Field(..., description="Breakdown of individual structural strands")
    entropy_score: float = Field(..., description="Topological entropy score (0.0 to 1.0)")
    compact_hash: str = Field(..., description="Canonical hex hash of the structural pattern")
    is_experimental: bool = Field(True, description="Experimental research prototype marker")


class ArchetypeMatchResultSchema(BaseModel):
    archetype_id: str = Field(..., description="ID of matched known archetype")
    archetype_name: str = Field(..., description="Moniker of matched archetype (e.g. Funnel Collector Syndicate)")
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    similarity_percentage: float = Field(..., description="Percentage similarity (0% to 100%)")
    confidence: str = Field(..., description="Match confidence level: High, Medium, Low")
    key_matching_strands: List[str] = Field(..., description="Strands that aligned closely with archetype")
    divergent_strands: List[str] = Field(..., description="Strands that deviated from archetype")
    narrative: str = Field(..., description="Forensic matching explanation")


class FraudDNAMatchResponse(BaseModel):
    subject_id: str = Field(..., description="Analyzed account VPA, ring ID, or simulation run")
    dna_profile: FraudDNAProfileSchema = Field(..., description="Extracted DNA signature")
    top_match: ArchetypeMatchResultSchema = Field(..., description="Closest matching known fraud archetype")
    all_archetype_matches: List[ArchetypeMatchResultSchema] = Field(..., description="Ranked similarity across all archetypes")
    is_structurally_suspicious: bool = Field(..., description="Whether topology matches fraud archetypes above threshold")
    disclaimer: str = Field(
        "SYNTHETIC / EXPERIMENTAL — StreamShield Fraud DNA structural matching prototype. Demonstrates invariant graph motif matching.",
        description="Data integrity and research disclaimer"
    )


class FraudDNAArchetypeSchema(BaseModel):
    id: str = Field(..., description="Archetype ID")
    name: str = Field(..., description="Archetype name")
    typology: str = Field(..., description="Category typology")
    description: str = Field(..., description="Detailed description of structural scheme")
    reference_vector: List[float] = Field(..., description="Reference signature vector")
    typical_indicators: List[str] = Field(..., description="Known operational indicators")
    recommended_interventions: List[str] = Field(..., description="Actionable countermeasures")
