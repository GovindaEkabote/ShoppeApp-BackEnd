const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensures no duplicate country names
    },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", countrySchema);
module.exports = Country;
