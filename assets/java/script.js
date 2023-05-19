const searchBtn = document.getElementById("search-btn");
const eventsList = document.getElementById("events-list");
const eventDetails = document.getElementById("event-details");

const apiKeyWeather = "d76d660f257500185c8632c23508ba25";
const apiKeyTicketmaster = "BIjcHtV4tsaMzOb5wVMzgE5AHZWwS5hl";
const errorModal = document.getElementById('error-modal');
const errorModalClose = document.getElementById('error-modal-close');
const errorMessage = document.getElementById("error-message");

// Get dropdown button
const dropdownButton = document.getElementById('dropdown-button');

// Get dropdown
const dropdown = document.getElementById('dropdown');

// Get dropdown content
const searchHistoryDiv = document.getElementById('search-history');

// Search history array
let searchHistory = [];

// Toggle dropdown
dropdownButton.addEventListener('click', function(event) {
  event.stopPropagation();
  dropdown.classList.toggle('is-active');

  // Call the displaySearchHistory function only when dropdown is active
  if(dropdown.classList.contains('is-active')) {
    displaySearchHistory();
    searchHistoryDiv.style.display = "block"; // or "flex"
  } else {
    searchHistoryDiv.style.display = "none";
  }
});


// Close dropdown when clicked outside
window.addEventListener('click', function(event) {
  if (!dropdown.contains(event.target)) {
    dropdown.classList.remove('is-active');
  }
});

// Search function
async function search(query) {
  // Your existing search code goes here

  // Add search query to history
  searchHistory.unshift(query);

  // Limit history to 5 items
  if (searchHistory.length > 5) {
    searchHistory.pop();
  }

  // Clear search history dropdown
  searchHistoryDiv.innerHTML = '';

  // Update search history dropdown
  for (const item of searchHistory) {
    const element = document.createElement('a');
    element.textContent = item;
    element.className = "dropdown-item";
    searchHistoryDiv.appendChild(element);
  }
}


searchBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const location = document.getElementById("location").value;
  const eventName = document.getElementById("eventName").value;

  // Clear previous search results
  eventsList.innerHTML = "";
  eventDetails.innerHTML = "";

  if (!location && !eventName) {
    errorMessage.textContent = "Please enter a location or event name";
    errorModal.style.display = "block";  // Display the error modal
  } else {
    errorMessage.textContent = "";
    errorModal.style.display = "none";  // Hide the error modal if it's displayed

    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    searchHistory.unshift({ location, eventName });  // Add new search to the start
  
    // Limit history to 5 items
    if (searchHistory.length > 5) {
      searchHistory.pop();
    }
  
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

  fetchEvents(location, eventName);
  event.preventDefault();
  }
});
errorModalClose.addEventListener('click', () => {
  errorModal.style.display = "none";
});
// When the user clicks anywhere outside of the modal, close it
window.addEventListener('click', (event) => {
  if (event.target == errorModal) {
    errorModal.style.display = "none";
  }
});

function displaySearchHistory() {
  let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

  const searchHistoryElement = document.getElementById('search-history');
  searchHistoryElement.innerHTML = '';

  // Get the first 5 items, which are the most recent searches
  let recentSearches = searchHistory.slice(0, 5);

  recentSearches.forEach(search => {
    const searchElement = document.createElement('p');
    searchElement.textContent = `Location: ${search.location}, Event Name: ${search.eventName}`;

    // Add a CSS class to the search element
    searchElement.classList.add('search-history-item');

    searchElement.addEventListener('click', () => {
      // Clear previous search results
      eventsList.innerHTML = "";
      eventDetails.innerHTML = "";
      fetchEvents(search.location, search.eventName);
    });

    searchHistoryElement.appendChild(searchElement);
  });
}


function fetchEvents(location, eventName) {
  let url = 'https://app.ticketmaster.com/discovery/v2/events.json?apikey=' + apiKeyTicketmaster;

  if (location) {
    url += '&city=' + location;
  }

  if (eventName) {
    url += '&keyword=' + eventName;
  }

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayEvents(data._embedded.events);
    })
    .catch((error) => console.error("Error fetching events:", error));
}



