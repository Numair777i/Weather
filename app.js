const apiKey = "4c157f34b0041826b5342b3a93a2f38c";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const forecastUrl =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric&";
const searchBox = document.querySelector(".search input");
const bgAnimation = document.getElementById("bg-animation");

// maps OWM condition to boxicon class
function getIcon(condition) {
  switch (condition) {
    case "Clear":
      return "bx bx-sun";
    case "Clouds":
      return "bx bx-cloud";
    case "Rain":
      return "bx bx-cloud-rain";
    case "Drizzle":
      return "bx bx-cloud-drizzle";
    case "Thunderstorm":
      return "bx bx-cloud-lightning";
    case "Snow":
      return "bx bx-snow";
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
      return "bx bx-water";
    default:
      return "bx bx-cloud";
  }
}

async function checkweather(cityQuery) {
  const res = await fetch(apiUrl + cityQuery + `&appid=${apiKey}`);
  const data = await res.json();
  console.log(data);

  document.querySelector(".city").innerHTML = data.name;
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
  document.querySelector(".condition").innerHTML = data.weather[0].main;

  setBackground(data.weather[0].main);
  fetchForecast(cityQuery);
}

async function fetchForecast(cityQuery) {
  const res = await fetch(forecastUrl + cityQuery + `&appid=${apiKey}`);
  const data = await res.json();

  // OWM gives data every 3 hours, pick one reading per day (noon)
  const daily = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    if (!daily[day] && hour >= 11 && hour <= 14) {
      daily[day] = item;
    }
  });

  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  Object.entries(daily)
    .slice(0, 5)
    .forEach(([day, item]) => {
      const condition = item.weather[0].main;
      const temp = Math.round(item.main.temp);
      const icon = getIcon(condition);

      const div = document.createElement("div");
      div.classList.add("forecast-day");
      div.innerHTML = `
      <span class="day-name">${day}</span>
      <i class="${icon}"></i>
      <span class="day-temp">${temp}°c</span>
      <span class="day-condition">${condition}</span>
    `;
      forecastEl.appendChild(div);
    });
}

function setBackground(condition) {
  document.body.className = "";
  bgAnimation.innerHTML = "";

  if (condition === "Clear") {
    document.body.classList.add("clear");
    createSun();
  } else if (condition === "Clouds") {
    document.body.classList.add("clouds");
    createClouds(6);
  } else if (condition === "Rain") {
    document.body.classList.add("rain");
    createDrops(80, "raindrop");
  } else if (condition === "Drizzle") {
    document.body.classList.add("drizzle");
    createDrops(40, "drizzledrop");
  } else if (condition === "Thunderstorm") {
    document.body.classList.add("thunderstorm");
    createDrops(80, "raindrop");
    createLightning();
  } else if (condition === "Snow") {
    document.body.classList.add("snow");
    createSnow(60);
  } else if (["Mist", "Fog", "Haze", "Smoke"].includes(condition)) {
    document.body.classList.add("mist");
    createMist();
  }
}

function createSun() {
  const sun = document.createElement("div");
  sun.classList.add("sun");
  bgAnimation.appendChild(sun);
}

function createClouds(count) {
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement("div");
    cloud.classList.add("cloud");
    cloud.style.top = Math.random() * 60 + "vh";
    cloud.style.animationDuration = Math.random() * 20 + 15 + "s";
    cloud.style.animationDelay = Math.random() * 10 + "s";
    cloud.style.opacity = Math.random() * 0.5 + 0.3;
    bgAnimation.appendChild(cloud);
  }
}

function createDrops(count, type) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.classList.add("particle", type);
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = Math.random() * 0.5 + 0.5 + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    bgAnimation.appendChild(drop);
  }
}

function createSnow(count) {
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.classList.add("particle", "snowflake");
    flake.style.left = Math.random() * 100 + "vw";
    flake.style.animationDuration = Math.random() * 3 + 3 + "s";
    flake.style.animationDelay = Math.random() * 5 + "s";
    flake.style.width = flake.style.height = Math.random() * 6 + 4 + "px";
    bgAnimation.appendChild(flake);
  }
}

function createLightning() {
  for (let i = 0; i < 3; i++) {
    const bolt = document.createElement("div");
    bolt.classList.add("lightning");
    bolt.style.left = Math.random() * 100 + "vw";
    bolt.style.top = "0";
    bolt.style.height = Math.random() * 200 + 100 + "px";
    bolt.style.animationDuration = Math.random() * 4 + 3 + "s";
    bolt.style.animationDelay = Math.random() * 3 + "s";
    bgAnimation.appendChild(bolt);
  }
}

function createMist() {
  for (let i = 0; i < 5; i++) {
    const layer = document.createElement("div");
    layer.classList.add("mistlayer");
    layer.style.top = i * 20 + "vh";
    layer.style.animationDuration = Math.random() * 10 + 10 + "s";
    layer.style.animationDelay = Math.random() * 5 + "s";
    bgAnimation.appendChild(layer);
  }
}

window.addEventListener("load", () => {
  checkweather("q=Delhi");
});

let debounceTimer;
searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const cleanCity = searchBox.value.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanCity) {
      checkweather(`q=${cleanCity}`);
    }
  }, 600);
});
