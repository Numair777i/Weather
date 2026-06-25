// pages/api/forecast.js
// Geocodes the city/area name with Nominatim, then fetches a 5-day / hourly
// forecast from Open-Meteo. Response is shaped like OWM's /forecast so
// app.js's fetchForecast() keeps working without any changes.

export default async function handler(req, res) {
  const city = req.query.city;
  if (!city)
    return res.status(400).json({ cod: "400", message: "No city provided" });

  try {
    // 1. Geocode
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "WeatherApp/1.0" } },
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return res.status(200).json({ cod: "404", message: "City not found" });
    }

    const { lat, lon } = geoData[0];

    // 2. Fetch hourly forecast — 5 days = 120 hours
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,` +
        `wind_speed_10m,weather_code,precipitation_probability` +
        `&wind_speed_unit=kmh&timezone=auto&forecast_days=5`,
    );
    const forecastData = await forecastRes.json();

    if (!forecastData.hourly) {
      return res
        .status(200)
        .json({ cod: "404", message: "Forecast data unavailable" });
    }

    const h = forecastData.hourly;

    // Build OWM-style list — one entry per hour
    const list = h.time.map((timeStr, i) => {
      const dt = Math.floor(new Date(timeStr).getTime() / 1000);
      const code = h.weather_code[i];
      const condition = wmoToCondition(code);

      return {
        dt,
        main: {
          temp: h.temperature_2m[i],
          feels_like: h.apparent_temperature[i],
          humidity: h.relative_humidity_2m[i],
        },
        wind: { speed: h.wind_speed_10m[i] },
        weather: [{ main: condition, description: condition.toLowerCase() }],
        pop: (h.precipitation_probability[i] || 0) / 100,
      };
    });

    res.status(200).json({ cod: "200", list });
  } catch (err) {
    console.error("forecast handler error:", err);
    res.status(500).json({ cod: "500", message: "Internal server error" });
  }
}

function wmoToCondition(code) {
  if (code === 0) return "Clear";
  if (code <= 2) return "Clouds";
  if (code === 3) return "Clouds";
  if (code <= 49) return "Mist";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain";
  if (code <= 86) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Clouds";
}
