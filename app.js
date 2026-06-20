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
