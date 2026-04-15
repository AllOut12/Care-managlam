const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const Student = require("./init/studentdata.js");
const Admin = require("./init/adminDatabase.js");

app.set("view engine", "views");
app.set("views", path.join(__dirname, "views"));
app.use(methodoverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const FLASK_URL = "http://127.0.0.1:5001";

// ─── AI Classification helper ─────────────────────────────────────────────────
async function classifyComplaint(complaintText, studentObj) {
  try {
    const response = await fetch(`${FLASK_URL}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaint: complaintText,
        student_name: studentObj.sname,
        student_id: String(studentObj.sroll),
        email: studentObj.email,
      }),
    });

    const data = await response.json();

    console.log("AI RESPONSE:", data);

    if (!data.success) return null;

    return data;
  } catch (err) {
    console.error("Flask classify error:", err);
    return null;
  }
}

// ─── DB ───────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/caremn");
}
main().then(() => console.log("DB connected"));

app.listen(8080, () => console.log("Server on :8080"));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("home"));

app.get("/login", (req, res) => res.render("login.ejs"));

let student;

app.post("/studentlogin", async (req, res) => {
  const { email, paswd } = req.body;

  try {
    const found = await Student.findOne({ email });

    if (!found) {
      console.log("No user found");
      return res.redirect("/login");
    }

    if (paswd !== found.paswd) {
      console.log("Wrong password");
      return res.redirect("/login");
    }

    student = found;
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    student = await Student.findOne({ email: student.email });
    res.render("studentDashboard.ejs", { student });
  } catch {
    res.redirect("/login");
  }
});

// ─── New complaint: classify on submit ───────────────────────────────────────
app.get("/newcomplaint", async (req, res) => {
  const { comp, room, building, floor } = req.query;
  const complaintText = `${comp}, room no ${room}, ${floor} Floor, ${building}`;

  try {
    const ai = await classifyComplaint(complaintText, student);
    const newComplaint = {
      complaint: complaintText,

      category: ai?.category || "Uncategorized",
      priority: ai?.priority || "Medium",
      authority: ai?.authority || "Admin Office",

      // AUTO ASSIGN HERE
      status: ai?.needs_manual_review ? "Pending" : "Assign",

      needs_manual_review: ai?.needs_manual_review ?? true,

      category_confidence: ai?.category_confidence || 0,
      priority_confidence: ai?.priority_confidence || 0,
      overall_confidence: ai?.overall_confidence || 0,

      priority_badge: ai?.priority_badge || "Medium Priority",
      priority_color: ai?.priority_color || "orange",

      ai_classified: !!ai,
    };
    await Student.updateOne(
      { _id: student._id },
      { $push: { complaints: newComplaint } },
    );
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// ─── Admin auth ───────────────────────────────────────────────────────────────
app.get("/admin", (req, res) => res.render("adminlogin.ejs"));

let admin;

app.post("/admindashboard", async (req, res) => {
  try {
    const { email, paswd } = req.body;
    admin = await Admin.findOne({ email });
    if (paswd === admin.paswd) res.redirect("/admindashboard");
    else res.redirect("/login");
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
});

app.get("/admindashboard", async (req, res) => {
  try {
    admin = await Admin.findOne({ email: admin.email });
    const allStudents = await Student.find();

    let allComplaints = [];
    for (const s of allStudents)
      for (const c of s.complaints) allComplaints.unshift(c);

    const resolvedComplaints = allComplaints.filter(
      (c) => c.status === "Resolved",
    );
    const pendingComplaints = allComplaints.filter(
      (c) => c.status === "Pending",
    );
    const inprogressConplaints = allComplaints.filter(
      (c) => c.status !== "Pending" && c.status !== "Resolved",
    );
    const manualReviewComplaints = allComplaints.filter(
      (c) => c.needs_manual_review,
    );
    const autoComplaints = allComplaints.filter((c) => !c.needs_manual_review);

    res.render("admindashboard.ejs", {
      admin,
      allComplaints,
      pendingComplaints,
      resolvedComplaints,
      inprogressConplaints,
      manualReviewComplaints,
      autoComplaints,
    });
  } catch {
    res.redirect("/login");
  }
});

// ─── Workflow status transitions ──────────────────────────────────────────────
app.get("/status/:id/pending", async (req, res) => {
  try {
    await Student.updateOne(
      { "complaints._id": req.params.id },
      { $set: { "complaints.$.status": "Assign" } },
    );
    res.redirect("/admindashboard");
  } catch {
    res.redirect("/login");
  }
});

app.get("/status/:id/assign", async (req, res) => {
  try {
    await Student.updateOne(
      { "complaints._id": req.params.id },
      { $set: { "complaints.$.status": "Resolved" } },
    );
    res.redirect("/admindashboard");
  } catch {
    res.redirect("/login");
  }
});

app.get("/status/:id/Resolved", (req, res) => res.redirect("/admindashboard"));

// ─── Admin re-classify: look up student + call Flask ─────────────────────────
app.post("/reclassify/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find which student owns this complaint
    const studentDoc = await Student.findOne({ "complaints._id": id });
    if (!studentDoc)
      return res
        .status(404)
        .json({ success: false, error: "Complaint not found" });

    const comp = studentDoc.complaints.id(id);
    const complaintText = comp?.complaint || req.body.complaintText || "";

    const ai = await classifyComplaint(complaintText, studentDoc);

    if (!ai)
      return res
        .status(502)
        .json({ success: false, error: "AI service unavailable" });

    await Student.updateOne(
      { "complaints._id": id },
      {
        $set: {
          "complaints.$.category": ai.category,
          "complaints.$.priority": ai.priority,
          "complaints.$.authority": ai.authority,
          "complaints.$.needs_manual_review": ai.needs_manual_review,
          "complaints.$.category_confidence": ai.category_confidence,
          "complaints.$.priority_confidence": ai.priority_confidence,
          "complaints.$.overall_confidence": ai.overall_confidence,
          "complaints.$.priority_badge": ai.priority_badge,
          "complaints.$.priority_color": ai.priority_color,
          "complaints.$.ai_classified": true,
        },
      },
    );
    res.json({ success: true, ...ai });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin manual priority override ──────────────────────────────────────────
app.post("/priority/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const colors = { High: "red", Medium: "orange", Low: "green" };
    const badges = {
      High: "High Priority",
      Medium: "Medium Priority",
      Low: "Low Priority",
    };

    await Student.updateOne(
      { "complaints._id": id },
      {
        $set: {
          "complaints.$.priority": priority,
          "complaints.$.priority_color": colors[priority] || "orange",
          "complaints.$.priority_badge": badges[priority] || "Medium Priority",
          "complaints.$.needs_manual_review": false,
        },
      },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const authorityMap = {
      Hostel: "Chief Warden",
      Infrastructure: "Maintenance Department",
      Academic: "Dean Academic Affairs",
      Administrative: "Registrar Office",
      Financial: "Accounts Department",
      Harassment: "Internal Complaints Committee",
      "Health & Safety": "Student Welfare Office",
      Placement: "Placement Cell",
    };

    await Student.updateOne(
      { "complaints._id": id },
      {
        $set: {
          "complaints.$.category": category,
          "complaints.$.authority": authorityMap[category],
          "complaints.$.needs_manual_review": false,
        },
      },
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.get("/logout", (req, res) => {
  student = "";
  admin = "";
  res.redirect("/login");
});
