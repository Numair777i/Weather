const apiUrl = "/api/weather?";
const forecastUrl = "/api/forecast?";
const bgAnimation = document.getElementById("bg-animation");

// cache all DOM refs once
const dom = {
  searchBox: document.querySelector(".search input"),
  tempEl: document.querySelector(".temp"),
  city: document.querySelector(".city"),
  feels: document.querySelector(".feels"),
  condition: document.querySelector(".condition"),
  humidity: document.querySelector(".humidity"),
  humidityFeel: document.querySelector(".humidity-feel"),
  humidityLabel: document.querySelector(".humidity-label"),
  wind: document.querySelector(".wind"),
  windFeel: document.querySelector(".wind-feel"),
  windLabel: document.querySelector(".wind-label"),
  tip: document.querySelector(".tip"),
  forecast: document.getElementById("forecast"),
  hourlyPanel: document.getElementById("hourly-panel"),
  hourlyStrip: document.getElementById("hourly-strip"),
  mobileToday: document.querySelector(".mobile-today"),
  mobileHourlyCard: document.getElementById("mobile-hourly-card"),
  mobileHourlyStrip: document.getElementById("mobile-hourly-strip"),
  mCity: document.querySelector(".m-city"),
  mTemp: document.querySelector(".m-temp"),
  mFeels: document.querySelector(".m-feels"),
  mCondition: document.querySelector(".m-condition"),
  mHumidity: document.querySelector(".m-humidity"),
  mWind: document.querySelector(".m-wind"),
  mTip: document.querySelector(".m-tip"),
  errorEl: document.querySelector(".error"),
  floatingInput: document.getElementById("floating-search-input"),
  floatingError: document.getElementById("floating-error"),
};

let currentTempC = 0;
let lastWeatherData = null;
let isCelsius = true;
let lastCondition = null;

dom.tempEl.onclick = toggleTemp;
dom.mTemp.onclick = toggleTemp;

const ICONS = {
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
const getIcon = (c) => ICONS[c] || "bx bx-cloud";

const getWindFeel = (w) =>
  w < 5 ? "Calm" : w < 20 ? "Breezy" : w < 40 ? "Windy" : "Very windy";
const getHumidityFeel = (h) =>
  h < 30 ? "Dry" : h < 60 ? "Comfortable" : h < 80 ? "Humid" : "Oppressive";

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

    // flash success glow on search bars
    dom.searchBox.classList.add("success");
    dom.floatingInput.classList.add("success");
    setTimeout(() => {
      dom.searchBox.classList.remove("success");
      dom.floatingInput.classList.remove("success");
    }, 600);

    currentTempC = Math.round(data.main.temp);
    isCelsius = true;

    const condition = data.weather[0].main;
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const feelsLike = Math.round(data.main.feels_like);
    const tip = getTip(condition, temp, humidity, wind);
    const windFeel = getWindFeel(wind);
    const humidityFeel = getHumidityFeel(humidity);

    // update desktop
    dom.city.textContent = data.name;
    dom.tempEl.innerHTML = currentTempC + '<span class="unit">°c</span>';
    dom.feels.textContent = "Feels like " + feelsLike + "°c";
    dom.condition.textContent = condition;
    dom.humidity.textContent = humidity + "%";
    dom.humidityLabel.textContent = "Humidity";
    dom.humidityFeel.textContent = humidityFeel;
    dom.wind.textContent = wind + " km/h";
    dom.windLabel.textContent = "Wind";
    dom.windFeel.textContent = windFeel;
    dom.tip.textContent = tip;

    // update mobile only if on small screen
    if (window.innerWidth <= 480) {
      dom.mobileToday.style.display = "flex";
      dom.mTemp.innerHTML = currentTempC + '<span class="unit">°c</span>';
      dom.mCity.textContent = data.name;
      dom.mFeels.textContent = "Feels like " + feelsLike + "°c";
      dom.mCondition.textContent = condition;
      dom.mHumidity.innerHTML = `<i class="bx bx-air"></i> ${humidity}% Humidity · ${humidityFeel}`;
      dom.mWind.innerHTML = `<i class="bx bx-wind"></i> ${wind} km/h Wind · ${windFeel}`;
      dom.mTip.textContent = tip;
    }

    // only rebuild bg if condition changed
    if (condition !== lastCondition) {
      setBackground(condition);
      lastCondition = condition;
    }

    fetchForecast(cityQuery);
  } catch (err) {
    showError("Something went wrong. Try again.");
  }
}

function toggleTemp() {
  isCelsius = !isCelsius;
  const toF = (c) => Math.round((c * 9) / 5 + 32);
  const unit = isCelsius ? "°c" : "°f";
  const display = (c) =>
    (isCelsius ? c : toF(c)) + `<span class="unit">${unit}</span>`;

  dom.tempEl.innerHTML = display(currentTempC);
  dom.mTemp.innerHTML = display(currentTempC);

  dom.forecast.querySelectorAll(".day-temp").forEach((el) => {
    const c = parseInt(el.dataset.tempc);
    el.textContent = isCelsius ? c + "°c" : toF(c) + "°f";
  });
  document.querySelectorAll(".hour-temp").forEach((el) => {
    const c = parseInt(el.dataset.tempc);
    el.textContent = isCelsius ? c + "°c" : toF(c) + "°f";
  });
}

