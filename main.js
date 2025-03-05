// Required if running in Node.js
const fs = require('fs').promises;
const path = require('path');

// File path to store previous results
const STORAGE_FILE = path.join(__dirname, 'canada_internships_data.json');

// Function to scrape the GitHub repository for Canadian internship listings
async function scrapeCanadianInternships() {
  try {
    // Fetch the README content from the repository
    const response = await fetch('https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/master/README.md');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const markdown = await response.text();
    
    // Split the markdown into lines to properly parse the table
    const lines = markdown.split('\n');
    
    // Find the table header line (which contains "Company | Role | Location")
    const headerLineIndex = lines.findIndex(line => 
      line.includes('Company') && 
      line.includes('Role') && 
      line.includes('Location') && 
      line.includes('|')
    );
    
    if (headerLineIndex === -1) {
      throw new Error('Could not find the internship table header in the README');
    }
    
    // Process the table rows (skipping the separator line after the header)
    const tableRows = [];
    let i = headerLineIndex + 2; // Skip header and separator line
    
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      tableRows.push(lines[i]);
      i++;
    }
    
    // Parse the rows to extract internship data
    const canadianInternships = [];
    
    for (const row of tableRows) {
      const cells = row.split('|').map(cell => cell.trim());
      
      // The cells should be in the format: | Company | Role | Location | Application | Date Posted |
      // So after splitting, cells[0] is empty, cells[1] is Company, cells[2] is Role, etc.
      if (cells.length >= 6) {
        const company = cells[1];
        const role = cells[2];
        const location = cells[3];
        const application = cells[4];
        const datePosted = cells[5];
        
        // Check if the location contains "Canada" or Canadian cities
        const canadianCities = ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Edmonton", "Quebec", "Waterloo", "Kitchener", "Canada"];
        const isCanadian = canadianCities.some(city => location.includes(city));
        
        if (isCanadian) {
          // Create a unique identifier for this job
          const jobId = `${company}-${role}-${location}`.replace(/\s+/g, '-').toLowerCase();
          
          canadianInternships.push({
            id: jobId,
            company,
            role,
            location,
            application: parseApplicationLink(application),
            datePosted,
            firstSeen: new Date().toISOString()
          });
        }
      }
    }
    
    return canadianInternships;
  } catch (error) {
    console.error('Error scraping internships:', error);
    return [];
  }
}

// Helper function to parse and extract the application link
function parseApplicationLink(applicationCell) {
  // The application column typically contains markdown links like "[Apply](https://example.com)"
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const match = applicationCell.match(linkRegex);
  
  if (match) {
    return {
      text: match[1],
      url: match[2]
    };
  }
  
  return {
    text: applicationCell,
    url: null
  };
}

// Function to load previous results
async function loadPreviousResults() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or has invalid JSON, return empty object
    return { lastChecked: null, internships: [] };
  }
}

