const apiUrl = "/api/weather?city=";
const forecastUrl = "/api/forecast?city=";
const bgAnimation = document.getElementById("bg-animation");

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
let lastForecastList = [];
let cityTimezone = "auto";
let isCelsius = true;
let lastCondition = null;
let activeDayKey = null;

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

function formatHourLabel(timeStr) {
  const [, timePart] = timeStr.split("T");
  const [hStr] = timePart.split(":");
  const h = parseInt(hStr, 10);
  if (h === 0) return "12 AM";
  if (h < 12) return h + " AM";
  if (h === 12) return "12 PM";
  return h - 12 + " PM";
}

function dateOf(timeStr) {
  return timeStr.split("T")[0];
}

function hourOf(timeStr) {
  return parseInt(timeStr.split("T")[1].split(":")[0], 10);
}

// ── FIXED: get current city hour reliably ────────────────────────────────────
// toLocaleString with hour12:false returns "24" at midnight on some engines,
// and on en-US can return "5 PM" style strings making parseInt give 5 not 17.
// Use Intl.DateTimeFormat with hourCycle h23 which always gives 0-23 integers.
function getCurrentCityHour() {
  try {
    const now = new Date();
    // hourCycle: "h23" guarantees 0–23 output, no AM/PM ambiguity
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: cityTimezone,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === "hour");
    if (hourPart) return parseInt(hourPart.value, 10);
  } catch {}
  // fallback: use UTC offset stored from API response
  return new Date().getHours();
}

// ── also fix todayDate detection ─────────────────────────────────────────────
// Get today's date string in the city's local timezone (YYYY-MM-DD)
function getCityTodayDate() {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: cityTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now); // en-CA gives "YYYY-MM-DD" format natively
    return parts;
  } catch {}
  // fallback: use first entry in forecast list
  return lastForecastList.length ? dateOf(lastForecastList[0].time_str) : null;
}

