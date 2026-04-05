from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class NetworkCandidate:
    request_id: str
    url: str
    method: str
    resource_type: Optional[str] = None
    status: Optional[int] = None
    content_type: Optional[str] = None

    query_params: dict[str, Any] = field(default_factory=dict)
    request_headers: dict[str, Any] = field(default_factory=dict)
    response_headers: dict[str, Any] = field(default_factory=dict)

    post_data_preview: Optional[str] = None
    response_preview: Optional[str] = None
    response_json_shape: Optional[str] = None
    redirect_chain: list[str] = field(default_factory=list)

    heuristic_score: float = 0.0
    semantic_score: float = 0.0
    extractability_score: float = 0.0
    final_score: float = 0.0

    notes: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)

    def short_dict(self) -> dict[str, Any]:
        return {
            "request_id": self.request_id,
            "url": self.url,
            "method": self.method,
            "resource_type": self.resource_type,
            "status": self.status,
            "content_type": self.content_type,
            "query_params": self.query_params,
            "response_json_shape": self.response_json_shape,
            "heuristic_score": self.heuristic_score,
            "semantic_score": self.semantic_score,
            "extractability_score": self.extractability_score,
            "final_score": self.final_score,
            "tags": self.tags,
            "notes": self.notes,
        }