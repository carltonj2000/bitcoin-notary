const fs = require("fs");
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");

const star = no => ({
  dec: `-26° 29' 24.${no}`,
  ra: `16h 29m ${no}.0s`,
  story: `Found star ${no} using https://www.google.com/sky/`
});

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
fs.writeFile("star-data.json", stars, "utf8", () => console.log("wrote file"));
