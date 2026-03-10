/**
 * holidays.js — Public holiday fetching & caching via Nager.Date API
 */

const BASE_URL = "https://date.nager.at/api/v3";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch public holidays for a country and year, with localStorage caching.
 * @param {string} countryCode — ISO 3166-1 alpha-2 (e.g. "VN")
 * @param {number} year
 * @returns {Promise<Array>} array of holiday objects
 */
async function fetchHolidays(countryCode, year) {
    const cacheKey = `holidays_${countryCode}_${year}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS) return data;
        } catch (_) {}
    }

    const res = await fetch(`${BASE_URL}/PublicHolidays/${year}/${countryCode}`);

    if (!res.ok) {
        throw new Error(`Holiday fetch failed: ${res.status}`);
    }

    const data = await res.json();

    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
}

/**
 * Get the next upcoming public holiday for a given country.
 * Automatically spans year boundary (fetches next year if needed).
 * @param {string} countryCode
 * @returns {Promise<{ name: string, localName: string, date: Date, dateStr: string }>}
 */
export async function getNextHoliday(countryCode) {
    const now = new Date();
    const year = now.getFullYear();

    let holidays = await fetchHolidays(countryCode, year);

    // Find next holiday after today (compare date strings to avoid TZ issues)
    const todayStr = now.toISOString().slice(0, 10);
    let next = holidays.find((h) => h.date > todayStr);

    // If no more holidays this year, look at next year
    if (!next) {
        const nextYearHolidays = await fetchHolidays(countryCode, year + 1);
        next = nextYearHolidays[0] ?? null;
    }

    if (!next) {
        throw new Error("No upcoming holidays found");
    }

    return {
        name: next.name,
        localName: next.localName,
        date: new Date(`${next.date}T00:00:00`),
        dateStr: next.date,
    };
}

/**
 * Get all available countries from Nager.Date, with caching.
 * @returns {Promise<Array<{ countryCode: string, name: string }>>}
 */
export async function getAvailableCountries() {
    const cacheKey = "nager_countries";
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            // Cache countries for 7 days
            if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) return data;
        } catch (_) {}
    }

    const res = await fetch(`${BASE_URL}/AvailableCountries`);
    if (!res.ok) {
        throw new Error(`Countries fetch failed: ${res.status}`);
    }
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
}
