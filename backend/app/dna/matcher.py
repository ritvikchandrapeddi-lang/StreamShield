"""
StreamShield Fraud DNA — Pattern Matcher & Forensic Explainability Engine

Calculates cosine similarity and strand-level alignments between observed
transaction network vectors and reference fraud archetypes.
"""

from typing import Dict, Any, List, Tuple
import numpy as np

from app.dna.archetypes import STRAND_DEFINITIONS, KNOWN_ARCHETYPES


class FraudDNAMatcher:
    """
    Routines for comparing extracted vectors against the reference catalog.
    """

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Computes cosine similarity between two feature vectors."""
        a = np.array(v1, dtype=float)
        b = np.array(v2, dtype=float)

        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0

        dot = np.dot(a, b)
        sim = float(dot / (norm_a * norm_b))
        return min(max(sim, 0.0), 1.0)

    def match_against_archetypes(
        self, observed_vector: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Compares observed vector against all known archetypes,
        returning matches sorted by similarity score descending.
        """
        results: List[Dict[str, Any]] = []

        for arch in KNOWN_ARCHETYPES:
            ref_vec = arch["reference_vector"]
            sim = self.cosine_similarity(observed_vector, ref_vec)
            sim_pct = round(sim * 100.0, 1)

            # Strand by strand comparison
            matching_strands: List[str] = []
            divergent_strands: List[str] = []

            for idx, strand in enumerate(STRAND_DEFINITIONS):
                obs = observed_vector[idx]
                ref = ref_vec[idx]
                diff = abs(obs - ref)
                alignment = max(0.0, 1.0 - diff)

                if alignment >= 0.75:
                    matching_strands.append(
                        f"{strand['name']} ({round(obs * 100)}% observed vs {round(ref * 100)}% expected)"
                    )
                elif alignment < 0.50:
                    divergent_strands.append(
                        f"{strand['name']} ({round(obs * 100)}% observed vs {round(ref * 100)}% expected)"
                    )

            # Confidence level
            confidence = "High" if sim >= 0.85 else "Medium" if sim >= 0.65 else "Low"

            # Forensic narrative explanation
            if sim >= 0.80:
                narrative = (
                    f"Strong structural correspondence ({sim_pct}%) to {arch['name']} ({arch['typology']}). "
                    f"Core operational pattern exhibits {', '.join(matching_strands[:2])}."
                )
            elif sim >= 0.60:
                narrative = (
                    f"Moderate correspondence ({sim_pct}%) to {arch['name']}. "
                    f"Shares structural characteristics in {', '.join(matching_strands[:2]) if matching_strands else 'general topology'}, "
                    f"but diverges in {', '.join(divergent_strands[:1]) if divergent_strands else 'peripheral metrics'}."
                )
            else:
                narrative = (
                    f"Weak correspondence ({sim_pct}%) to {arch['name']}. "
                    f"Primary structural topology does not match this crime motif."
                )

            results.append({
                "archetype_id": arch["id"],
                "archetype_name": arch["name"],
                "similarity_score": round(sim, 4),
                "similarity_percentage": sim_pct,
                "confidence": confidence,
                "key_matching_strands": matching_strands,
                "divergent_strands": divergent_strands,
                "narrative": narrative,
            })

        return sorted(results, key=lambda x: x["similarity_score"], reverse=True)

    def generate_strand_breakdown(
        self, observed_vector: List[float], top_archetype_vector: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Generates individual strand objects for display.
        """
        strands: List[Dict[str, Any]] = []

        for idx, s_def in enumerate(STRAND_DEFINITIONS):
            obs = observed_vector[idx]
            ref = top_archetype_vector[idx]
            diff = abs(obs - ref)
            alignment = max(0.0, 1.0 - diff)

            if obs >= 0.70:
                explanation = f"Pronounced {s_def['name'].lower()} detected in network topology."
            elif obs <= 0.25:
                explanation = f"Minimal {s_def['name'].lower()} present in current transaction pattern."
            else:
                explanation = f"Moderate {s_def['name'].lower()} observed."

            strands.append({
                "name": s_def["name"],
                "code": s_def["code"],
                "weight": s_def["weight"],
                "observed_value": round(obs, 4),
                "reference_value": round(ref, 4),
                "alignment": round(alignment, 4),
                "explanation": explanation,
            })

        return strands
