from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
import json
import os
from transformers import AutoTokenizer, AutoModel

# ==============================
# App Setup
# ==============================
app = Flask(__name__)
CORS(app)

# ==============================
# Load Model
# ==============================
SAVE_PATH = "./grievance_multitask_model"

print("Loading model...")

with open(os.path.join(SAVE_PATH, "label_maps.json")) as f:
    maps = json.load(f)

category_map = maps["category_map"]
priority_map  = maps["priority_map"]

category_reverse = {v: k for k, v in category_map.items()}
priority_reverse  = {v: k for k, v in priority_map.items()}

authority_map = {
    "Academic":        "Dean Academic Affairs",
    "Administrative":  "Registrar Office",
    "Corruption":      "Anti-Corruption Cell",
    "Examination":     "Examination Controller",
    "Financial":       "Accounts Department",
    "Harassment":      "Internal Complaints Committee",
    "Health & Safety": "Student Welfare Office",
    "Hostel":          "Chief Warden",
    "Infrastructure":  "Maintenance Department",
    "Placement":       "Placement Cell"
}

priority_meta = {
    "High":   {"color": "red",    "badge": "High Priority"},
    "Medium": {"color": "orange", "badge": "Medium Priority"},
    "Low":    {"color": "green",  "badge": "Low Priority"},
}

tokenizer = AutoTokenizer.from_pretrained(SAVE_PATH)
encoder   = AutoModel.from_pretrained(SAVE_PATH)

num_cat = len(category_map)
num_pri = len(priority_map)

cat_head = nn.Linear(encoder.config.hidden_size, num_cat)
pri_head = nn.Linear(encoder.config.hidden_size, num_pri)

cat_head.load_state_dict(
    torch.load(os.path.join(SAVE_PATH, "category_classifier.pt"), map_location="cpu")
)
pri_head.load_state_dict(
    torch.load(os.path.join(SAVE_PATH, "priority_classifier.pt"), map_location="cpu")
)

encoder.eval()
cat_head.eval()
pri_head.eval()

print("Model loaded successfully!")

# ==============================
# Prediction Function
# ==============================
CONFIDENCE_THRESHOLD = 0.80

def predict(complaint_text):
    inputs = tokenizer(
        complaint_text,
        return_tensors="pt",
        padding="max_length",
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        output     = encoder(**inputs)
        pooled     = output.last_hidden_state[:, 0]

        cat_logits = cat_head(pooled)
        pri_logits = pri_head(pooled)

        cat_probs = F.softmax(cat_logits, dim=-1)
        pri_probs = F.softmax(pri_logits, dim=-1)

        cat_confidence, cat_idx = torch.max(cat_probs, dim=-1)
        pri_confidence, pri_idx = torch.max(pri_probs, dim=-1)

        cat_confidence = round(cat_confidence.item(), 4)
        pri_confidence = round(pri_confidence.item(), 4)
        cat_idx        = cat_idx.item()
        pri_idx        = pri_idx.item()

    category  = category_reverse[cat_idx]
    priority  = priority_reverse[pri_idx]
    authority = authority_map.get(category, "Admin Office")

    overall_confidence  = round((cat_confidence + pri_confidence) / 2, 4)
    needs_manual_review = overall_confidence < CONFIDENCE_THRESHOLD

    return {
        "category":             category,
        "priority":             priority,
        "authority":            authority,
        "category_confidence":  cat_confidence,
        "priority_confidence":  pri_confidence,
        "overall_confidence":   overall_confidence,
        "needs_manual_review":  needs_manual_review,
        "priority_color":       priority_meta[priority]["color"],
        "priority_badge":       priority_meta[priority]["badge"],
    }

# ==============================
# Routes
# ==============================

@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json()

    required = ["complaint", "student_name", "student_id", "department", "email"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    complaint    = data["complaint"].strip()
    student_name = data["student_name"].strip()
    student_id   = data["student_id"].strip()
    department   = data["department"].strip()
    email        = data["email"].strip()

    if len(complaint) < 10:
        return jsonify({"error": "Complaint text is too short"}), 400

    # Run AI prediction
    result = predict(complaint)

    return jsonify({
        "success":              True,
        "student_name":         student_name,
        "student_id":           student_id,
        "department":           department,
        "email":                email,
        "complaint":            complaint,
        "category":             result["category"],
        "priority":             result["priority"],
        "priority_badge":       result["priority_badge"],
        "priority_color":       result["priority_color"],
        "authority":            result["authority"],
        "category_confidence":  result["category_confidence"],
        "priority_confidence":  result["priority_confidence"],
        "overall_confidence":   result["overall_confidence"],
        "needs_manual_review":  result["needs_manual_review"],
        "message": (
            "Low confidence - this grievance has been flagged for manual review."
            if result["needs_manual_review"]
            else f"Grievance assigned to {result['authority']} with {result['priority']} priority."
        )
    }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "loaded"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
