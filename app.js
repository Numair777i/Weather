const apiUrl = "/api/weather?";
const forecastUrl = "/api/forecast?";
const searchBox = document.querySelector(".search input");
const bgAnimation = document.getElementById("bg-animation");
const tempEl = document.querySelector(".temp");

let currentTempC = 0;
let lastWeatherData = null;
let isCelsius = true;

tempEl.onclick = toggleTemp;

function getIcon(condition) {
  const icons = {
    Clear: "bx bx-sun",
    Clouds: "bx bx-cloud",
    Rain: "bx bx-cloud-rain",
    Drizzle: "bx bx-cloud-drizzle",
    Thunderstorm: "bx bx-cloud-lightning",
    Snow: "bx bx-snow",
    Mist: "bx bx-water",
    Fog: "bx bx-water",
    Haze: "bx bx-water",
    Smoke: "bx bx-water",
  };
  return icons[condition] || "bx bx-cloud";
}

function getTip(condition, temp, humidity, wind) {
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition))
    return "🌂 Carry an umbrella today";
  if (condition === "Snow") return "🧤 Bundle up, it's snowing";
  if (temp >= 40) return "🥵 Scorching heat, stay hydrated";
  if (temp >= 30) return "☀️ Hot outside, wear a hat and sunscreen";
  if (temp <= 5) return "🧥 Freezing cold, wear a heavy jacket";
  if (temp <= 15) return "🧣 Chilly outside, carry a jacket";
  if (humidity >= 80) return "💧 Very humid, feels hotter than it looks";
  if (wind >= 20) return "💨 Strong winds, hold onto your hat";
  return "😊 Pleasant weather, enjoy your day";
}

async function checkweather(cityQuery) {
  try {
    const res = await fetch(apiUrl + cityQuery);
    const data = await res.json();

    if (data.cod === "404" || data.cod === "400") {
      showError("City not found. Try again.");
      return;
    }

    clearError();
    lastWeatherData = data;

    searchBox.classList.add("success");
    setTimeout(() => searchBox.classList.remove("success"), 600);

    currentTempC = Math.round(data.main.temp);
    isCelsius = true;

    const condition = data.weather[0].main;
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const feelsLike = Math.round(data.main.feels_like);
    const tip = getTip(condition, temp, humidity, wind);

    document.querySelector(".city").innerHTML = data.name;
    tempEl.innerHTML = currentTempC + `<span class="unit">°c</span>`;
    document.querySelector(".feels").innerHTML =
      "Feels like " + feelsLike + "°c";
    document.querySelector(".condition").innerHTML = condition;
    document.querySelector(".humidity").innerHTML = humidity + "%";
    document.querySelector(".wind").innerHTML = wind + " km/h";
    document.querySelector(".tip").innerHTML = tip;

    if (window.innerWidth <= 480) {
      const mobileToday = document.querySelector(".mobile-today");
      mobileToday.style.display = "flex";
      const mTemp = document.querySelector(".m-temp");
      mTemp.innerHTML = currentTempC + `<span class="unit">°c</span>`;
      mTemp.onclick = toggleTemp;
      document.querySelector(".m-city").innerHTML = data.name;
      document.querySelector(".m-feels").innerHTML =
        "Feels like " + feelsLike + "°c";
      document.querySelector(".m-condition").innerHTML = condition;
      document.querySelector(".m-humidity").innerHTML =
        `<i class="bx bx-air"></i> ${humidity}% Humidity`;
      document.querySelector(".m-wind").innerHTML =
        `<i class="bx bx-wind"></i> ${wind} km/h Wind`;
      document.querySelector(".m-tip").innerHTML = tip;
    }

    setBackground(condition);
    fetchForecast(cityQuery);
  } catch (err) {
    showError("Something went wrong. Try again.");
  }
}

function toggleTemp() {
  isCelsius = !isCelsius;
  const display = (c) =>
    isCelsius
      ? c + `<span class="unit">°c</span>`
      : Math.round((c * 9) / 5 + 32) + `<span class="unit">°f</span>`;

  tempEl.innerHTML = display(currentTempC);
  const mTemp = document.querySelector(".m-temp");
  if (mTemp) mTemp.innerHTML = display(currentTempC);

  document.querySelectorAll(".day-temp").forEach((el) => {
    const c = parseInt(el.dataset.tempc);
    el.innerHTML = isCelsius ? c + "°c" : Math.round((c * 9) / 5 + 32) + "°f";
  });

  // also update hourly strip temps
  document.querySelectorAll(".hour-temp").forEach((el) => {
    const c = parseInt(el.dataset.tempc);
    el.innerHTML = isCelsius ? c + "°c" : Math.round((c * 9) / 5 + 32) + "°f";
  });
}

function showError(msg) {
  const el = document.querySelector(".error");
  el.innerHTML = msg;
  el.style.display = "block";
}
function clearError() {
  const el = document.querySelector(".error");
  el.innerHTML = "";
  el.style.display = "none";
}

async function fetchForecast(cityQuery) {
  const res = await fetch(forecastUrl + cityQuery);
  const data = await res.json();

  // 5-day forecast — pick noon reading per day
  const daily = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    if (!daily[day] && hour >= 11 && hour <= 14) daily[day] = item;
  });

  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  Object.entries(daily)
    .slice(0, 5)
    .forEach(([day, item]) => {
      const condition = item.weather[0].main;
      const temp = Math.round(item.main.temp);
      const div = document.createElement("div");
      div.classList.add("forecast-day");
      div.innerHTML = `
        <span class="day-name">${day}</span>
        <i class="${getIcon(condition)}"></i>
        <span class="day-temp" data-tempc="${temp}">${temp}°c</span>
        <span class="day-condition">${condition}</span>
      `;
      forecastEl.appendChild(div);
    });

  // hourly strip — next 24 hours (8 slots × 3hr)
  renderHourly(data.list.slice(0, 8));
}

