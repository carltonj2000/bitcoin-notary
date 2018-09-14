/* Provide different validation window options for testing 
 * Single file used so same value is use in code and tests */

validationWindowOptions = Object.freeze({
  oneSecond: { number: 1, units: "seconds" },
  fiveMinutes: { number: 5, units: "minutes" }
});

const validationWindowDefault = validationWindowOptions.fiveMintues;

module.exports = {
  validationWindowOptions,
  validationWindowDefault
};