// Function to save current results
async function saveResults(data) {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('Results saved to file successfully');
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Function to identify new postings
function findNewPostings(currentInternships, previousInternships) {
  const previousIds = new Set(previousInternships.map(job => job.id));
  return currentInternships.filter(job => !previousIds.has(job.id));
}

// Function to send email notification (requires additional setup with an email service)
async function sendEmailNotification(newJobs) {
  if (newJobs.length === 0) return;
  
  console.log('🔔 New job notifications would be sent here.');
  console.log(`${newJobs.length} new Canadian internships found!`);
  
  // This is a placeholder for actual email sending code
  // To implement email sending, you would need to use a service like:
  // - Nodemailer for Node.js
  // - SendGrid, Mailgun, or similar email APIs
  
  /* Example implementation with Nodemailer would look like:
  
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password' // Use app password if 2FA is enabled
    }
  });
  
  let emailContent = `<h1>${newJobs.length} New Canadian Summer 2025 Internships</h1>`;
  emailContent += '<ul>';
  
  newJobs.forEach(job => {
    emailContent += `<li><b>${job.company}</b> - ${job.role} (${job.location})`;
    if (job.application.url) {
      emailContent += ` - <a href="${job.application.url}">Apply Here</a>`;
    }
    emailContent += `</li>`;
  });
  
  emailContent += '</ul>';
  
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient-email@example.com',
    subject: `${newJobs.length} New Canadian Internships Found`,
    html: emailContent
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  */
}

// Function to display the results
function displayResults(internships, newInternships) {
  console.log(`Found ${internships.length} Canadian internship opportunities for Summer 2025`);
  
  if (newInternships.length > 0) {
    console.log(`\n🌟 ${newInternships.length} NEW POSTINGS FOUND 🌟`);
    
    newInternships.forEach((job, index) => {
      console.log(`\n--- New Job ${index + 1} ---`);
      console.log(`Company: ${job.company}`);
      console.log(`Role: ${job.role}`);
      console.log(`Location: ${job.location}`);
      console.log(`Application: ${job.application.text} - ${job.application.url || 'No direct link'}`);
      console.log(`Date Posted: ${job.datePosted}`);
    });
  }
  
  console.log('\nAll Canadian Internships:');
  internships.forEach((job, index) => {
    console.log(`\n--- Job ${index + 1} ---`);
    console.log(`Company: ${job.company}`);
    console.log(`Role: ${job.role}`);
    console.log(`Location: ${job.location}`);
    console.log(`Application: ${job.application.text} - ${job.application.url || 'No direct link'}`);
    console.log(`Date Posted: ${job.datePosted}`);
    console.log(`First Seen: ${new Date(job.firstSeen).toLocaleString()}`);
  });
}

// Main function to run the daily check
async function checkForInternships() {
  console.log("Checking for Canadian internships from SimplifyJobs/Summer2025-Internships...");
  
  // Get current internships
  const currentInternships = await scrapeCanadianInternships();
  
  if (currentInternships.length === 0) {
    console.log("⚠️ No Canadian internships found. This could be due to parsing issues or there might not be any Canadian listings currently.");
  }
  
  // Load previous results
  const storedData = await loadPreviousResults();
  const previousInternships = storedData.internships || [];
  
  // Find new postings
  const newInternships = findNewPostings(currentInternships, previousInternships);
  
  // Display results
  displayResults(currentInternships, newInternships);
  
  // Send notification for new postings
  if (newInternships.length > 0) {
    await sendEmailNotification(newInternships);
  }
  
  // Merge new and existing internships, keeping the earliest firstSeen date
  const mergedInternships = [...currentInternships];
  
  // Create a map for quick lookup
  const previousInternshipsMap = new Map(
    previousInternships.map(job => [job.id, job])
  );
  
  // Update firstSeen dates for existing jobs
  mergedInternships.forEach(job => {
    const previousJob = previousInternshipsMap.get(job.id);
    if (previousJob && previousJob.firstSeen) {
      job.firstSeen = previousJob.firstSeen;
    }
  });
  
  // Save updated results
  await saveResults({
    lastChecked: new Date().toISOString(),
    internships: mergedInternships
  });
  
  console.log(`Check completed at ${new Date().toLocaleString()}`);
  console.log(`Next check scheduled for tomorrow at the same time.`);
}

// Function to schedule daily checks
function scheduleDailyChecks() {
  // Run immediately on startup
  checkForInternships();
  
  // Calculate time until tomorrow at the same time
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(now.getHours(), now.getMinutes(), 0, 0);
  
  const timeUntilNextCheck = tomorrow - now;
  
  // Schedule the next check
  console.log(`Next check scheduled for ${tomorrow.toLocaleString()}`);
  setTimeout(() => {
    checkForInternships();
    // Set up recurring daily checks
    setInterval(checkForInternships, 24 * 60 * 60 * 1000);
  }, timeUntilNextCheck);
}

// Start the application
scheduleDailyChecks();