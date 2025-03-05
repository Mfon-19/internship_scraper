// State
let internshipsData = [];
let filteredData = [];
let currentSort = {
  column: "firstSeen",
  direction: "desc",
};
let currentPage = 1;
const itemsPerPage = 10;
let newInternshipCutoff = new Date();
newInternshipCutoff.setDate(newInternshipCutoff.getDate() - 1);

// Clean and format internship data
function cleanInternshipData(data) {
  if (!data || !data.internships) return data;

  let lastCompany = "";
  const cleanedInternships = data.internships.map((job) => {
    // Clean company name
    let company = job.company;
    if (company === "↳") {
      company = lastCompany;
    } else {
      // Remove markdown/HTML formatting
      company = company
        .replace(/\*\*/g, "") // Remove **
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract text from markdown links
        .trim();
      lastCompany = company;
    }

    // Clean location
    const location = job.location
      .replace(/<\/?br>/g, " or ") // Replace HTML breaks with ' or '
      .replace(/,\s*Canada$/, "") // Remove ", Canada" suffix
      .trim();

    // Extract application URL from HTML
    let applicationUrl = null;
    if (job.application.text) {
      const urlMatch = job.application.text.match(/href="([^"]+)"/);
      if (urlMatch) {
        applicationUrl = urlMatch[1];
        // Remove tracking parameters
        applicationUrl = applicationUrl.split("?")[0];
      }
    }

    // Clean role
    const role = job.role.replace(/[🛂🤖]/g, "").trim(); // Remove emojis

    return {
      id: job.id,
      company,
      role,
      location,
      application: {
        text: "Apply",
        url: applicationUrl,
      },
      datePosted: job.datePosted,
      firstSeen: job.firstSeen,
    };
  });

  // Filter out duplicates and non-Canadian positions
  const seenIds = new Set();
  const validLocations = ["Toronto", "Vancouver", "Montreal", "Ottawa", "Waterloo", "Mississauga", "Calgary", "Edmonton", "Quebec", "Remote"];

  const filteredInternships = cleanedInternships.filter((job) => {
    // Check for duplicates
    if (seenIds.has(job.id)) return false;
    seenIds.add(job.id);

    // Check if location is in Canada
    return validLocations.some((city) => job.location.includes(city));
  });

  return {
    lastChecked: data.lastChecked,
    internships: filteredInternships,
  };
}

// Format dates for display
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format dates for comparison
function parseDate(dateString) {
  return new Date(dateString);
}

// Check if a job is new (less than 24 hours since first seen)
function isNewJob(job) {
  const firstSeen = new Date(job.firstSeen);
  return firstSeen > newInternshipCutoff;
}

// Load internship data
async function loadInternshipData() {
  try {
    const response = await fetch("/canada_internships_data.json");
    if (!response.ok) {
      throw new Error("Failed to load internship data");
    }
    const data = await response.json();
    return cleanInternshipData(data); // Clean the data before returning
  } catch (error) {
    console.error("Error loading internship data:", error);
    // Fall back to demo data if fetch fails
    return {
      lastChecked: new Date().toISOString(),
      internships: [
        {
          id: "example-company-software-developer-toronto",
          company: "Example Company",
          role: "Software Developer Intern",
          location: "Toronto, ON",
          application: {
            text: "Apply",
            url: "https://example.com/careers",
          },
          datePosted: "Feb 20, 2025",
          firstSeen: new Date().toISOString(),
        },
        {
          id: "tech-corp-data-science-vancouver",
          company: "Tech Corp",
          role: "Data Science Intern",
          location: "Vancouver, BC",
          application: {
            text: "Apply",
            url: "https://techcorp.com/careers",
          },
          datePosted: "Feb 10, 2025",
          firstSeen: "2025-02-10T12:00:00Z",
        },
        {
          id: "startup-inc-frontend-montreal",
          company: "Startup Inc",
          role: "Frontend Developer Intern",
          location: "Montreal, QC",
          application: {
            text: "Apply",
            url: "https://startup.com/jobs",
          },
          datePosted: "Feb 15, 2025",
          firstSeen: "2025-02-15T12:00:00Z",
        },
      ],
    };
  }
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  const currentPageNum = document.getElementById("current-page-num");
  const showingStart = document.getElementById("showing-start");
  const showingEnd = document.getElementById("showing-end");
  const totalItems = document.getElementById("total-items");

  // Update buttons
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;

  // Update page numbers
  currentPageNum.textContent = currentPage;

  // Update showing info
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, filteredData.length);
  showingStart.textContent = filteredData.length === 0 ? 0 : start;
  showingEnd.textContent = end;
  totalItems.textContent = filteredData.length;
}

