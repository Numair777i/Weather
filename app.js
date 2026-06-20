const apiKey = "4c157f34b0041826b5342b3a93a2f38c";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&";

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
}

// searchBtn.addEventListener("click", () => {
//   checkweather(searchBox.value);
// });

// In this user types and it automatically gets searched no searchbtn needed.
let debounceTimer;
searchBox.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (searchBox.value.trim()) {
      checkweather(searchBox.value.trim());
    }
  }, 600);
});

// window.addEventListener("load", async () => {
//   const res = await fetch("https://ip-api.com/json/");
//   const data = await res.json();
//   checkweather(apiUrl + `lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`);
// });

// window.addEventListener("load", async () => {
//   const res = await fetch("https://ip-api.com/json/");
//   const data = await res.json();
//   console.log(data);
//   checkweather(apiUrl + `lat=${data.lat}&lon=${data.lon}&appid=${apiKey}`);
// });

window.addEventListener("load", async () => {
  const res = await fetch("https://ipwho.is/");
  const data = await res.json();
  console.log(data);
  checkweather(apiUrl + `lat=${data.latitude}&lon=${data.longitude}&appid=${apiKey}`);
});
