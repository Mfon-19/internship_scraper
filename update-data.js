const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

async function scrapeCanadianInternships() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/master/README.md");
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    const markdown = await response.text();

    // Split the markdown into lines to properly parse the table
    const lines = markdown.split("\n");

    // Find the table header line
    const headerLineIndex = lines.findIndex((line) => line.includes("Company") && line.includes("Role") && line.includes("Location") && line.includes("|"));

    if (headerLineIndex === -1) {
      throw new Error("Could not find the internship table header in the README");
    }

    // Process the table rows (skipping the separator line after the header)
    const tableRows = [];
    let i = headerLineIndex + 2;

    while (i < lines.length && lines[i].trim().startsWith("|")) {
      tableRows.push(lines[i]);
      i++;
    }

    // Parse the rows to extract internship data
    const canadianInternships = [];

    for (const row of tableRows) {
      const cells = row.split("|").map((cell) => cell.trim());

      if (cells.length >= 6) {
        const company = cells[1];
        const role = cells[2];
        const location = cells[3];
        const application = cells[4];
        const datePosted = cells[5];

        // Check if the location contains "Canada" or Canadian cities
        const canadianCities = ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Edmonton", "Quebec", "Waterloo", "Kitchener", "Canada"];
        const isCanadian = canadianCities.some((city) => location.includes(city));

        if (isCanadian) {
          // Create a unique identifier for this job
          const jobId = `${company}-${role}-${location}`.replace(/\s+/g, "-").toLowerCase();

          canadianInternships.push({
            id: jobId,
            company,
            role,
            location,
            application: parseApplicationLink(application),
            datePosted,
            firstSeen: new Date().toISOString(),
          });
        }
      }
    }

    return canadianInternships;
  } catch (error) {
    console.error("Error scraping internships:", error);
    return [];
  }
}

function parseApplicationLink(applicationCell) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const match = applicationCell.match(linkRegex);

  if (match) {
    return {
      text: match[1],
      url: match[2],
    };
  }

  return {
    text: applicationCell,
    url: null,
  };
}

async function updateData() {
  try {
    const internships = await scrapeCanadianInternships();
    const data = {
      lastChecked: new Date().toISOString(),
      internships,
    };

    fs.writeFileSync(path.join(__dirname, "docs", "canada_internships_data.json"), JSON.stringify(data, null, 2));

    console.log("Data updated successfully");
  } catch (error) {
    console.error("Error updating data:", error);
    process.exit(1);
  }
}

updateData();
