import './style.css';
import { formatISO9075, getHours, intlFormat} from 'date-fns';
import {zonedTimeToUtc} from 'date-fns-tz';
const ts = require('@mapbox/timespace');

const specificTime = document.querySelector('.specific-time');
const specificDate = document.querySelector('.specific-date');
const weatherSearcherButton = document.querySelector('.weather-searcher-button');
const searchBar = document.querySelector('#search-bar');
const temperature = document.querySelector('.temperature-value');
const lowestTemperature = document.querySelector('.lowest-temperature-value');
const highestTemperature = document.querySelector('.highest-temperature-value');
const weatherLocation = document.querySelector('.location-value');
const generalWeather = document.querySelector('.general-weather-value');
const extraWeatherInfo = document.querySelector('.extra-weather-info');
const entireWeatherToday = document.querySelector('.entire-weather-today');
const temperatureSwitchButton = document.querySelector('.switch-checkbox');
let latitudeCoordinate;
let longitudeCoordinate;

entireWeatherToday.style.display = 'none';

function timeOfDay(hour) {
    if (hour >= 4 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 18) return 'afternoon';
    if (hour >= 19 || hour <= 3) return 'night';
}

function createAddHourlyWeatherReports(hourlyTime, hourlyTemperature) {
    // Creates the 3-hour interval weathers
    const hourWeather = document.createElement('div');
    const timeToday = document.createElement('div');
    const hourTemperature = document.createElement('div');
    hourWeather.classList.add('hour-weather');
    timeToday.classList.add('time-today');
    hourTemperature.classList.add('hour-temperature');
    timeToday.innerHTML = hourlyTime;
    temperatureSwitchButton.addEventListener('click', () => {
        if (temperatureSwitchButton.checked === false) {
            hourTemperature.innerHTML = hourlyTemperature + '&#176' + 'F';
        } else if (temperatureSwitchButton.checked === true) {
            hourTemperature.innerHTML = Math.round(((5/9) * hourlyTemperature) - 32) + '&#176' + 'C';
        }
    });
    temperatureSwitchButton.click();
    entireWeatherToday.appendChild(hourWeather);
    hourWeather.appendChild(timeToday);
    hourWeather.appendChild(hourTemperature);
};

function changeTemperatureToFahrenheit(weatherDataTodayMainTemp, weatherDataTodayMainTempMin, weatherDataTodayMainTempMax, feelsLike, weatherDataTodayMainFeelsLike) {
    temperature.innerHTML = Math.round(1.8 * (weatherDataTodayMainTemp - 273) + 32) + '&#176' + 'F';
    lowestTemperature.innerHTML = 'L: ' + Math.round(1.8 * (weatherDataTodayMainTempMin - 273.15) + 32);
    highestTemperature.innerHTML = 'H: ' + Math.round(1.8 * (weatherDataTodayMainTempMax - 273.15) + 32);
    feelsLike.innerHTML = 'Feels Like: ' + Math.round(1.8 * (weatherDataTodayMainFeelsLike - 273.15) + 32) + '&#176' + 'F';
};

function checkStatusOfSwitchCheckbox(weatherDataTodayMainTemp, weatherDataTodayMainTempMin, weatherDataTodayMainTempMax, feelsLike, weatherDataTodayMainFeelsLike) {
    // Checks if the temperature change switch is on or off
    if (temperatureSwitchButton.checked === false) {
        changeTemperatureToFahrenheit(weatherDataTodayMainTemp, weatherDataTodayMainTempMin, weatherDataTodayMainTempMax, feelsLike, weatherDataTodayMainFeelsLike);
    } else if ( temperatureSwitchButton.checked === true) {
        temperature.innerHTML = Math.round(weatherDataTodayMainTemp - 273) + '&#176' + 'C';
        lowestTemperature.innerHTML = 'L: ' + Math.round(weatherDataTodayMainTempMin - 273.15);
        highestTemperature.innerHTML = 'H: ' + Math.round(weatherDataTodayMainTempMax - 273.15);
        feelsLike.innerHTML = 'Feels Like: ' + Math.round(weatherDataTodayMainFeelsLike - 273.15) + '&#176' + 'C';
    }
}

