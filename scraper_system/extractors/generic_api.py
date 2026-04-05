from __future__ import annotations

from typing import Any


class GenericAPIExtractor:
    def extract_records(
        self,
        data: Any,
        max_items: int = 50,
    ) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []

        def visit(value: Any) -> None:
            if len(found) >= max_items:
                return

            if isinstance(value, list):
                if value and all(isinstance(x, dict) for x in value[:5]):
                    for row in value[:max_items]:
                        found.append(self._normalize_record(row))
                    return

                for item in value[:30]:
                    visit(item)
                return

            if isinstance(value, dict):
                preferred_keys = {
                    "items",
                    "results",
                    "data",
                    "edges",
                    "products",
                    "listings",
                    "nodes",
                    "records",
                    "hits",
                }

                for key, item in value.items():
                    if key.lower() in preferred_keys:
                        visit(item)

                for _, item in value.items():
                    visit(item)

        visit(data)

        unique: list[dict[str, Any]] = []
        seen: set[str] = set()

        for row in found:
            key = str(sorted(row.items()))
            if key not in seen:
                seen.add(key)
                unique.append(row)

        return unique[:max_items]

    def _normalize_record(self, row: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(row)

        if "node" in normalized and isinstance(normalized["node"], dict):
            normalized = dict(normalized["node"])

        return normalized