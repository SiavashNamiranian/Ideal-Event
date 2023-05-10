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
  events.forEach((event) => {
    const eventItem = document.createElement("div");
    eventItem.classList.add("event-item");
    eventItem.textContent = event.name;

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

  // Add more event details as needed
}

function fetchWeather(lat, lon, date) {
  const url = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${Math.floor(new Date(date).getTime() / 1000)}&units=imperial&appid=${apiKeyWeather}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayWeather(data.current);
    })
    .catch((error) => console.error("Error fetching weather:", error));
}

function displayWeather(weather) {
  const weatherInfo = document.createElement("div");
  weatherInfo.classList.add("weather-info");

  const temperature = document.createElement("p");
  temperature.textContent = `Temperature: ${weather.temp} °F`;
  weatherInfo.appendChild(temperature);

  const humidity = document.createElement("p");
  humidity.textContent = `Humidity: ${weather.humidity}%`;
  weatherInfo.appendChild(humidity);

  // Add more weather details as needed

  eventDetails.appendChild(weatherInfo);
}
