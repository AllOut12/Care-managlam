# 🏥 Care Mangalam — Smart Grievance Management System

> An AI-powered online grievance portal that automatically classifies, prioritizes, and routes student complaints to the right authority — built for Care Mangalam institution.

---

## 📌 Overview

**Care Mangalam** is an intelligent grievance management system that allows students to submit complaints online. Behind the scenes, a fine-tuned BERT-based deep learning model automatically:

- Classifies the complaint into a **category** (e.g., Academic, Hostel, Financial)
- Assigns a **priority level** (High, Medium, or Low)
- Routes the complaint to the **appropriate authority**
- Flags low-confidence predictions for **manual review**

This eliminates manual sorting, speeds up resolution, and ensures no complaint goes unnoticed.

---

## ✨ Features

- 🤖 **AI-Powered Classification** — Multitask BERT model trained to predict category and priority simultaneously
- 🏷️ **Auto-Routing** — Each complaint is automatically forwarded to the correct department/authority
- 🚨 **Priority Badges** — High, Medium, and Low priority labels with color indicators
- 🔍 **Confidence Scoring** — Overall confidence score returned with every prediction
- ⚠️ **Manual Review Flag** — Low-confidence predictions (< 60%) are flagged for human review
- 🌐 **REST API** — Clean Flask API ready to integrate with any frontend

---

## 🗂️ Grievance Categories & Authorities

| Category        | Assigned Authority                  |
|-----------------|--------------------------------------|
| Academic        | Dean Academic Affairs                |
| Administrative  | Registrar Office                     |
| Corruption      | Anti-Corruption Cell                 |
| Examination     | Examination Controller               |
| Financial       | Accounts Department                  |
| Harassment      | Internal Complaints Committee        |
| Health & Safety | Student Welfare Office               |
| Hostel          | Chief Warden                         |
| Infrastructure  | Maintenance Department               |
| Placement       | Placement Cell                       |

---

## 🧠 Model Architecture

The classification model is a **multitask neural network** built on top of a pretrained transformer encoder:

```
Input Text
    ↓
Tokenizer (AutoTokenizer)
    ↓
BERT Encoder (AutoModel) — [CLS] token pooling
    ↓
    ├── Category Classification Head (Linear → Softmax)
    └── Priority Classification Head (Linear → Softmax)
```

- **Base Model:** Pretrained transformer (saved at `./grievance_multitask_model`)
- **Tasks:** Category classification (10 classes) + Priority classification (3 classes)
- **Input:** Max 128 tokens
- **Confidence Threshold:** 0.60 (below this → flagged for manual review)

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- PyTorch
- HuggingFace Transformers
- Flask
- flask-cors

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/care-mangalam.git
cd care-mangalam

# Install dependencies
pip install -r requirements.txt
```

### Required Files

Make sure the following files exist inside `./grievance_multitask_model/`:

```
grievance_multitask_model/
├── config.json
├── tokenizer_config.json
├── vocab.txt (or tokenizer.json)
├── pytorch_model.bin (or model.safetensors)
├── category_classifier.pt
├── priority_classifier.pt
└── label_maps.json
```

### Running the API

```bash
python app.py
```

The server starts on `http://0.0.0.0:5001`

---

## 📡 API Reference

### `POST /classify`

Classifies a student grievance and returns category, priority, and assigned authority.

**Request Body:**

```json
{
  "complaint": "The hostel mess food quality has been very poor for the past month.",
  "student_name": "Rahul Sharma",
  "student_id": "CM2024001",
  "email": "rahul@caremangalam.edu.in"
}
```

**Response:**

```json
{
  "success": true,
  "student_name": "Rahul Sharma",
  "student_id": "CM2024001",
  "email": "rahul@caremangalam.edu.in",
  "complaint": "The hostel mess food quality has been very poor for the past month.",
  "category": "Hostel",
  "priority": "Medium",
  "priority_badge": "Medium Priority",
  "priority_color": "orange",
  "authority": "Chief Warden",
  "category_confidence": 0.9123,
  "priority_confidence": 0.8456,
  "overall_confidence": 0.8790,
  "needs_manual_review": false,
  "message": "Grievance assigned to Chief Warden with Medium priority."
}
```

**Validation Rules:**
- All four fields (`complaint`, `student_name`, `student_id`, `email`) are required
- Complaint must be at least 10 characters long

---

### `GET /health`

Health check endpoint to verify the API and model are running.

**Response:**

```json
{
  "status": "ok",
  "model": "loaded"
}
```

---

## 📁 Project Structure

