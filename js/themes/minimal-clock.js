/**
 * minimal-clock.js — Theme: The Minimal Clock
 * Injects its own DOM scaffold, hooks into countdown ticks.
 */

import { getAvailableCountries } from "../holidays.js";
import { getYearProgress } from "../countdown.js";

let _onCountryChange = null;

/**
 * Mount the Minimal Clock theme into the app container.
 * @param {HTMLElement} container — #app element
 * @param {{ countryCode: string, holiday: object, onCountryChange: function }} opts
 */
export function mount(container, { countryCode, holiday, onCountryChange }) {
    _onCountryChange = onCountryChange;
    document.body.className = "theme-minimal-clock";

    const progress = getYearProgress();
    const holidayDate = holiday.date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    container.innerHTML = `
    <div class="mc-progress-bar" role="progressbar" aria-label="Year progress">
      <div class="mc-progress-fill" id="mc-progress-fill" style="width:${(progress * 100).toFixed(3)}%"></div>
    </div>

    <main class="mc-main">
      <p class="mc-eyebrow">NEXT PUBLIC HOLIDAY</p>
      <h1 class="mc-holiday-name" id="mc-holiday-name">${escHtml(holiday.name)}</h1>
      <p class="mc-holiday-date">${holidayDate}</p>

      <div class="mc-countdown" id="mc-countdown">
        ${unitBlock("mc-days", "00", "DAYS")}
        <span class="mc-sep">:</span>
        ${unitBlock("mc-hours", "00", "HRS")}
        <span class="mc-sep">:</span>
        ${unitBlock("mc-minutes", "00", "MIN")}
        <span class="mc-sep">:</span>
        ${unitBlock("mc-seconds", "00", "SEC")}
      </div>

      ${holiday.localName && holiday.localName !== holiday.name ? `<p class="mc-local-name">${escHtml(holiday.localName)}</p>` : ""}

      <div class="mc-country-wrap">
        <button class="mc-country-btn" id="mc-country-btn" aria-label="Change country">
          <svg class="mc-globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span id="mc-country-label">${countryCode}</span>
        </button>
      </div>
    </main>

    <!-- Country picker modal -->
    <div class="mc-modal-overlay" id="mc-modal-overlay" hidden>
      <div class="mc-modal" role="dialog" aria-modal="true" aria-label="Select country">
        <div class="mc-modal-header">
          <h2>Select Country</h2>
          <button class="mc-modal-close" id="mc-modal-close" aria-label="Close">✕</button>
        </div>
        <input class="mc-modal-search" id="mc-modal-search" type="search" placeholder="Search country…" autocomplete="off">
        <ul class="mc-modal-list" id="mc-modal-list" role="listbox">
          <li class="mc-modal-loading">Loading countries…</li>
        </ul>
      </div>
    </div>
  `;

    bindEvents(countryCode);

    // Wire tick callback
    window.__themeOnTick = (remaining) => updateCountdown(remaining);
    window.__themeOnZero = () => triggerZero();

    // Initial tick (populate immediately before first interval fires)
    updateProgress();
}

export function unmount() {
    window.__themeOnTick = null;
    window.__themeOnZero = null;
    _onCountryChange = null;
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
function unitBlock(id, value, label) {
    return `
    <div class="mc-unit">
      <span class="mc-digit" id="${id}">${value}</span>
      <span class="mc-label">${label}</span>
    </div>`;
}

function escHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pad(n) {
    return String(n).padStart(2, "0");
}

// ─── Countdown update ─────────────────────────────────────────────────────────
function updateCountdown({ days, hours, minutes, seconds }) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = pad(val);
    };
    set("mc-days", days);
    set("mc-hours", hours);
    set("mc-minutes", minutes);
    set("mc-seconds", seconds);
    updateProgress();
}

function updateProgress() {
    const fill = document.getElementById("mc-progress-fill");
    if (fill) fill.style.width = `${(getYearProgress() * 100).toFixed(4)}%`;
}

function triggerZero() {
    const cd = document.getElementById("mc-countdown");
    if (cd) cd.classList.add("mc-countdown--zero");
}

// ─── Country picker ───────────────────────────────────────────────────────────
function bindEvents(currentCode) {
    document.getElementById("mc-country-btn")?.addEventListener("click", openModal);
    document.getElementById("mc-modal-close")?.addEventListener("click", closeModal);
    document.getElementById("mc-modal-overlay")?.addEventListener("click", (e) => {
        if (e.target.id === "mc-modal-overlay") closeModal();
    });
    document.getElementById("mc-modal-search")?.addEventListener("input", (e) => {
        filterList(e.target.value.trim().toLowerCase());
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
}

let _countries = null;

async function openModal() {
    const overlay = document.getElementById("mc-modal-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    document.getElementById("mc-modal-search")?.focus();

    if (!_countries) {
        try {
            _countries = await getAvailableCountries();
        } catch {
            document.getElementById("mc-modal-list").innerHTML = '<li class="mc-modal-loading">Failed to load countries.</li>';
            return;
        }
    }
    renderCountryList(_countries);
}

function closeModal() {
    const overlay = document.getElementById("mc-modal-overlay");
    if (overlay) overlay.hidden = true;
    document.getElementById("mc-modal-search").value = "";
}

function renderCountryList(list) {
    const ul = document.getElementById("mc-modal-list");
    if (!ul) return;
    ul.innerHTML = list
        .map(
            (c) =>
                `<li class="mc-modal-item" role="option" tabindex="0" data-code="${escHtml(c.countryCode)}">
          <span class="mc-modal-code">${escHtml(c.countryCode)}</span>
          <span class="mc-modal-cname">${escHtml(c.name)}</span>
        </li>`,
        )
        .join("");

    ul.querySelectorAll(".mc-modal-item").forEach((item) => {
        const select = () => {
            const code = item.dataset.code;
            closeModal();
            document.getElementById("mc-country-label").textContent = code;
            _onCountryChange?.(code);
        };
        item.addEventListener("click", select);
        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") select();
        });
    });
}

function filterList(query) {
    if (!_countries) return;
    const filtered = query
        ? _countries.filter((c) => c.name.toLowerCase().includes(query) || c.countryCode.toLowerCase().includes(query))
        : _countries;
    renderCountryList(filtered);
}
