# app.py
import os
import datetime
from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["rising_bar_city_db"]
entries_col = db["entries"]

CATEGORIES = [
    "school",
    "work",
    "relationships",
    "health",
    "creativity",
    "rest",
]

# how many entries to use for windows/tooltip per building
MAX_RECENT_ENTRIES = 36   # for windows (building grid)
MAX_TOOLTIP_ENTRIES = 5   # for hover text


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/submit", methods=["POST"])
def submit():
    """
    Receives a single user submission from the questionnaire.
    Body JSON: {
      "category": "school",
      "goal": "...",
      "change_needed": "...",
      "confidence": 3
    }
    """
    data = request.get_json()

    category = data.get("category")
    goal = (data.get("goal") or "").strip()
    change_needed = (data.get("change_needed") or "").strip()
    confidence = data.get("confidence")

    # Basic validation
    if category not in CATEGORIES:
        return jsonify({"error": "Invalid category"}), 400

    try:
        confidence = int(confidence)
    except (TypeError, ValueError):
        return jsonify({"error": "Confidence must be an integer 1–5"}), 400

    if confidence < 1 or confidence > 5:
        return jsonify({"error": "Confidence must be between 1 and 5"}), 400

    doc = {
        "category": category,
        "goal": goal,
        "change_needed": change_needed,
        "confidence": confidence,
        "created_at": datetime.datetime.utcnow(),
    }

    entries_col.insert_one(doc)

    return jsonify({"status": "ok"}), 201


@app.route("/api/stats", methods=["GET"])
def stats():
    """
    Returns per-category data for the skyline view.
    For each category:
      - total_count: total submissions in DB
      - recent_entries: up to MAX_RECENT_ENTRIES latest docs with goal, change_needed, confidence
      - tooltip_entries: up to MAX_TOOLTIP_ENTRIES latest docs (same as above)
      - avg_confidence_recent: average confidence of recent_entries
    """
    result = {}

    for cat in CATEGORIES:
        # total count for info (even if we don't show all)
        total_count = entries_col.count_documents({"category": cat})

        # most recent entries (for windows grid)
        recent_cursor = (
            entries_col.find({"category": cat})
            .sort("created_at", -1)
            .limit(MAX_RECENT_ENTRIES)
        )
        recent_docs = list(recent_cursor)

        # tooltip entries = last N (subset of recent)
        tooltip_docs = recent_docs[:MAX_TOOLTIP_ENTRIES]

        # build serializable lists
        recent_entries = [
            {
                "goal": d.get("goal", ""),
                "change_needed": d.get("change_needed", ""),
                "confidence": d.get("confidence", 0),
            }
            for d in recent_docs
        ]

        tooltip_entries = [
            {
                "goal": d.get("goal", ""),
                "change_needed": d.get("change_needed", ""),
                "confidence": d.get("confidence", 0),
            }
            for d in tooltip_docs
        ]

        # average confidence for recent entries
        if recent_entries:
            avg_conf = sum(e["confidence"] for e in recent_entries) / len(recent_entries)
        else:
            avg_conf = 0

        result[cat] = {
            "total_count": total_count,
            "recent_entries": recent_entries,
            "tooltip_entries": tooltip_entries,
            "avg_confidence_recent": avg_conf,
        }

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