function loadWeather() {
    entireWeatherToday.innerHTML = '';
    extraWeatherInfo.innerHTML = ''
    entireWeatherToday.style.display = 'flex';
    const searchBarInputValue = searchBar.value;
    async function getLatitudeAndLongitudeFromCity() {
        /*  Gets the latitude and longitude from a city using the Geocoding API and uses this to find out the time and if it's night
        or day in a specific city. */
        const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${searchBarInputValue}&appid=4c14c2e22c375e91889eec21c7c41367`, {mode: 'cors'})
        const coordinateData = await response.json();
        const timestamp = Date.now();
        const point = [longitudeCoordinate, latitudeCoordinate];
        const time = ts.getFuzzyLocalTimeFromPoint(timestamp, point);
        const zonedTimeGetHours = zonedTimeToUtc(new Date(), time._z.name);
        latitudeCoordinate = (coordinateData[0].lat).toFixed(2);
        longitudeCoordinate = (coordinateData[0].lon).toFixed(2);
        specificDate.textContent = formatISO9075(new Date(zonedTimeGetHours), { representation: 'date' });        
        specificTime.textContent = formatISO9075(new Date(zonedTimeGetHours), { representation: 'time' });                
        if (timeOfDay(getHours(zonedTimeGetHours)) == 'morning') {
            console.log('test')
            document.body.style.backgroundImage = "url('./2f147032eb97eae1af5c.jpg')"
        } else if (timeOfDay(getHours(zonedTimeGetHours)) == 'afternoon') {
            document.body.style.backgroundImage = "url(./bb8d8d76535ee8f53f4f.jpg)"
        } else if (timeOfDay(getHours(zonedTimeGetHours)) == 'night') {
            console.log('test2')
            document.body.style.backgroundImage = "url(./5a5a3b4438cac5d45708.jpg)"
        }
        getWeatherFromLocation().catch((err) => {
            console.log(err);
        });
    }
    async function getWeatherFromLocation() {
        // Fetches the 3-hour interval weather in a specific location.
        getWeatherTodayFromLocation();
        const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${latitudeCoordinate}&lon=${longitudeCoordinate}&appid=61cf7e020a6ff91aa13c348ebe505012`, {mode: 'cors'})
        const weatherData = await response.json();
        for (let i = 0; i < 8; i++) {
            createAddHourlyWeatherReports(intlFormat(new Date(weatherData.list[i].dt_txt), {hour: 'numeric', day: 'numeric', month: 'numeric'}), Math.round(1.8 * (weatherData.list[i].main.temp - 273) + 32));
        }
    }

    async function getWeatherTodayFromLocation() {
        // Fetches today's weather in a specific location.
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitudeCoordinate}&lon=${longitudeCoordinate}&appid=4c14c2e22c375e91889eec21c7c41367`)
        const weatherDataToday = await response.json();
        const humidity = document.createElement('div');
        const pressure = document.createElement('div');
        const feelsLike = document.createElement('div');
        const weatherHumidity = document.createElement('div');
        const weatherPressure = document.createElement('div');
        const weatherFeelsLike = document.createElement('div');
        humidity.classList.add('humidity');
        pressure.classList.add('pressure');
        humidity.classList.add('humidity-value');
        pressure.classList.add('pressure-value');
        feelsLike.classList.add('feels-like');
        feelsLike.classList.add('weather-feels-like');
        humidity.textContent = 'Humidity: ';
        pressure.textContent = 'Pressure: ';
        feelsLike.textContent = 'Feels Like: ';
        temperatureSwitchButton.addEventListener('click', () => {
            checkStatusOfSwitchCheckbox(weatherDataToday.main.temp, weatherDataToday.main.temp_min, weatherDataToday.main.temp_max, feelsLike, weatherDataToday.main.feels_like);
        });
        checkStatusOfSwitchCheckbox(weatherDataToday.main.temp, weatherDataToday.main.temp_min, weatherDataToday.main.temp_max, feelsLike, weatherDataToday.main.feels_like);        
        weatherLocation.innerHTML = weatherDataToday.name;
        weatherHumidity.innerHTML = weatherDataToday.main.humidity + '%';
        weatherPressure.innerHTML = (weatherDataToday.main.pressure / (1017 / 30.03)).toFixed(2);
        generalWeather.innerHTML = weatherDataToday.weather[0].main;
        extraWeatherInfo.appendChild(humidity);
        extraWeatherInfo.appendChild(pressure);
        extraWeatherInfo.appendChild(feelsLike);
        humidity.appendChild(weatherHumidity);
        pressure.appendChild(weatherPressure);
        feelsLike.appendChild(weatherFeelsLike);
        console.log(weatherDataToday)
    }
    getLatitudeAndLongitudeFromCity().catch((err) => {
        if (err) {
            alert('Please enter a valid city name!')
        }
    });
}

weatherSearcherButton.addEventListener('click', () => {
    // Runs all the async functions when a valid city name is entered and the search icon is clicked.
    loadWeather();
});

searchBar.addEventListener('keydown', (event) => {
        // Runs all the async functions when a valid city name is entered and Enter button is pressed.
    if (event.key === 'Enter') {
        loadWeather();
    }
});