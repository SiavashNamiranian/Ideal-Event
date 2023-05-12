const searchBtn = document.getElementById("search-btn");
const eventsList = document.getElementById("events-list");
const eventDetails = document.getElementById("event-details");

const apiKeyWeather = "d76d660f257500185c8632c23508ba25";
const apiKeyTicketmaster = "BIjcHtV4tsaMzOb5wVMzgE5AHZWwS5hl";

searchBtn.addEventListener("click", () => {
  const location = document.getElementById("location").value;

  // Clear previous search results
  eventsList.innerHTML = "";
  eventDetails.innerHTML = "";

  if (location) {
    fetchEvents(location);
  }
});

function fetchEvents(location) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${location}&apikey=${apiKeyTicketmaster}`;

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
  console.log("Event Coords:", eventCoords);
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
 
  console.log(weather);
  const weatherInfo = document.createElement("div");
  weatherInfo.classList.add("weather-info");

  const reportDate = document.createElement("p");
  reportDate.textContent = 'Most relevant date: ' + (new Date(weather.dt_txt).toLocaleDateString()) +" weather";
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

  eventDetails.appendChild(weatherInfo);
}