function renderHourly(slots) {
  // only show on non-mobile
  if (window.innerWidth <= 480) return;

  const panel = document.getElementById("hourly-panel");
  const strip = document.getElementById("hourly-strip");
  strip.innerHTML = "";

  const now = new Date();

  slots.forEach((item, i) => {
    const date = new Date(item.dt * 1000);
    const condition = item.weather[0].main;
    const temp = Math.round(item.main.temp);

    // label: "Now" for first slot, otherwise time like "3 PM"
    let label;
    if (i === 0) {
      label = "Now";
    } else {
      label = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    }

    const col = document.createElement("div");
    col.classList.add("hour-col");
    col.innerHTML = `
      <span class="hour-label">${label}</span>
      <i class="${getIcon(condition)}"></i>
      <span class="hour-temp" data-tempc="${temp}">${isCelsius ? temp + "°c" : Math.round((temp * 9) / 5 + 32) + "°f"}</span>
    `;
    strip.appendChild(col);
  });

  // slide it open
  panel.classList.add("open");
}

function setBackground(condition) {
  document.body.className = "";
  bgAnimation.innerHTML = "";

  if (condition === "Clear") {
    document.body.classList.add("clear");
    createSun();
  } else if (condition === "Clouds") {
    document.body.classList.add("clouds");
    createClouds(9);
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
    cloud.style.top = Math.random() * 100 + "vh";
    cloud.style.animationDuration = Math.random() * 15 + 10 + "s";
    cloud.style.animationDelay = "-" + Math.random() * 15 + "s";
    cloud.style.opacity = Math.random() * 0.4 + 0.4;
    cloud.style.transform = `scale(${Math.random() * 0.8 + 0.6})`;

    [
      { width: "80px", height: "80px", top: "-40px", left: "20px" },
      { width: "100px", height: "100px", top: "-55px", left: "60px" },
      { width: "70px", height: "70px", top: "-35px", left: "130px" },
    ].forEach((b) => {
      const bump = document.createElement("div");
      bump.style.cssText = `position:absolute;background:rgba(255,255,255,0.18);border-radius:50%;width:${b.width};height:${b.height};top:${b.top};left:${b.left};`;
      cloud.appendChild(bump);
    });

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
  for (let i = 0; i < 4; i++) {
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(100, 150, 255, 0.08);
      animation: flash ${Math.random() * 4 + 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
      pointer-events: none;
      z-index: 0;
    `;
    bgAnimation.appendChild(flash);
  }
}

function createMist() {
  for (let i = 0; i < 8; i++) {
    const layer = document.createElement("div");
    layer.classList.add("mistlayer");
    layer.style.top = i * 12 + "vh";
    layer.style.animationDuration = Math.random() * 15 + 10 + "s";
    layer.style.animationDelay = "-" + Math.random() * 10 + "s";
    layer.style.opacity = Math.random() * 0.3 + 0.15;
    bgAnimation.appendChild(layer);
  }
}

window.addEventListener("load", () => {
  searchBox.value = "";
  checkweather("city=Delhi");
  if (window.innerWidth > 768) {
    searchBox.focus();
  }
});

let debounceTimer;
searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  searchBox.classList.remove("loading");
  debounceTimer = setTimeout(() => {
    const cleanCity = searchBox.value.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanCity) {
      searchBox.classList.add("loading");
      checkweather(`city=${cleanCity}`).finally(() => {
        searchBox.classList.remove("loading");
      });
    }
  }, 400);
});

function syncMobileView() {
  if (!lastWeatherData) return;

  const mobileToday = document.querySelector(".mobile-today");
  const isMobile = window.innerWidth <= 480;

  if (isMobile) {
    mobileToday.style.display = "flex";

    const condition = lastWeatherData.weather[0].main;
    const temp = lastWeatherData.main.temp;
    const humidity = lastWeatherData.main.humidity;
    const wind = lastWeatherData.wind.speed;
    const feelsLike = Math.round(lastWeatherData.main.feels_like);
    const tip = getTip(condition, temp, humidity, wind);

    const unitLabel = isCelsius ? "°c" : "°f";
    const displayTemp = isCelsius
      ? currentTempC
      : Math.round((currentTempC * 9) / 5 + 32);

    const mTemp = document.querySelector(".m-temp");
    mTemp.innerHTML = displayTemp + `<span class="unit">${unitLabel}</span>`;
    mTemp.onclick = toggleTemp;

    document.querySelector(".m-city").innerHTML = lastWeatherData.name;
    document.querySelector(".m-feels").innerHTML =
      "Feels like " + feelsLike + unitLabel;
    document.querySelector(".m-condition").innerHTML = condition;
    document.querySelector(".m-humidity").innerHTML =
      `<i class="bx bx-air"></i> ${humidity}% Humidity`;
    document.querySelector(".m-wind").innerHTML =
      `<i class="bx bx-wind"></i> ${wind} km/h Wind`;
    document.querySelector(".m-tip").innerHTML = tip;

    // hide hourly panel on mobile
    const panel = document.getElementById("hourly-panel");
    if (panel) panel.classList.remove("open");
  } else {
    mobileToday.style.display = "none";
  }
}

window.addEventListener("resize", syncMobileView);

window.addEventListener("orientationchange", () => {
  setTimeout(syncMobileView, 150);
});