```
care-mangalam/
├── init/                             # Initialization scripts
│   ├── adminDatabase.js              # Admin DB setup
│   └── studentdata.js                # Student data seeding
│
├── public/                           # Static assets
│   ├── img/                          # Images
│   ├── adminDash.css                 # Admin dashboard styles
│   ├── admindash.js                  # Admin dashboard scripts
│   ├── dashboard.css                 # Dashboard styles
│   ├── script.js                     # Main frontend script
│   ├── studash.js                    # Student dashboard scripts
│   └── style.css                     # Global styles
│
├── views/                            # EJS templates
│   ├── admindashboard.ejs            # Admin dashboard page
│   ├── login.ejs                     # Login page
│   └── studentDashboard.ejs          # Student dashboard page
│
├── grievance_multitask_model/        # AI model files
│   ├── category_classifier.pt        # Category classification head
│   ├── priority_classifier.pt        # Priority classification head
│   ├── config.json                   # Model config
│   ├── label_maps.json               # Category & priority label maps
│   ├── model.safetensors             # BERT encoder weights
│   ├── tokenizer_config.json         # Tokenizer config
│   └── tokenizer.json                # Tokenizer vocab & rules
│
├── node_modules/                     # Node.js dependencies
├── venv/                             # Python virtual environment
├── index.js                          # Node.js/Express entry point
├── package.json                      # Node.js project manifest
├── package-lock.json                 # Dependency lock file
├── app.py                            # Flask ML API (port 5001)
├── appp.py                           # (alternate/test Flask script)
├── .gitignore                        # Git ignored files
└── README.md
```

---

## ⚙️ Configuration

| Parameter              | Value  | Description                                      |
|------------------------|--------|--------------------------------------------------|
| `CONFIDENCE_THRESHOLD` | 0.60   | Minimum confidence to auto-assign; below → manual review |
| `MAX_LENGTH`           | 128    | Maximum token length for input text              |
| `PORT`                 | 5001   | Flask server port                                |

---

## 🖥️ Node.js Server (`index.js`)

The Express.js server is the backbone of the application. It runs on **port 8080**, connects to MongoDB, serves EJS-rendered views, and acts as the bridge between the student/admin UI and the Flask ML service.

### How It Works

```
Student/Admin Browser
        ↓  (HTTP Request)
  Express.js (index.js) — port 8080
        ↓
   MongoDB (Mongoose)          Flask ML API — port 5001
        ↑                              ↑
   Read/Write complaints    classifyComplaint() helper
```

### Student Flow

1. Student logs in via `POST /studentlogin` — credentials checked against MongoDB
2. On success, redirected to `/dashboard` — renders `studentDashboard.ejs` with their complaint history
3. Student submits a new complaint via `GET /newcomplaint?comp=...&room=...&floor=...&building=...`
4. The complaint text is assembled and sent to the Flask `/classify` endpoint via `classifyComplaint()`
5. The AI response (category, priority, authority, confidence scores) is saved into the student's `complaints` array in MongoDB
6. If `needs_manual_review` is `true` → status set to `"Pending"`, otherwise `"Assign"` (auto-assigned)
7. Student is redirected back to their dashboard

### Admin Flow

1. Admin logs in via `POST /admindashboard` — credentials checked against MongoDB
2. On success, redirected to `/admindashboard` — renders `admindashboard.ejs`
3. All complaints from all students are aggregated and split into views:
   - ✅ Resolved
   - ⏳ Pending
   - 🔄 In Progress
   - ⚠️ Needs Manual Review
   - 🤖 Auto-classified
4. Admin can perform the following actions on any complaint:

| Action | Route | Description |
|--------|-------|-------------|
| Advance status | `GET /status/:id/pending` or `/assign` | Moves complaint: Pending → Assign → Resolved |
| Re-classify | `POST /reclassify/:id` | Re-sends complaint to Flask AI and updates result in DB |
| Override priority | `POST /priority/:id` | Manually set High / Medium / Low |
| Override category | `POST /category/:id` | Manually set category & re-assign authority |

### `classifyComplaint()` Helper

This async function is called every time a new complaint is submitted or re-classified. It sends a `POST` request to the Flask service at `http://127.0.0.1:5001/classify` with the complaint text and student info, then returns the full AI result object (category, priority, authority, confidence scores, manual review flag).

If Flask is unreachable, it returns `null` and the complaint is saved with safe fallback defaults.

---

## 🗄️ Database Schema

Complaints are stored as an embedded array inside each Student document in MongoDB:

```js
// Student Document (simplified)
{
  sname: String,
  sroll: Number,
  email: String,
  paswd: String,
  complaints: [
    {
      complaint: String,
      category: String,
      priority: String,           // "High" | "Medium" | "Low"
      authority: String,
      status: String,             // "Pending" | "Assign" | "Resolved"
      needs_manual_review: Boolean,
      category_confidence: Number,
      priority_confidence: Number,
      overall_confidence: Number,
      priority_badge: String,
      priority_color: String,     // "red" | "orange" | "green"
      ai_classified: Boolean
    }
  ]
}
```

---

## 🛠️ Tech Stack

| Layer              | Technology                                    |
|--------------------|-----------------------------------------------|
| Web Server         | Node.js, Express.js (port 8080)               |
| Templating         | EJS (Embedded JavaScript Templates)           |
| Styling            | CSS (adminDash.css, dashboard.css, style.css) |
| ML Service         | Python, Flask, Flask-CORS (port 5001)         |
| Database           | MongoDB (via Mongoose ODM)                    |
| ML Model           | PyTorch, HuggingFace Transformers             |
| Model Architecture | BERT-based Multitask Classifier               |

---

## 📄 License

This project is developed for **Care Mangalam** institution. All rights reserved.

---
.
