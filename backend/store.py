"""Seed demo data + simple stats helpers. Persisted in MongoDB (idempotent seed)."""
from datetime import datetime, timezone, timedelta

SUBJECTS = [
    "Business Studies", "Accountancy", "Economics", "Political Science", "History",
]

# Lighter "answer generation + evaluation" research surface seed
DRI_HISTORY = [
    {
        "id": "gen-001",
        "prompt": "Explain the importance of the planning function of management.",
        "subject": "Business Studies",
        "accuracy": 94, "reasoning": 91, "hallucination": 6,
        "created_at": "2026-06-02T10:15:00Z",
    },
    {
        "id": "gen-002",
        "prompt": "Distinguish between capital market and money market.",
        "subject": "Business Studies",
        "accuracy": 88, "reasoning": 84, "hallucination": 11,
        "created_at": "2026-06-03T14:40:00Z",
    },
    {
        "id": "gen-003",
        "prompt": "Describe the protective functions of SEBI.",
        "subject": "Business Studies",
        "accuracy": 90, "reasoning": 87, "hallucination": 9,
        "created_at": "2026-06-04T09:05:00Z",
    },
]


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat()


def seed_bundles():
    now = datetime.now(timezone.utc)
    base = [
        ("CBSE2026|CAND-0001|BusinessStudies", "Business Studies", "ready"),
        ("CBSE2026|CAND-0002|BusinessStudies", "Business Studies", "ready"),
        ("CBSE2026|CAND-0003|BusinessStudies", "Business Studies", "in_review"),
    ]
    bundles = []
    for i, (code, subject, status) in enumerate(base):
        bundles.append({
            "bundle_id": f"bundle-{i+1:03d}",
            "candidate_code": code,
            "subject": subject,
            "page_count": 24,
            "ingested_at": _iso(now - timedelta(days=2 - i, hours=i)),
            "status": status,
            "synthetic_pages": True,
            "evaluation": None,
            "ai_reading": None,
        })
    return bundles


def seed_deviations():
    return [
        {
            "dev_id": "dev-001", "bundle_id": "bundle-003",
            "candidate_code": "CBSE2026|CAND-0003|BusinessStudies",
            "subject": "Business Studies", "q_no": "Q30",
            "teacher_mark": 5, "ai_mark": 2, "gap": 3, "status": "open",
            "justification": "Only 2 of the 5 organising steps were clearly legible; departmentalisation and coordination steps were missing from the script.",
        },
        {
            "dev_id": "dev-002", "bundle_id": "bundle-003",
            "candidate_code": "CBSE2026|CAND-0003|BusinessStudies",
            "subject": "Business Studies", "q_no": "Q33",
            "teacher_mark": 6, "ai_mark": None, "gap": 6, "status": "open",
            "justification": "The case-study answer page was illegible — no marks were awarded rather than guessing.",
        },
    ]


def seed_devices():
    now = datetime.now(timezone.utc)
    return [
        {"device_id": "scan-01", "name": "Scanner Station 01", "type": "scanner",
         "status": "online", "last_heartbeat": _iso(now)},
        {"device_id": "scan-02", "name": "Scanner Station 02", "type": "scanner",
         "status": "online", "last_heartbeat": _iso(now - timedelta(minutes=3))},
        {"device_id": "eval-01", "name": "Evaluator Terminal 01", "type": "terminal",
         "status": "idle", "last_heartbeat": _iso(now - timedelta(minutes=12))},
    ]


def compute_stats(generations, deviations, bundles):
    gens = generations or DRI_HISTORY
    n = len(gens)
    avg_acc = round(sum(g["accuracy"] for g in gens) / n, 1) if n else 0
    avg_hall = round(sum(g["hallucination"] for g in gens) / n, 1) if n else 0
    open_dev = len([d for d in deviations if d.get("status") == "open"])
    return {
        "generations": n,
        "avg_accuracy": avg_acc,
        "avg_hallucination": avg_hall,
        "open_deviations": open_dev,
        "booklets_in_queue": len([b for b in bundles if b.get("status") in ("ready", "in_review")]),
        "grounding_ratio": 0.92,
        "verification_latency_ms": 740,
    }
