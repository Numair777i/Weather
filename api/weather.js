// pages/api/weather.js
// Geocodes the city/area name with Nominatim, then fetches current weather
// from Open-Meteo. No API key needed for either service.

export default async function handler(req, res) {
  const city = req.query.city;
  if (!city)
    return res.status(400).json({ cod: "400", message: "No city provided" });

  try {
    // 1. Geocode — Nominatim is great for sub-city areas like "Zakir Nagar Delhi"
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "WeatherApp/1.0" } }, // Nominatim requires a User-Agent
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return res.status(200).json({ cod: "404", message: "City not found" });
    }

    const { lat, lon, display_name, address } = geoData[0];

    // Build a short display name: neighbourhood / suburb / city / town
    const locationName =
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.village ||
      address.town ||
      address.city ||
      address.county ||
      display_name.split(",")[0];

    // 2. Fetch current weather from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
        `wind_speed_10m,weather_code,precipitation,surface_pressure` +
        `&wind_speed_unit=kmh&timezone=auto`,
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      return res
        .status(200)
        .json({ cod: "404", message: "Weather data unavailable" });
    }

    const c = weatherData.current;

    // Map Open-Meteo WMO weather codes → OWM-style condition names
    // so app.js icons / backgrounds / tips keep working without changes
    const condition = wmoToCondition(c.weather_code);

    // Return a response shaped like OWM's /weather so app.js needs minimal changes
    res.status(200).json({
      cod: 200,
      name: locationName,
      timezone: weatherData.timezone, // e.g. "Asia/Kolkata"
      timezone_offset: weatherData.utc_offset_seconds,
      coord: { lat: parseFloat(lat), lon: parseFloat(lon) },
      main: {
        temp: c.temperature_2m,
        feels_like: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        pressure: c.surface_pressure,
      },
      wind: { speed: c.wind_speed_10m },
      weather: [{ main: condition, description: condition.toLowerCase() }],
    });
  } catch (err) {
    console.error("weather handler error:", err);
    res.status(500).json({ cod: "500", message: "Internal server error" });
  }
}

// WMO code → OWM-style condition string
// Full WMO code table: https://open-meteo.com/en/docs
function wmoToCondition(code) {
  if (code === 0) return "Clear";
  if (code <= 2) return "Clouds"; // partly cloudy
  if (code === 3) return "Clouds"; // overcast
  if (code <= 49) return "Mist"; // fog / depositing rime
  if (code <= 57) return "Drizzle"; // drizzle
  if (code <= 67) return "Rain"; // rain
  if (code <= 77) return "Snow"; // snow / snow grains
  if (code <= 82) return "Rain"; // rain showers
  if (code <= 86) return "Snow"; // snow showers
  if (code <= 99) return "Thunderstorm"; // thunderstorm
  return "Clouds";
}
