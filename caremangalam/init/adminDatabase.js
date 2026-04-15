const mongoose = require("mongoose");

const sampleData = [
  { name: "Pratham", email: "pratham@gmail.com", paswd: "1111" },
  { name: "Chirag Virdi", email: "chirag@gmail.com", paswd: "2222" },
  { name: "Vasu Aggarwal", email: "vasu@gmail.com", paswd: "3333" },
];

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/caremn");
}

main().then(() => {
  console.log("connection success");
});

const adminDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  paswd: String,
});

const Admin = mongoose.model("Admin", adminDataSchema);

Admin.insertMany(sampleData);

module.exports = Admin;
