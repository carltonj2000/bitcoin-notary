/* Provide different validation window options for testing 
 * Single file used so same value is use in code and tests */

validationWindowOptions = Object.freeze({
  a: { number: 1, units: "seconds" },
  b: { number: 5, units: "minutes" }
});

const validationWindowDefault = validationWindowOptions.a;

module.exports = {
  validationWindowDefault
};
