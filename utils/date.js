function getLastSunday() {
  let today = new Date();
  let lastSunday = new Date();

  // If today is Sunday, subtract 7 days, otherwise get the last Sunday
  let daysToSubtract = today.getDay() === 0 ? 7 : today.getDay();
  lastSunday.setDate(today.getDate() - daysToSubtract);

  return lastSunday.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

module.exports = { getLastSunday };
