"""Lightweight cognitive monitoring helper

Provides simple, deterministic summaries used by the Enhanced Learning frontend.
This module is intentionally dependency-free so it can be used in the FastAPI
service without extra install steps.

API:
- CognitiveMonitor.analyze_realtime(payload: dict) -> dict
  Expects payload with optional keys:
    - camera_enabled: bool
    - signals: dict with numeric keys (0-100) like attention, engagement, cognitive_load, emotional_state
    - history: list of past signal dicts (most recent last) used to compute trends

The returned dict contains per-metric summaries used by the UI: quality, current, percent, trend.
"""
from typing import Dict, List, Any, Optional


def _safe_num(v: Any) -> Optional[float]:
    try:
        if v is None:
            return None
        return float(v)
    except Exception:
        return None


def _quality_label(value: Optional[float]) -> str:
    """Return a human quality label for a numeric 0-100 value.

    If value is None, return the placeholder '—'.
    """
    if value is None:
        return "—"
    if value >= 85:
        return "Excellent"
    if value >= 70:
        return "Good"
    if value >= 50:
        return "Fair"
    return "Poor"


def _trend_from_history(history: List[Optional[float]]) -> str:
    """Compute a simple trend indicator from numeric history.

    Returns one of: '↑ Increasing', '↓ Decreasing', '→ Stable', '↕ Fluctuating', or '—' if unknown.
    Uses last up to 5 samples to observe direction.
    """
    vals = [v for v in history if v is not None]
    if not vals:
        return "—"
    # take last up to 5
    slice_vals = vals[-5:]
    if len(slice_vals) < 2:
        return "→ Stable"

    # compute simple linear slope (least-squares) or delta
    try:
        start = slice_vals[0]
        end = slice_vals[-1]
        delta = end - start
        # if tiny changes, consider stable
        if abs(delta) < 3:
            return "→ Stable"
        if delta > 0:
            return "↑ Increasing"
        if delta < 0:
            return "↓ Decreasing"
    except Exception:
        pass
    return "↕ Fluctuating"


def _percent_display(value: Optional[float]) -> str:
    if value is None:
        return "—"
    try:
        v = max(0, min(100, float(value)))
        return f"{int(round(v))}%"
    except Exception:
        return "—"


class CognitiveMonitor:
    """Encapsulates lightweight cognitive-state summarization logic."""

    @staticmethod
    def _normalize_signals(signals: Dict[str, Any]) -> Dict[str, Optional[float]]:
        """Accepts various key forms and returns normalized numeric signals.

        Recognized keys (case-insensitive): attention, engagement, cognitive_load, cognitiveload, load,
        emotional_state, emotion, mood
        """
        out = {
            "attention": None,
            "engagement": None,
            "cognitive_load": None,
            "emotional_state": None,
        }
        if not signals or not isinstance(signals, dict):
            return out

        for k, v in signals.items():
            lk = k.strip().lower()
            if lk in ("attention", "att"):
                out["attention"] = _safe_num(v)
            elif lk in ("engagement", "eng"):
                out["engagement"] = _safe_num(v)
            elif lk in ("cognitive_load", "cognitiveload", "load", "cognitiveload_percent"):
                out["cognitive_load"] = _safe_num(v)
            elif lk in ("emotional_state", "emotion", "mood", "emotional"):
                out["emotional_state"] = _safe_num(v)
            # allow numeric fields as common synonyms
            elif lk in ("stress", "fatigue") and out.get("cognitive_load") is None:
                out["cognitive_load"] = _safe_num(v)

        return out

    def analyze_realtime(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze realtime cognitive payload and return UI-friendly summary.

        payload keys:
        - camera_enabled: bool
        - signals: dict
        - history: list of signal dicts (each like signals)
        """
        camera_enabled = bool(payload.get("camera_enabled", False))
        signals = payload.get("signals") or {}
        history = payload.get("history") or []

        normalized = self._normalize_signals(signals)

        # Build per-metric histories
        att_hist = []
        eng_hist = []
        load_hist = []
        emo_hist = []
        if isinstance(history, list):
            for h in history:
                if not isinstance(h, dict):
                    continue
                nh = self._normalize_signals(h)
                att_hist.append(nh.get("attention"))
                eng_hist.append(nh.get("engagement"))
                load_hist.append(nh.get("cognitive_load"))
                emo_hist.append(nh.get("emotional_state"))

        # include current as last point for trend
        att_hist.append(normalized.get("attention"))
        eng_hist.append(normalized.get("engagement"))
        load_hist.append(normalized.get("cognitive_load"))
        emo_hist.append(normalized.get("emotional_state"))

        summary = {
            "camera_required": not camera_enabled,
            "camera_enabled": camera_enabled,
            "metrics": {
                "attention": {
                    "quality": _quality_label(normalized.get("attention")),
                    "current": _percent_display(normalized.get("attention")),
                    "raw_value": normalized.get("attention"),
                    "trend": _trend_from_history(att_hist),
                },
                "cognitive_load": {
                    "quality": _quality_label(normalized.get("cognitive_load")),
                    "current": _percent_display(normalized.get("cognitive_load")),
                    "raw_value": normalized.get("cognitive_load"),
                    "trend": _trend_from_history(load_hist),
                },
                "engagement": {
                    "quality": _quality_label(normalized.get("engagement")),
                    "current": _percent_display(normalized.get("engagement")),
                    "raw_value": normalized.get("engagement"),
                    "trend": _trend_from_history(eng_hist),
                },
                "emotional_state": {
                    "quality": _quality_label(normalized.get("emotional_state")),
                    "current": _percent_display(normalized.get("emotional_state")),
                    "raw_value": normalized.get("emotional_state"),
                    "trend": _trend_from_history(emo_hist),
                },
            },
            "human_readable": {
                "title": "Enhanced Cognitive Analysis",
                "subtitle": "AI-powered real-time cognitive monitoring",
+                "description": "Comprehensive\nInactive\nCamera required for cognitive monitoring."
            }
        }

        return summary


# small convenience instance
cognitive_monitor = CognitiveMonitor()


if __name__ == "__main__":
    # quick smoke test
    example = {
        "camera_enabled": False,
        "signals": {"attention": 72, "engagement": 65, "cognitive_load": 30, "emotional_state": 45},
        "history": [
            {"attention": 70, "engagement": 60, "cognitive_load": 32, "emotional_state": 50},
            {"attention": 71, "engagement": 63, "cognitive_load": 31, "emotional_state": 47}
        ]
    }
    print(cognitive_monitor.analyze_realtime(example))