async function checkweather(city) {
  try {
    const res = await fetch(apiUrl + encodeURIComponent(city));
    const data = await res.json();

    if (
      data.cod === "404" ||
      data.cod === "400" ||
      data.cod === 404 ||
      data.cod === 400
    ) {
      showError("City not found. Try again.");
      return;
    }

    clearError();
    lastWeatherData = data;
    cityTimezone = data.timezone || "auto";

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

    if (condition !== lastCondition) {
      setBackground(condition);
      lastCondition = condition;
    }

    fetchForecast(city);
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

async function fetchForecast(city) {
  const res = await fetch(forecastUrl + encodeURIComponent(city));
  const data = await res.json();
  if (!data.list) return;

  lastForecastList = data.list;
  if (data.timezone) cityTimezone = data.timezone;

  // Use real city local date, not just first entry's date
  const todayDate = getCityTodayDate() || dateOf(data.list[0].time_str);
  activeDayKey = todayDate;

  buildForecastDays(data.list, todayDate);
  showHourlyForDay(todayDate, true);
}

// Update the weather details panel (left on desktop, top on mobile) for a given day
function updateTodayPanel(date, isToday) {
  const slots = lastForecastList.filter(
    (item) => dateOf(item.time_str) === date,
  );
  if (!slots.length) return;

  const noonSlot =
    slots.find((item) => hourOf(item.time_str) === 12) || slots[0];
  const condition = noonSlot.weather[0].main;
  const temp = Math.round(noonSlot.main.temp);
  const feelsLike = Math.round(noonSlot.main.feels_like);
  const humidity = noonSlot.main.humidity;
  const wind = noonSlot.wind.speed;
  const tip = getTip(condition, temp, humidity, wind);
  const windFeel = getWindFeel(wind);
  const humidityFeel = getHumidityFeel(humidity);

  const toF = (c) => Math.round((c * 9) / 5 + 32);
  const unit = isCelsius ? "°c" : "°f";
  const displayTemp = isCelsius ? temp : toF(temp);
  const displayFeels = isCelsius ? feelsLike : toF(feelsLike);

  if (isToday && lastWeatherData) {
    const liveTemp = isCelsius ? currentTempC : toF(currentTempC);
    const liveUnit = unit;
    const liveFeels = isCelsius
      ? Math.round(lastWeatherData.main.feels_like)
      : toF(Math.round(lastWeatherData.main.feels_like));
    dom.tempEl.innerHTML = liveTemp + `<span class="unit">${liveUnit}</span>`;
    dom.feels.textContent = "Feels like " + liveFeels + liveUnit;
    dom.condition.textContent = lastWeatherData.weather[0].main;
    dom.humidity.textContent = lastWeatherData.main.humidity + "%";
    dom.humidityFeel.textContent = getHumidityFeel(
      lastWeatherData.main.humidity,
    );
    dom.wind.textContent = lastWeatherData.wind.speed + " km/h";
    dom.windFeel.textContent = getWindFeel(lastWeatherData.wind.speed);
    dom.tip.textContent = getTip(
      lastWeatherData.weather[0].main,
      lastWeatherData.main.temp,
      lastWeatherData.main.humidity,
      lastWeatherData.wind.speed,
    );
  } else {
    dom.tempEl.innerHTML = displayTemp + `<span class="unit">${unit}</span>`;
    dom.feels.textContent = "Feels like " + displayFeels + unit;
    dom.condition.textContent = condition;
    dom.humidity.textContent = humidity + "%";
    dom.humidityFeel.textContent = humidityFeel;
    dom.wind.textContent = wind + " km/h";
    dom.windFeel.textContent = windFeel;
    dom.tip.textContent = tip;
  }

  // Mobile panel
  if (window.innerWidth <= 480) {
    if (isToday && lastWeatherData) {
      const liveTemp = isCelsius ? currentTempC : toF(currentTempC);
      const liveFeels = isCelsius
        ? Math.round(lastWeatherData.main.feels_like)
        : toF(Math.round(lastWeatherData.main.feels_like));
      dom.mTemp.innerHTML = liveTemp + `<span class="unit">${unit}</span>`;
      dom.mFeels.textContent = "Feels like " + liveFeels + unit;
      dom.mCondition.textContent = lastWeatherData.weather[0].main;
      dom.mHumidity.innerHTML = `<i class="bx bx-air"></i> ${lastWeatherData.main.humidity}% Humidity · ${getHumidityFeel(lastWeatherData.main.humidity)}`;
      dom.mWind.innerHTML = `<i class="bx bx-wind"></i> ${lastWeatherData.wind.speed} km/h Wind · ${getWindFeel(lastWeatherData.wind.speed)}`;
      dom.mTip.textContent = getTip(
        lastWeatherData.weather[0].main,
        lastWeatherData.main.temp,
        lastWeatherData.main.humidity,
        lastWeatherData.wind.speed,
      );
    } else {
      dom.mTemp.innerHTML = displayTemp + `<span class="unit">${unit}</span>`;
      dom.mFeels.textContent = "Feels like " + displayFeels + unit;
      dom.mCondition.textContent = condition;
      dom.mHumidity.innerHTML = `<i class="bx bx-air"></i> ${humidity}% Humidity · ${humidityFeel}`;
      dom.mWind.innerHTML = `<i class="bx bx-wind"></i> ${wind} km/h Wind · ${windFeel}`;
      dom.mTip.textContent = tip;
    }
  }
}

function buildForecastDays(list, todayDate) {
  const days = {};
  list.forEach((item) => {
    const d = dateOf(item.time_str);
    const h = hourOf(item.time_str);
    if (!days[d]) days[d] = { slots: [] };
    days[d].slots.push(item);
    if (h === 12 || !days[d].noon) days[d].noon = item;
  });

  const frag = document.createDocumentFragment();
  Object.entries(days)
    .slice(0, 7)
    .forEach(([date, dayData]) => {
      const item = dayData.noon || dayData.slots[0];
      const condition = item.weather[0].main;
      const temp = Math.round(item.main.temp);

      const jsDate = new Date(date + "T12:00:00");
      const label =
        date === todayDate
          ? "Today"
          : jsDate.toLocaleDateString("en-US", { weekday: "short" });

      const div = document.createElement("div");
      div.className = "forecast-day" + (date === activeDayKey ? " active" : "");
      div.dataset.date = date;
      div.innerHTML = `<span class="day-name">${label}</span><i class="${getIcon(condition)}"></i><span class="day-temp" data-tempc="${temp}">${temp}°c</span><span class="day-condition">${condition}</span>`;

      div.addEventListener("click", () => {
        const isToday = date === todayDate;
        activeDayKey = date;

        dom.forecast
          .querySelectorAll(".forecast-day")
          .forEach((el) =>
            el.classList.toggle("active", el.dataset.date === date),
          );

        updateTodayPanel(date, isToday);
        showHourlyForDay(date, isToday);

        if (window.innerWidth <= 480) {
          setTimeout(() => {
            dom.mobileHourlyCard.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 100);
        }
      });

      frag.appendChild(div);
    });

  dom.forecast.innerHTML = "";
  dom.forecast.appendChild(frag);
}

function showHourlyForDay(date, isToday) {
  const nowHour = isToday ? getCurrentCityHour() : 0;

  const slots = lastForecastList.filter((item) => {
    const d = dateOf(item.time_str);
    const h = hourOf(item.time_str);
    return d === date && h >= nowHour;
  });

  // If isToday and we somehow got no slots (e.g. late night), show midnight onwards
  const finalSlots = slots.length
    ? slots
    : lastForecastList.filter((item) => dateOf(item.time_str) === date);

  renderHourly(finalSlots, isToday);
}

function renderHourly(slots, isToday) {
  const cols = buildHourlyCols(slots, isToday);

  dom.hourlyStrip.innerHTML = "";
  const dFrag = document.createDocumentFragment();
  cols.forEach((col) => dFrag.appendChild(col.cloneNode(true)));
  dom.hourlyStrip.appendChild(dFrag);

  dom.mobileHourlyStrip.innerHTML = "";
  const mFrag = document.createDocumentFragment();
  cols.forEach((col) => mFrag.appendChild(col.cloneNode(true)));
  dom.mobileHourlyStrip.appendChild(mFrag);

  if (window.innerWidth > 480) {
    dom.hourlyPanel.classList.remove("open");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dom.hourlyPanel.classList.add("open");
      });
    });
  } else {
    dom.mobileHourlyCard.classList.add("visible");
  }
}