function displayEvents(events) {
  // Filter only upcoming events and limit to a maximum of 30 events
  events = events
    .filter((event) => new Date(event.dates.start.localDate) >= new Date())
    .slice(0, 30);
console.log(new Date());

  // Sort events in ascending order by date and time
  events.sort((a, b) => {
    const aDateTime = new Date(a.dates.start.localDate + "T" + (a.dates.start.localTime || "00:00:00"));
    const bDateTime = new Date(b.dates.start.localDate + "T" + (b.dates.start.localTime || "00:00:00"));
    return aDateTime - bDateTime;
  });

  events.forEach((event) => {
    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");

    const eventInfo = document.createElement("div");
    eventInfo.classList.add("event-info");

    const eventName = document.createElement("span");
    eventName.classList.add("event-name");
    eventName.textContent = event.name;
    eventInfo.appendChild(eventName);

    const eventDate = document.createElement("span");
    eventDate.classList.add("event-date");
    eventDate.textContent = new Date(event.dates.start.localDate).toLocaleDateString();
    eventInfo.appendChild(eventDate);

    const eventLocation = document.createElement("span");
    eventLocation.classList.add("event-location");

    const eventVenue = event._embedded.venues[0];
    if (eventVenue) {
      const locationParts = [
        eventVenue.city.name,
        eventVenue.state ? eventVenue.state.stateCode : '', // Use stateCode for abbreviated state name
        eventVenue.country.countryCode // Use countryCode for abbreviated country name
      ];
      
      // Filters out any empty parts and joins the rest with commas
      eventLocation.textContent = locationParts.filter(Boolean).join(', ');
    } else {
      eventLocation.textContent = 'Location not available';
    }

    eventInfo.appendChild(eventLocation);

    // Combine the localDate and localTime into a single string and create a Date object
    const eventDateTime = new Date(event.dates.start.localDate + "T" + (event.dates.start.localTime || "00:00:00"));

    // Display the start time
    if (event.dates.start.localTime) {
      const eventTime = document.createElement("span");
      eventTime.classList.add("event-time");
      eventTime.textContent = eventDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      eventInfo.appendChild(eventTime);
    }

    eventItem.appendChild(eventInfo);
    eventsList.appendChild(eventItem);

    // Add click event listener to the event item
    eventItem.addEventListener("click", () => {
      eventDetails.innerHTML = ""; // Clear previous event details
      displayEventDetails(event);
    });
  });
}

function displayEventDetails(event) {
  const eventDate = event.dates.start.localDate;
  const eventCoords = event._embedded.venues[0].location;

  // Fetch and display weather for the event
  fetchWeather(eventCoords.latitude, eventCoords.longitude, eventDate);

  const eventTitle = document.createElement("h2");
  eventTitle.textContent = event.name;
  eventDetails.appendChild(eventTitle);

  const saleDate = document.createElement("p");
  saleDate.classList.add("adition-info");
  saleDate.textContent = 'Available for purchase: '+ (new Date(event.sales.public.startDateTime).toLocaleDateString())+' to '+(new Date(event.sales.public.endDateTime).toLocaleDateString());
  eventDetails.appendChild(saleDate);

  const limit = document.createElement("p");
  limit.classList.add("adition-info");
  limit.textContent = event.ticketLimit.info;
  eventDetails.appendChild(limit);

  const notes = document.createElement("p");
  notes.classList.add("adition-info");
  notes.textContent = event.pleaseNote;
  eventDetails.appendChild(notes);
  // Add more event details as needed
}

function fetchWeather(lat, lon, date) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKeyWeather}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Find the forecast closest to the event date
      const closestForecast = data.list.reduce((prev, curr) => {
        const prevTimeDiff = Math.abs(new Date(prev.dt_txt) - new Date(date));
        const currTimeDiff = Math.abs(new Date(curr.dt_txt) - new Date(date));
        return currTimeDiff < prevTimeDiff ? curr : prev;
      });
      
      displayWeather(closestForecast);
    })
    .catch((error) => console.error("Error fetching weather:", error));
}

function displayWeather(weather) {

  const weatherHeader = document.createElement("h2");
  weatherHeader.textContent = "Predicted Weather";
  eventDetails.appendChild(weatherHeader);

  const weatherInfo = document.createElement("div");
  weatherInfo.classList.add("weather-info");

  const reportDate = document.createElement("p");
  reportDate.textContent = 'Most relevant forecast available: ' + (new Date(weather.dt_txt).toLocaleDateString());
  weatherInfo.appendChild(reportDate);

  const temperature = document.createElement("p");
  temperature.textContent = `Temperature: ${weather.main.temp} °F`;
  weatherInfo.appendChild(temperature);

  const humidity = document.createElement("p");
  humidity.textContent = `Humidity: ${weather.main.humidity}%`;
  weatherInfo.appendChild(humidity);

  const windSpeed = document.createElement("p");
  windSpeed.textContent = `Wind Speed: ${weather.wind.speed} mph`;
  weatherInfo.appendChild(windSpeed);

  const weatherIcon = document.createElement("img");
  const iconId = weather.weather[0].icon;

  // Set the src of the img element to the URL of the icon
  weatherIcon.src = `http://openweathermap.org/img/w/${iconId}.png`;
  weatherIcon.alt = "Weather Icon";

  // Append the weatherIcon to the weatherInfo
  weatherInfo.appendChild(weatherIcon);

  

  eventDetails.appendChild(weatherInfo);
}