/**
 * @author Carlton Joseph
 * @fileoverview Generates test data for wallet addresses and associated stars
 */
const fs = require("fs");
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");

const testStarDataFilename = "star-data.json";

const star = no => ({
  dec: `-26° 29' 24.${no}`,
  ra: `16h 29m ${no}.0s`,
  story: `Found star ${no} using https://www.google.com/sky/`
});

const generateStarData = () => {
  const starData = [];

  let starNo = 0;
  for (let user = 0; user < 3; user++) {
    const keyPair = bitcoin.ECPair.makeRandom();
    const { publicKey: pubkey, privateKey, compressed } = keyPair;
    const pubK = pubkey.toString("base64");
    const privK = privateKey.toString("base64");
    const { address } = bitcoin.payments.p2pkh({ pubkey });
    const stars = [];
    for (let starr = 0; starr < user + 1; starr++) stars.push(star(starNo++));
    starData.push({
      pubkey: pubK,
      privateKey: privK,
      compressed,
      address,
      stars
    });
  }

  const stars = JSON.stringify(starData, undefined, 2);
  return new Promise(resolve => {
    fs.writeFile(testStarDataFilename, stars, "utf8", () => resolve());
  });
};

if (typeof require != "undefined" && require.main === module)
  generateStarData().then(() =>
    console.log("star data written to", testStarDataFilename)
  );

module.exports = {
  generateStarData,
  testStarDataFilename
};
