const apiKey = "4c157f34b0041826b5342b3a93a2f38c";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const searchBox = document.querySelector(".search input");
const bgAnimation = document.getElementById("bg-animation");

const searchBox = document.querySelector(".search input");
// const searchBtn = document.querySelector(".search button");

async function checkweather(url) {
  const response = await fetch(url);
  var data = await response.json();

  console.log(data);

  document.querySelector(".city").innerHTML = data.name;
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
  setBackground(data.weather[0].main);
}

// searchBtn.addEventListener("click", () => {
//   checkweather(searchBox.value);
// });

// In this user types and it automatically gets searched no searchbtn needed.
let debounceTimer;
searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const cleanCity = searchBox.value.replace(/[^a-zA-Z\s]/g, "").trim();
    if (cleanCity) {
      checkweather(apiUrl + `q=${cleanCity}&appid=${apiKey}`);
    }
  }, 500);
});

// it needs paid api to detect your location
window.addEventListener("load", () => {
  checkweather(apiUrl + `q=Delhi&appid=${apiKey}`);
});

// Animated bgs
function setBackground(condition) {
  // remove all classes from body
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
    cloud.style.animationDuration = (Math.random() * 20 + 15) + "s";
    cloud.style.animationDelay = (Math.random() * 10) + "s";
    cloud.style.opacity = Math.random() * 0.5 + 0.3;
    bgAnimation.appendChild(cloud);
  }
}

function createDrops(count, type) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.classList.add("particle", type);
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + "s";
    drop.style.animationDelay = (Math.random() * 2) + "s";
    bgAnimation.appendChild(drop);
  }
}

function createSnow(count) {
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.classList.add("particle", "snowflake");
    flake.style.left = Math.random() * 100 + "vw";
    flake.style.animationDuration = (Math.random() * 3 + 3) + "s";
    flake.style.animationDelay = (Math.random() * 5) + "s";
    flake.style.width = flake.style.height = (Math.random() * 6 + 4) + "px";
    bgAnimation.appendChild(flake);
  }
}

function createLightning() {
  for (let i = 0; i < 3; i++) {
    const bolt = document.createElement("div");
    bolt.classList.add("lightning");
    bolt.style.left = Math.random() * 100 + "vw";
    bolt.style.top = "0";
    bolt.style.height = (Math.random() * 200 + 100) + "px";
    bolt.style.animationDuration = (Math.random() * 4 + 3) + "s";
    bolt.style.animationDelay = (Math.random() * 3) + "s";
    bgAnimation.appendChild(bolt);
  }
}

function createMist() {
  for (let i = 0; i < 5; i++) {
    const layer = document.createElement("div");
    layer.classList.add("mistlayer");
    layer.style.top = (i * 20) + "vh";
    layer.style.animationDuration = (Math.random() * 10 + 10) + "s";
    layer.style.animationDelay = (Math.random() * 5) + "s";
    bgAnimation.appendChild(layer);
  }
}