// Populate the table with internship data
function renderTable() {
  const tableBody = document.getElementById("internships-body");
  tableBody.innerHTML = "";

  if (filteredData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No internships found matching your criteria</td></tr>';
    updatePagination();
    return;
  }

  // Calculate pagination
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((job) => {
    const row = document.createElement("tr");

    // Company column
    const companyCell = document.createElement("td");
    companyCell.textContent = job.company;
    companyCell.title = job.company;
    if (isNewJob(job)) {
      const newBadge = document.createElement("span");
      newBadge.textContent = "NEW";
      newBadge.className = "new-badge";
      companyCell.appendChild(newBadge);
    }
    row.appendChild(companyCell);

    // Role column
    const roleCell = document.createElement("td");
    roleCell.textContent = job.role;
    roleCell.title = job.role;
    row.appendChild(roleCell);

    // Location column
    const locationCell = document.createElement("td");
    locationCell.textContent = job.location;
    locationCell.title = job.location;
    row.appendChild(locationCell);

    // Date Posted column
    const datePostedCell = document.createElement("td");
    datePostedCell.textContent = job.datePosted;
    datePostedCell.title = job.datePosted;
    row.appendChild(datePostedCell);

    // First Seen column
    const firstSeenCell = document.createElement("td");
    firstSeenCell.textContent = formatDate(job.firstSeen);
    firstSeenCell.title = formatDate(job.firstSeen);
    row.appendChild(firstSeenCell);

    // Apply column
    const applyCell = document.createElement("td");
    if (job.application && job.application.url) {
      const applyLink = document.createElement("a");
      applyLink.href = job.application.url;
      applyLink.textContent = job.application.text;
      applyLink.className = "application-link";
      applyLink.target = "_blank";
      applyCell.appendChild(applyLink);
    } else {
      applyCell.textContent = job.application?.text || "See Posting";
    }
    row.appendChild(applyCell);

    tableBody.appendChild(row);
  });

  updatePagination();
}

// Initialize the location filter
function initializeLocationFilter(data) {
  const locationFilter = document.getElementById("location-filter");
  const locations = new Set();

  data.forEach((job) => {
    // Extract the city from the location field
    const locationParts = job.location.split(",");
    if (locationParts.length > 0) {
      locations.add(locationParts[0].trim());
    }
  });

  // Sort locations alphabetically
  const sortedLocations = Array.from(locations).sort();

  // Clear existing options (except "All Locations")
  while (locationFilter.options.length > 1) {
    locationFilter.remove(1);
  }

  // Add location options
  sortedLocations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

// Update stats display
function updateStats() {
  document.getElementById("total-count").textContent = internshipsData.length;

  const newCount = internshipsData.filter((job) => isNewJob(job)).length;
  document.getElementById("new-count").textContent = newCount;

  // Count city frequencies
  const cityCounts = {};
  internshipsData.forEach((job) => {
    const locationParts = job.location.split(",");
    if (locationParts.length > 0) {
      const city = locationParts[0].trim();
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  });

  // Find most popular city
  let topCity = null;
  let topCount = 0;

  Object.entries(cityCounts).forEach(([city, count]) => {
    if (count > topCount) {
      topCity = city;
      topCount = count;
    }
  });

  document.getElementById("top-city").textContent = topCity || "-";
}

// Filter data based on search input and location filter
function filterData() {
  const searchTerm = document.getElementById("search-input").value.toLowerCase();
  const locationFilter = document.getElementById("location-filter").value;

  filteredData = internshipsData.filter((job) => {
    // Search term filter
    const matchesSearch = job.company.toLowerCase().includes(searchTerm) || job.role.toLowerCase().includes(searchTerm) || job.location.toLowerCase().includes(searchTerm);

    // Location filter
    const matchesLocation = locationFilter === "all" || job.location.startsWith(locationFilter);

    return matchesSearch && matchesLocation;
  });

  sortData(currentSort.column, currentSort.direction);
  renderTable();
}

// Sort data by column
function sortData(column, direction) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  filteredData.sort((a, b) => {
    let valueA, valueB;

    // Get and convert values based on column type
    if (column === "datePosted" || column === "firstSeen") {
      valueA = column === "datePosted" ? a.datePosted : parseDate(a.firstSeen);
      valueB = column === "datePosted" ? b.datePosted : parseDate(b.firstSeen);
    } else {
      valueA = a[column].toLowerCase();
      valueB = b[column].toLowerCase();
    }

    // Compare values
    if (valueA < valueB) return -1 * directionMultiplier;
    if (valueA > valueB) return 1 * directionMultiplier;
    return 0;
  });

  // Update sorting UI
  const tableHeaders = document.querySelectorAll("th");
  tableHeaders.forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === column) {
      th.classList.add(direction === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });

  currentSort = { column, direction };
}

// Initialize the application
async function initializeApp() {
  const data = await loadInternshipData();

  internshipsData = data.internships || [];
  filteredData = [...internshipsData];
  currentPage = 1;

  // Update the last updated message
  if (data.lastChecked) {
    const lastCheckedDate = new Date(data.lastChecked);
    document.getElementById("last-updated-time").textContent = lastCheckedDate.toLocaleString();
    document.getElementById("update-message").textContent = `Latest data from ${lastCheckedDate.toLocaleDateString()}`;
  }

  // Initialize controls
  initializeLocationFilter(internshipsData);
  updateStats();

  // Default sort - newest first
  sortData("firstSeen", "desc");
  renderTable();

  // Set up event listeners
  document.getElementById("search-input").addEventListener("input", () => {
    currentPage = 1;
    filterData();
  });

  document.getElementById("location-filter").addEventListener("change", () => {
    currentPage = 1;
    filterData();
  });

  document.getElementById("refresh-btn").addEventListener("click", function () {
    currentPage = 1;
    initializeApp();
  });

  // Set up sorting
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", function () {
      const column = this.dataset.sort;
      const direction = column === currentSort.column && currentSort.direction === "asc" ? "desc" : "asc";
      currentPage = 1;
      sortData(column, direction);
      renderTable();
    });
  });

  // Set up pagination
  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
}

// Start the app
document.addEventListener("DOMContentLoaded", initializeApp);

document.addEventListener("DOMContentLoaded", initializeApp);
