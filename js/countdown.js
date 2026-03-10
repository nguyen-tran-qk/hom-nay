/**
 * countdown.js — Live countdown engine
 */

/**
 * Compute time remaining until a target date.
 * @param {Date} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, total: number }}
 */
export function getTimeRemaining(targetDate) {
    const total = Math.max(0, targetDate.getTime() - Date.now());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / 1000 / 60 / 60) % 24);
    const days = Math.floor(total / 1000 / 60 / 60 / 24);
    return { days, hours, minutes, seconds, total };
}

/**
 * Start a live countdown ticker.
 * @param {Date} targetDate — the date to count down to
 * @param {function} onTick — called every second with { days, hours, minutes, seconds, total }
 * @param {function} [onZero] — called once when countdown reaches zero
 * @returns {function} stop — call to cancel the interval
 */
export function startCountdown(targetDate, onTick, onZero) {
    function tick() {
        const remaining = getTimeRemaining(targetDate);
        onTick(remaining);
        if (remaining.total === 0) {
            clearInterval(id);
            onZero?.();
        }
    }

    tick(); // immediate first call
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
}

/**
 * Calculate the year progress as a fraction (0–1).
 * @returns {number}
 */
export function getYearProgress() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    return (now - startOfYear) / (endOfYear - startOfYear);
}