function showError(msg) {
  dom.errorEl.textContent = msg;
  dom.errorEl.style.display = "block";
  if (dom.floatingError) {
    dom.floatingError.textContent = msg;
    dom.floatingError.style.display = "block";
  }
}
function clearError() {
  dom.errorEl.textContent = "";
  dom.errorEl.style.display = "none";
  if (dom.floatingError) {
    dom.floatingError.textContent = "";
    dom.floatingError.style.display = "none";
  }
}

async function fetchForecast(cityQuery) {
  const res = await fetch(forecastUrl + cityQuery);
  const data = await res.json();

  // pick one reading per day around noon
  const daily = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    if (!daily[day] && hour >= 11 && hour <= 14) daily[day] = item;
  });

  const frag = document.createDocumentFragment();
  Object.entries(daily)
    .slice(0, 5)
    .forEach(([day, item]) => {
      const condition = item.weather[0].main;
      const temp = Math.round(item.main.temp);
      const div = document.createElement("div");
      div.className = "forecast-day";
      div.innerHTML = `<span class="day-name">${day}</span><i class="${getIcon(condition)}"></i><span class="day-temp" data-tempc="${temp}">${temp}°c</span><span class="day-condition">${condition}</span>`;
      frag.appendChild(div);
    });
  dom.forecast.innerHTML = "";
  dom.forecast.appendChild(frag);

  renderHourly(data.list.slice(0, 8));
}

function renderHourly(slots) {
  const cols = buildHourlyCols(slots);

  const dFrag = document.createDocumentFragment();
  cols.forEach((col) => dFrag.appendChild(col.cloneNode(true)));
  dom.hourlyStrip.innerHTML = "";
  dom.hourlyStrip.appendChild(dFrag);

  const mFrag = document.createDocumentFragment();
  cols.forEach((col) => mFrag.appendChild(col.cloneNode(true)));
  dom.mobileHourlyStrip.innerHTML = "";
  dom.mobileHourlyStrip.appendChild(mFrag);

  if (window.innerWidth > 480) dom.hourlyPanel.classList.add("open");
  else dom.mobileHourlyCard.classList.add("visible");
}

function buildHourlyCols(slots) {
  const cols = [];
  const nowCondition = lastWeatherData.weather[0].main;
  const tempStr = isCelsius
    ? currentTempC + "°c"
    : Math.round((currentTempC * 9) / 5 + 32) + "°f";

  // "Now" column
  const nowCol = document.createElement("div");
  nowCol.className = "hour-col";
  nowCol.innerHTML = `<span class="hour-label">Now</span><i class="${getIcon(nowCondition)}"></i><span class="hour-temp" data-tempc="${currentTempC}">${tempStr}</span>`;
  cols.push(nowCol);

  slots.slice(1, 8).forEach((item) => {
    const date = new Date(item.dt * 1000);
    const condition = item.weather[0].main;
    const temp = Math.round(item.main.temp);
    const label = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
    const tStr = isCelsius
      ? temp + "°c"
      : Math.round((temp * 9) / 5 + 32) + "°f";
    const col = document.createElement("div");
    col.className = "hour-col";
    col.innerHTML = `<span class="hour-label">${label}</span><i class="${getIcon(condition)}"></i><span class="hour-temp" data-tempc="${temp}">${tStr}</span>`;
    cols.push(col);
  });

  return cols;
}

function setBackground(condition) {
  document.body.className = "";
  bgAnimation.innerHTML = "";

  const map = {
    Clear: () => {
      document.body.classList.add("clear");
      createSun();
    },
    Clouds: () => {
      document.body.classList.add("clouds");
      createClouds(6);
    },
    Rain: () => {
      document.body.classList.add("rain");
      createDrops(80, "raindrop");
    },
    Drizzle: () => {
      document.body.classList.add("drizzle");
      createDrops(25, "drizzledrop");
    },
    Thunderstorm: () => {
      document.body.classList.add("thunderstorm");
      createDrops(50, "raindrop");
      createLightning();
    },
    Snow: () => {
      document.body.classList.add("snow");
      createSnow(35);
    },
  };

  if (map[condition]) map[condition]();
  else if (["Mist", "Fog", "Haze", "Smoke"].includes(condition)) {
    document.body.classList.add("mist");
    createMist();
  }
}

function createSun() {
  const sun = document.createElement("div");
  sun.className = "sun";
  bgAnimation.appendChild(sun);
}

