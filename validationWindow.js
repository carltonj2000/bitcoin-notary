/* Provide different validation window options for testing 
 * Single file used so same value is use in code and tests */

const validationWindowOptions = Object.freeze({
  oneSecond: { number: 1, units: "seconds" },
  twoSeconds: { number: 2, units: "seconds" },
  tenSeconds: { number: 10, units: "seconds" },
  oneMinute: { number: 1, units: "minutes" },
  fiveMinutes: { number: 5, units: "minutes" }
});

const validationWindowDefault = validationWindowOptions.fiveMinutes;

module.exports = {
  validationWindowOptions,
  validationWindowDefault
};
