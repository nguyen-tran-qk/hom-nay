/**
 * main.js — App entry point & theme orchestrator
 */

import { detectCountry } from "./geo.js";
import { getNextHoliday } from "./holidays.js";
import { startCountdown } from "./countdown.js";
import { mount as mountMinimalClock, unmount as unmountMinimalClock } from "./themes/minimal-clock.js";

// ─── State ────────────────────────────────────────────────────────────────────
const COUNTRY_KEY = "user_country";
const THEME_KEY = "user_theme";

let stopCountdown = null;
let currentTheme = localStorage.getItem(THEME_KEY) || "minimal-clock";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSavedCountry() {
    return localStorage.getItem(COUNTRY_KEY) || null;
}

function saveCountry(code) {
    localStorage.setItem(COUNTRY_KEY, code);
}

// ─── Core flow ────────────────────────────────────────────────────────────────
async function run(countryCode) {
    // Tear down any previous countdown/theme
    if (stopCountdown) {
        stopCountdown();
        stopCountdown = null;
    }
    unmountCurrentTheme();

    const app = document.getElementById("app");
    app.innerHTML = `<div class="loading"><span>Fetching holidays…</span></div>`;

    try {
        const holiday = await getNextHoliday(countryCode);
        mountCurrentTheme(app, countryCode, holiday);

        stopCountdown = startCountdown(
            holiday.date,
            (remaining) => window.__themeOnTick?.(remaining),
            () => window.__themeOnZero?.(),
        );
    } catch (err) {
        app.innerHTML = `<div class="error">
      <p>Could not load holidays for <strong>${countryCode}</strong>.</p>
      <p>Please select a different country.</p>
    </div>`;
        console.error(err);
    }
}

function mountCurrentTheme(app, countryCode, holiday) {
    if (currentTheme === "minimal-clock") {
        mountMinimalClock(app, { countryCode, holiday, onCountryChange });
    }
    // Future themes mount here
}

function unmountCurrentTheme() {
    if (currentTheme === "minimal-clock") {
        unmountMinimalClock();
    }
    // Future themes unmount here
}

// ─── Country override ─────────────────────────────────────────────────────────
async function onCountryChange(newCode) {
    saveCountry(newCode);
    await run(newCode);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    // Register service worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    const country = getSavedCountry() || detectCountry();
    saveCountry(country);
    await run(country);
}

init();