function createClouds(count) {
  const frag = document.createDocumentFragment();
  const bumps = [
    "position:absolute;background:rgba(255,255,255,0.18);border-radius:50%;width:80px;height:80px;top:-40px;left:20px;",
    "position:absolute;background:rgba(255,255,255,0.18);border-radius:50%;width:100px;height:100px;top:-55px;left:60px;",
    "position:absolute;background:rgba(255,255,255,0.18);border-radius:50%;width:70px;height:70px;top:-35px;left:130px;",
  ];
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement("div");
    cloud.className = "cloud";
    cloud.style.cssText = `top:${Math.random() * 100}vh;animation-duration:${Math.random() * 15 + 10}s;animation-delay:-${Math.random() * 15}s;opacity:${Math.random() * 0.4 + 0.4};transform:scale(${Math.random() * 0.8 + 0.6})`;
    bumps.forEach((css) => {
      const b = document.createElement("div");
      b.style.cssText = css;
      cloud.appendChild(b);
    });
    frag.appendChild(cloud);
  }
  bgAnimation.appendChild(frag);
}

function createDrops(count, type) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = `particle ${type}`;
    drop.style.cssText = `left:${Math.random() * 100}vw;animation-duration:${Math.random() * 0.5 + 0.5}s;animation-delay:${Math.random() * 2}s`;
    frag.appendChild(drop);
  }
  bgAnimation.appendChild(frag);
}

function createSnow(count) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 6 + 4;
    const flake = document.createElement("div");
    flake.className = "particle snowflake";
    flake.style.cssText = `left:${Math.random() * 100}vw;animation-duration:${Math.random() * 3 + 3}s;animation-delay:${Math.random() * 5}s;width:${size}px;height:${size}px`;
    frag.appendChild(flake);
  }
  bgAnimation.appendChild(frag);
}

function createLightning() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 3; i++) {
    const flash = document.createElement("div");
    flash.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(100,150,255,0.08);animation:flash ${Math.random() * 4 + 3}s ease-in-out infinite;animation-delay:${Math.random() * 5}s;pointer-events:none;z-index:0;`;
    frag.appendChild(flash);
  }
  bgAnimation.appendChild(frag);
}

function createMist() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 6; i++) {
    const layer = document.createElement("div");
    layer.className = "mistlayer";
    layer.style.cssText = `top:${i * 14}vh;animation-duration:${Math.random() * 15 + 10}s;animation-delay:-${Math.random() * 10}s;opacity:${Math.random() * 0.3 + 0.15}`;
    frag.appendChild(layer);
  }
  bgAnimation.appendChild(frag);
}

// on load: clear inputs, load Delhi, focus search on desktop
window.addEventListener("load", () => {
  dom.searchBox.value = "";
  dom.floatingInput.value = "";
  checkweather("city=Delhi");
  if (window.innerWidth > 768) dom.searchBox.focus();
});

let debounceTimer;

dom.searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  dom.searchBox.classList.remove("loading");
  debounceTimer = setTimeout(() => {
    const city = dom.searchBox.value.replace(/[^a-zA-Z\s]/g, "").trim();
    if (city) {
      dom.searchBox.classList.add("loading");
      checkweather(`city=${city}`).finally(() =>
        dom.searchBox.classList.remove("loading"),
      );
    }
  }, 400);
});

dom.floatingInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  dom.floatingInput.classList.remove("loading");
  debounceTimer = setTimeout(() => {
    const city = dom.floatingInput.value.replace(/[^a-zA-Z\s]/g, "").trim();
    if (city) {
      dom.floatingInput.classList.add("loading");
      checkweather(`city=${city}`).finally(() =>
        dom.floatingInput.classList.remove("loading"),
      );
    }
  }, 400);
});

// sync mobile/desktop view on resize or orientation change
function syncMobileView() {
  if (!lastWeatherData) return;
  const isMobile = window.innerWidth <= 480;

  if (isMobile) {
    dom.mobileToday.style.display = "flex";
    dom.mobileHourlyCard.classList.add("visible");
    dom.hourlyPanel.classList.remove("open");

    const condition = lastWeatherData.weather[0].main;
    const temp = lastWeatherData.main.temp;
    const humidity = lastWeatherData.main.humidity;
    const wind = lastWeatherData.wind.speed;
    const feelsLike = Math.round(lastWeatherData.main.feels_like);
    const unit = isCelsius ? "°c" : "°f";
    const displayTemp = isCelsius
      ? currentTempC
      : Math.round((currentTempC * 9) / 5 + 32);

    dom.mTemp.innerHTML = displayTemp + `<span class="unit">${unit}</span>`;
    dom.mCity.textContent = lastWeatherData.name;
    dom.mFeels.textContent = "Feels like " + feelsLike + unit;
    dom.mCondition.textContent = condition;
    dom.mHumidity.innerHTML = `<i class="bx bx-air"></i> ${humidity}% Humidity · ${getHumidityFeel(humidity)}`;
    dom.mWind.innerHTML = `<i class="bx bx-wind"></i> ${wind} km/h Wind · ${getWindFeel(wind)}`;
    dom.mTip.textContent = getTip(condition, temp, humidity, wind);
  } else {
    dom.mobileToday.style.display = "none";
    dom.mobileHourlyCard.classList.remove("visible");
    if (dom.hourlyStrip.children.length > 0)
      dom.hourlyPanel.classList.add("open");
  }
}

// throttle resize — fires at most once per 150ms
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncMobileView, 150);
});
window.addEventListener("orientationchange", () => {
  setTimeout(syncMobileView, 150);
});
