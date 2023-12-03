// Global variable to store the current data mode
let dataMode = "absolute"; // Default mod
let populationData = {};

function toggleDataMode() {
  dataMode = dataMode === "absolute" ? "per capita" : "absolute";
  main(); // Re-run the main function to reprocess and redraw the chart
}

async function fetchMovieData() {
  const endpoint = "http://MSI:7200/repositories/proj";
  const query =
    encodeURIComponent(`PREFIX iut: <http://cours.iut-orsay.fr/npbd/projet/maury/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT ?nomFilm ?dateSortieFilm ?boxoffice ?countryName
    WHERE {
        # Requête sur votre base de données locale
        ?localFilm a iut:Movie;
                   iut:movieName ?nomFilm;
                   iut:boxOffice ?boxoffice;
                   iut:hasCountry ?country.
        
        ?country a iut:Country;
                 iut:CountryName ?countryName.
        
        # Requête fédérée sur Wikidata
        SERVICE <https://query.wikidata.org/sparql> {
            ?wdFilm wdt:P31 wd:Q11424;
                    rdfs:label ?nomFilm;
                    wdt:P577 ?dateSortieFilm.
            FILTER (LANG(?nomFilm) = "en")
            FILTER (xsd:dateTime(?dateSortieFilm) >= "1999-01-01T00:00:00Z"^^xsd:dateTime && xsd:dateTime(?dateSortieFilm) <= "2019-12-31T23:59:59Z"^^xsd:dateTime)
        }
    }
    `);

  try {
    const response = await fetch(`${endpoint}?query=${query}`, {
      headers: {
        Accept: "application/sparql-results+json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetching SPARQL data failed:", error);
  }
}

async function fetchAllPopulationData(startYear, endYear) {
    const endpoint = "https://query.wikidata.org/sparql";
    let populationData = {};

    let query = `
        SELECT ?countryLabel ?year (SUM(?population) as ?totalPopulation) WHERE {
            ?country wdt:P31 wd:Q6256; # Country
            rdfs:label ?countryLabel; # Country label
            p:P1082 ?populationStatement. # Population statement
            ?populationStatement ps:P1082 ?population; # Population
            pq:P585 ?date. # Point in time
            FILTER(LANG(?countryLabel) = "en") # Ensure labels are in English
            BIND(YEAR(?date) AS ?year)
            FILTER (?year >= ${startYear} && ?year <= ${endYear})
        }
        GROUP BY ?countryLabel ?year
        ORDER BY ?countryLabel ?year
    `;

    try {
        const response = await fetch(endpoint + "?query=" + encodeURIComponent(query) + "&format=json");
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();

        if (!json.results || !json.results.bindings) {
            throw new Error('Invalid or empty data returned from the API');
        }

        json.results.bindings.forEach(item => {
            if (item.countryLabel && item.year && item.totalPopulation) {
                const country = item.countryLabel.value;
                const year = parseInt(item.year.value);
                const population = parseInt(item.totalPopulation.value);

                if (!populationData[country]) {
                    populationData[country] = {};
                }

                populationData[country][year] = population;
            } else {
                console.error('Missing data in one of the items:', item);
            }
        });
    } catch (error) {
        console.error("Error fetching population data:", error);
        return {}; // Return an empty object in case of error
    }

    return populationData;
}



async function fetchPopulationData(year, countryName, populationData) {
  // Check if country data exists
  if (populationData[countryName]) {
    const population = populationData[countryName][year];
    if (population) {
      return population;
    } else {
      console.error(`No population data found for ${countryName} in ${year}`);
    }
  } else {
    console.error(`No population data found for country: ${countryName}`);
  }
  return null;
}

async function processData(rawData, populationData) {
  console.log("Raw Data:", rawData);

  if (!rawData || !rawData.results || !rawData.results.bindings) {
    console.error("Invalid or empty data:", rawData);
    return {};
  }

  let processedData = {};
  for (const item of rawData.results.bindings) {
    const year = new Date(item.dateSortieFilm.value).getFullYear();
    const country = item.countryName.value;
    const boxOffice = parseFloat(item.boxoffice.value);

    if (country === "Domestic" || isNaN(boxOffice)) {
      continue;
    }

    if (!processedData[country]) {
      processedData[country] = {};
    }

    const population = await fetchPopulationData(year, country, populationData);
    if (population || dataMode === "absolute") {
      // Calculate data based on the selected mode
      let dataValue;
      if (dataMode === "per capita" && population) {
        dataValue = boxOffice / population;
      } else {
        dataValue = boxOffice;
      }
      processedData[country][year] = (processedData[country][year] || 0) + dataValue;
    }
  }

  console.log("Processed Data:", processedData);
  return processedData;
}


function createTotalData(startYear, endYear, processedData) {
  let labels = [];
  let data = [];

  for (let year = startYear; year <= endYear; year++) {
    let yearTotal = 0;
    for (let country in processedData) {
      if (processedData[country][year]) {
        yearTotal += processedData[country][year];
      }
    }
    labels.push(year.toString()); // Year labels for the x-axis
    data.push(yearTotal); // Total box office amounts for the y-axis
  }

  return {
    labels: labels,
    datasets: [{
      label: 'Total Box Office', // This is the label for the dataset
      data: data, // These are the data points for the y-axis
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}

async function fetchStudentsData(country) {
  const endpoint = "http://MSI:7200/repositories/proj"; 
  const query =
    encodeURIComponent(`PREFIX iut: <http://cours.iut-orsay.fr/npbd/projet/maury/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?countryName ?studentsNumber ?year
WHERE {
    ?country rdf:type iut:Country ;
             iut:CountryName ?countryName ;
             iut:hasStudents ?students .

    ?students rdf:type iut:Students ;
              iut:number ?studentsNumber ;
              iut:year ?year .

    FILTER (?year >= "1999-01-01"^^xsd:date && ?year <= "2019-12-31"^^xsd:date)
    FILTER (?countryName = "${country}")
}
`);

  try {
    const response = await fetch(`${endpoint}?query=${query}`, {
      headers: {
        Accept: "application/sparql-results+json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Process data into a format suitable for drawChart
    let processedData = {};
    data.results.bindings.forEach(item => {
      const year = item.year.value;
      const studentsNumber = parseInt(item.studentsNumber.value);

      if (!processedData[year]) {
        processedData[year] = 0;
      }

      processedData[year] += studentsNumber;
    });

    return processedData;
  } catch (error) {
    console.error("Fetching student data failed:", error);
    return {};
  }
}


function createDataFromCountry(country, startYear, endYear, processedData) {
  let labels = [];
  let data = [];

  for (let year = startYear; year <= endYear; year++) {
    labels.push(year.toString()); // Year labels for the x-axis

    // Check if data for the given year and country exists
    if (processedData[country] && processedData[country][year]) {
      data.push(processedData[country][year]); // Box office amount for the y-axis
    } else {
      data.push(0); // If no data for that year, push 0
    }
  }

  return {
    labels: labels,
    datasets: [{
      label: `Box Office in ${country} (${startYear}-${endYear})`,
      data: data,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}

function createChartDataFromStudentData(studentData, country) {
  let labels = Object.keys(studentData);
  let data = Object.values(studentData);

  return {
    labels: labels,
    datasets: [{
      label: `Number of Students from ${country}`,
      data: data,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}

async function fetchAllStudents() {
  const endpoint = "http://MSI:7200/repositories/proj";
  const query = encodeURIComponent(`
    PREFIX iut: <http://cours.iut-orsay.fr/npbd/projet/maury/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?year (SUM(?studentsNumber) as ?totalStudents)
    WHERE {
      ?country rdf:type iut:Country;
               iut:hasStudents ?students.

      ?students rdf:type iut:Students;
                iut:number ?studentsNumber;
                iut:year ?year.

      FILTER (?year >= "1999-01-01"^^xsd:date && ?year <= "2019-12-31"^^xsd:date)
    }
    GROUP BY ?year
  `);

  try {
    const response = await fetch(`${endpoint}?query=${query}`, {
      headers: {
        Accept: "application/sparql-results+json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    let processedData = {};
    data.results.bindings.forEach(item => {
      const year = item.year.value;
      const totalStudents = parseInt(item.totalStudents.value);

      processedData[year] = totalStudents;
    });

    return processedData;
  } catch (error) {
    console.error("Fetching all student data failed:", error);
    return {};
  }
}

function createChartDataFromTotalStudentsData(totalStudentData) {
  let labels = Object.keys(totalStudentData);
  let data = Object.values(totalStudentData);

  return {
    labels: labels,
    datasets: [{
      label: `Total Number of Students (1999-2019)`,
      data: data,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}


// Global chart instances
let studentsChartInstance;
let boxOfficeChartInstance;
let correlationChartInstance;

function drawChart(chartData, canvasId) {
  // Check if the canvas element exists
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas with id ${canvasId} not found`);
    return;
  }

  // Get the context of the canvas
  const ctx = canvas.getContext('2d');

  // If there's an existing chart instance for this canvas, destroy it
  if (canvasId === 'studentsChart' && studentsChartInstance) {
    studentsChartInstance.destroy();
  } else if (canvasId === 'boxOfficeChart' && boxOfficeChartInstance) {
    boxOfficeChartInstance.destroy();
  } else if (canvasId === 'correlationChartCanvas' && correlationChartInstance) {
  correlationChartInstance.destroy();
  }

  // Create the new chart on the canvas
  const newChartInstance = new Chart(ctx, {
    type: 'line', // Assuming you're drawing a line chart
    data: chartData,
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: canvasId === 'studentsChart' ? 'Student Numbers by Year' : 'Box Office Total by Year'
        }
      }
    },
  });

  // Update the global chart instance reference
  if (canvasId === 'studentsChart') {
    studentsChartInstance = newChartInstance;
  } else if (canvasId === 'boxOfficeChart') {
    boxOfficeChartInstance = newChartInstance;
  } else if (canvasId === 'correlationChartCanvas') {
  correlationChartInstance = newChartInstance;
}
}



async function populateCountrySelector(processedData) {
  const countrySelector = document.getElementById('countrySelector');
  
  // Clear existing options
  countrySelector.innerHTML = '<option value="">Global</option>';

  // Get unique list of countries
  const countries = new Set();
  Object.keys(processedData).forEach(country => {
    countries.add(country);
  });

  // Sort countries and append to the selector
  Array.from(countries).sort().forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelector.appendChild(option);
  });
}



async function updateGraphForCountry(selectedCountry) {
  // Fetch and process student data
  const studentData = await fetchStudentsData(selectedCountry);
  const chartDataStudents = createChartDataFromStudentData(studentData, selectedCountry);
  drawChart(chartDataStudents, 'studentsChart');

  // Fetch movie data
  const rawData = await fetchMovieData();

  // Process movie data for the selected country
  let processedMovieData;
  if (selectedCountry && selectedCountry !== "") {
    // Filter raw data for the selected country
    const filteredRawData = rawData.results.bindings.filter(item => item.countryName.value === selectedCountry);
    processedMovieData = await processData({ results: { bindings: filteredRawData } }, populationData);
  } else {
    // Process global data if no specific country is selected
    processedMovieData = await processData(rawData, populationData);
  }

  // Create and draw the chart data for Box Office
  const countryBoxOfficeData = createDataFromCountry(selectedCountry, 1999, 2019, processedMovieData);
  drawChart(countryBoxOfficeData, 'boxOfficeChart');

  // Fetch and process data for correlation chart
  const correlationData = processCorrelationData(studentData, processedMovieData);
  drawChart(correlationData, 'correlationChartCanvas');
}




function clearCharts() {
  // Destroy the studentsChartInstance if it exists
  if (window.studentsChartInstance) {
    window.studentsChartInstance.destroy();
    window.studentsChartInstance = null; // Reset the global variable
  }

  // Destroy the boxOfficeChartInstance if it exists
  if (window.boxOfficeChartInstance) {
    window.boxOfficeChartInstance.destroy();
    window.boxOfficeChartInstance = null; // Reset the global variable
  }

  // Destroy the correlationChartInstance if it exists
  if (window.correlationChartInstance) {
    window.correlationChartInstance.destroy();
    window.correlationChartInstance = null; // Reset the global variable
  }
}


document.getElementById('updateButton').addEventListener('click', async () => {
  const selectedCountry = document.getElementById('countrySelector').value;
  await updateGraphForCountry(selectedCountry);

});


function calculatePearsonCorrelation(x, y) {
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  const n = x.length;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += (x[i] * y[i]);
    sumX2 += (x[i] * x[i]);
    sumY2 += (y[i] * y[i]);
  }

  const numerator = sumXY - (sumX * sumY / n);
  const denominator = Math.sqrt((sumX2 - sumX * sumX / n) * (sumY2 - sumY * sumY / n));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

function processCorrelationData(studentData, boxOfficeData) {
  console.log("Processing Correlation Data");
  console.log("Student Data:", studentData);
  console.log("Box Office Data:", boxOfficeData);

  let studentValues = [];
  let boxOfficeValues = [];
  let labels = [];

  // Check if the request is global or country-specific
  const isGlobal = boxOfficeData.hasOwnProperty('datasets');
  console.log("Is Global Data:", isGlobal);

  // Iterate over the years in studentData
  for (let year in studentData) {
    const studentValue = studentData[year];
    let boxOfficeValue;

    if (isGlobal) {
      // For global data, find the index of the year in boxOfficeData.labels
      const yearIndex = boxOfficeData.labels.indexOf(year);
      boxOfficeValue = yearIndex !== -1 ? boxOfficeData.datasets[0].data[yearIndex] : undefined;
    } else {
      // For country-specific data, access the value directly from the first (and only) key in boxOfficeData
      const countryKey = Object.keys(boxOfficeData)[0];
      boxOfficeValue = boxOfficeData[countryKey][year];
    }

    if (boxOfficeValue !== undefined && studentValue !== undefined) {
      labels.push(year);
      studentValues.push(studentValue);
      boxOfficeValues.push(boxOfficeValue);
    } else {
      console.log(`Missing data for year ${year}: Student Value - ${studentValue}, Box Office Value - ${boxOfficeValue}`);
    }
  }

  if (studentValues.length === 0 || boxOfficeValues.length === 0) {
    console.error('No data available for correlation calculation');
    return null;
  }

  let correlation = calculatePearsonCorrelation(studentValues, boxOfficeValues);
  console.log("Correlation Calculated:", correlation);

  return {
    labels: labels,
    datasets: [{
      label: 'Yearly Correlation between Students and Box Office',
      data: labels.map(() => correlation), // Repeat the correlation value for each label
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}







function createChartDataFromTotalStudentsData(totalStudentData) {
  let labels = Object.keys(totalStudentData);
  let data = Object.values(totalStudentData);

  return {
    labels: labels,
    datasets: [{
      label: `Total Number of Students (1999-2019)`,
      data: data,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}

  



async function main() {
  // Fetch movie data and population data
  const rawData = await fetchMovieData();
  startYear = 1999;
  const endYear = 2019;
  const populationData = await fetchAllPopulationData(startYear, endYear);

  // Process the raw movie data with the population data
  const processedMovieData = await processData(rawData, populationData);
  
  // Fetch and process total students data
  const totalStudentData = await fetchAllStudents();

  // If data is available, draw the initial charts
  if (Object.keys(totalStudentData).length > 0 && Object.keys(processedMovieData).length > 0) {
    const chartDataStudents = createChartDataFromTotalStudentsData(totalStudentData);
    drawChart(chartDataStudents, 'studentsChart');

    const totalBoxOfficeData = createTotalData(startYear, endYear, processedMovieData);
    drawChart(totalBoxOfficeData, 'boxOfficeChart');

    // Draw correlation chart
  const correlationData = processCorrelationData(totalStudentData, totalBoxOfficeData);
  drawChart(correlationData, 'correlationChartCanvas');
  } else {
    console.error("No data available to draw charts");
  }

  // Populate country selector
  populateCountrySelector(processedMovieData);
}




main();