function buildHourlyCols(slots, isToday) {
  const cols = [];
  const toF = (c) => Math.round((c * 9) / 5 + 32);

  slots.forEach((item, idx) => {
    const condition = item.weather[0].main;
    const temp = Math.round(item.main.temp);
    const tStr = isCelsius ? temp + "°c" : toF(temp) + "°f";
    const label = isToday && idx === 0 ? "Now" : formatHourLabel(item.time_str);

    const col = document.createElement("div");
    col.className = "hour-col";
    col.innerHTML = `<span class="hour-label">${label}</span><i class="${getIcon(condition)}"></i><span class="hour-temp" data-tempc="${temp}">${tStr}</span>`;
    cols.push(col);
  });

  return cols;
}

// ── backgrounds ───────────────────────────────────────────────────────────────

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

// ── init & events ─────────────────────────────────────────────────────────────

window.addEventListener("load", () => {
  dom.searchBox.value = "";
  dom.floatingInput.value = "";
  checkweather("Delhi");
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
      checkweather(city).finally(() =>
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
      checkweather(city).finally(() =>
        dom.floatingInput.classList.remove("loading"),
      );
    }
  }, 400);
});

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

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncMobileView, 150);
});
window.addEventListener("orientationchange", () => {
  setTimeout(syncMobileView, 150);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}
