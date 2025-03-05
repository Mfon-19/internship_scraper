const express = require("express");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const app = express();

// Serve static files from the public directory
app.use(express.static("public"));

// Serve index.html for the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add this function to save the latest data
async function saveLatestData() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/master/README.md");
    const markdown = await response.text();
    // Your existing parsing logic...

    // Save the cleaned data
    fs.writeFileSync(path.join(__dirname, "public", "canada_internships_data.json"), JSON.stringify(data, null, 2));

    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error updating data:", error);
  }
}

// Run once at startup
saveLatestData();

// Run every 6 hours
setInterval(saveLatestData, 6 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
