const mongoose = require("mongoose");

const studentDataSchema = new mongoose.Schema({
  sname: String,
  sroll: Number,
  school: String,
  dept: String,
  email: String,
  paswd: String,
  complaints: [
    {
      status: { type: String, default: "Pending" },
      complaint: String,
      category: { type: String, default: "Uncategorized" },
      priority: { type: String, default: "Medium" },
      authority: { type: String, default: "Admin Office" },
      needs_manual_review: { type: Boolean, default: true },
      category_confidence: { type: Number, default: 0 },
      priority_confidence: { type: Number, default: 0 },
      overall_confidence: { type: Number, default: 0 },
      priority_badge: { type: String, default: "Medium Priority" },
      priority_color: { type: String, default: "orange" },
      ai_classified: { type: Boolean, default: false },
    },
  ],
});

const Student = mongoose.model("Student", studentDataSchema);


const sampleStudents = [
  {
    sname: "Rahul Sharma",
    sroll: 101,
    school: "SOET",
    dept: "CSE",
    email: "rahul@gmail.com",
    paswd: "1111",
    complaints: []
  },
  {
    sname: "Priya Verma",
    sroll: 102,
    school: "SOET",
    dept: "IT",
    email: "priya@gmail.com",
    paswd: "2222",
    complaints: []
  },
  {
    sname: "Aman Gupta",
    sroll: 103,
    school: "SOET",
    dept: "AI",
    email: "aman@gmail.com",
    paswd: "3333",
    complaints: []
  }
];


async function seedStudents() {
  await mongoose.connect("mongodb://127.0.0.1:27017/caremn");

  await Student.deleteMany({});
  await Student.insertMany(sampleStudents);

  console.log("Students inserted");
}

// seedStudents();

module.exports = Student;