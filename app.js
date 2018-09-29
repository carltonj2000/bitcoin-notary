/**
 * @author Carlton Joseph
 * @fileoverview Private Blockchain Notary Webservice
 */
const express = require("express");
const bitcoinMessage = require("bitcoinjs-message");
const moment = require("moment");

const { Blockchain, Block } = require("./simpleChain");
const { validationWindowDefault } = require("./validationWindow");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.chain = new Blockchain();
/* store validation request status in the object below */
app.validationRequests = {};
/* set the validation window
 * used during test to reduce the validation window */
app.setValidationWindow = (validationWindow = validationWindowDefault) =>
  (app.validationWindow = validationWindow);
app.setValidationWindow();
/* Use to expire use request 
 * jestjs tests use this time to setup test cases */
app.getExpireTimeInMs = () =>
  app.validationWindow.units === "seconds"
    ? app.validationWindow.number * 1000
    : app.validationWindow.number * 60 * 1000;

/** user validation request */
app.post("/requestValidation", (req, res) => {
  const { address } = req.body;
  if (address === undefined)
    return res.send({ error: "address required in body." });
  if (
    app.validationRequests[address] &&
    timeRemaining(app.validationRequests[address].requestTimeStamp) !== 0
  )
    return res.send(message(address));
  if (app.validationRequests[address]) delete app.validationRequests[address];
  /* to remove this entry when the time expires */
  const timeout = setTimeout(
    () => delete app.validationRequests[address],
    app.getExpireTimeInMs() * 2
  );
  const requestTimeStamp = moment().valueOf();
  app.validationRequests[address] = { requestTimeStamp, timeout };
  res.send(message(address));
});

/* constructs a request validation message */
const timeRemaining = requestTimeStamp => {
  const requestTS = moment(requestTimeStamp);
  const timeNow = moment();
  if (
    requestTS
      .clone()
      .add(app.validationWindow.number, app.validationWindow.units)
      .isBefore(timeNow)
  )
    return 0;
  return moment(
    requestTS
      .clone()
      .add(app.validationWindow.number, app.validationWindow.units)
      .diff(timeNow)
  );
};

/* constructs a request validation message */
const message = address => {
  const { requestTimeStamp } = app.validationRequests[address];
  const validationWindow = validationWin(requestTimeStamp);
  const message = messageGenerate(address, requestTimeStamp);
  return { address, message, requestTimeStamp, validationWindow };
};

/* generate the message based on time stamp and address */
const messageGenerate = (address, requestTimeStamp) =>
  `${address}:${requestTimeStamp}:starRegistry`;

/* calculates the time remaining for the request */
const validationWin = requestTimeStamp => {
  let validationWindow = "0.0";
  const timeR = timeRemaining(requestTimeStamp);
  if (timeR !== 0)
    validationWindow = `${timeR.seconds() +
      timeR.minutes() * 60}.${timeR.format("S")}`;
  return validationWindow;
};

/** user validate request */
app.post("/message-signature/validate", (req, res) => {
  const { address, signature } = req.body;
  if (!(address in app.validationRequests))
    res.send({
      registerStar: false,
      status: { address, validationWindow: 0.0 }
    });
  const { requestTimeStamp } = app.validationRequests[address];
  const message = messageGenerate(address, requestTimeStamp);
  let messageSignature;
  try {
    if (bitcoinMessage.verify(message, address, signature))
      messageSignature = "valid";
    else messageSignature = "invalid";
  } catch (e) {
    messageSignature = "invalid";
  }
  const validationWindow = validationWin(requestTimeStamp);
  const registerStar = validationWindow !== "0.0";
  if (messageSignature === "valid")
    app.validationRequests[address].registerStart = registerStar;
  /* validation successfully completed so disable timeout
   * the client has as much time as needed to regiter one star  */
  if (registerStar && messageSignature === "valid")
    clearTimeout(app.validationRequests[address].timeout);
  /* don't agree with line below but the udacity reviewer wanted it */
  if (validationWindow === "0.0") messageSignature = "invalid";
  return res.send({
    registerStar,
    status: {
      address,
      requestTimeStamp,
      message,
      validationWindow,
      messageSignature
    }
  });
});

/** star registration */
app.post("/block", (req, res) => {
  const { body } = req;
  const { address, star } = body;
  if (address === undefined || !address)
    return res.send({
      error: "Missing address required for start registration."
    });
  if (
    app.validationRequests[address] === undefined ||
    !app.validationRequests[address]
  )
    return res.send({
      error: "Error. Can't register. Blockchain ID validation not completed."
    });
  if (star == undefined || !star)
    return res.send({
      error: "Missing star information required for start registration."
    });
  if (star.dec == undefined || !star.dec)
    return res.send({
      error: "Missing star dec information required for start registration."
    });
  if (star.ra == undefined || !star.ra)
    return res.send({
      error: "Missing star ra information required for start registration."
    });
  if (star.story == undefined || !star.story)
    return res.send({
      error: "Missing star story information required for start registration."
    });
  const maxStoryLength = 500;
  if (star.story.length > maxStoryLength)
    return res.send({
      error: `Star story must be less than ${maxStoryLength}`
    });
  if (!isASCII(star.story))
    return res.send({
      error: "Star story must contain only ASCII characters."
    });
  star.story = a2hex(star.story);
  app.chain
    .addBlock(new Block({ address, star }))
    .then(block => {
      delete app.validationRequests[address];
      res.send(block);
    })
    .catch(e => res.send({ error: `add block => ${e}` }));
});

/* check for ascii characters */
function isASCII(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

/* ascii to hex conversion */
function a2hex(str) {
  var arr = [];
  for (var i = 0, l = str.length; i < l; i++) {
    var hex = Number(str.charCodeAt(i)).toString(16);
    arr.push((hex.length > 1 && hex) || "0" + hex);
  }
  return arr.join("");
}

/** star lookup by block height */
app.get("/block/:blockHeight", (req, res) => {
  const { blockHeight } = req.params;
  if (!blockHeight) return res.send({ error: "Get block required height." });
  app.chain
    .getBlock(blockHeight)
    .then(block => res.send(storyDecode(block)))
    .catch(e => res.send({ error: `get block => ${e}` }));
});

/** star lookup by wallet address */
app.get("/stars/address::address", (req, res) => {
  const { address } = req.params;
  app.chain
    .searchByAddress(address)
    .then(stars => {
      stars.forEach(star => storyDecode(star));
      res.send(stars);
    })
    .catch(e =>
      res.send({
        error: `search failed for address => ${address}. ${e.message}`
      })
    );
});

/** star lookup by block hash */
app.get("/stars/hash::hash", (req, res) => {
  const { hash } = req.params;
  app.chain
    .searchByHash(hash)
    .then(star => res.send(storyDecode(star)))
    .catch(e =>
      res.send({ error: `search failed for hash => ${hash}. ${e.message}` })
    );
});

/* add a hex to ascii decoded story to a star */
function storyDecode(star) {
  star.body.star.storyDecoded = hex2a(star.body.star.story);
  return star;
}

/* hex to ascii conversion */
function hex2a(hex) {
  var str = "";
  for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

/** get the complete block chain - use in testing */
app.get("/getchain", (_, res) => {
  app.chain
    .getchain()
    .then(chain => res.send(chain))
    .catch(e => console.log(e) || res.send({ error: e.toString() }));
});

/** display block chain on the CLI - use in testing */
app.get("/showchain", (_, res) => {
  app.chain.show();
  res.send({ status: "show successful" });
});

module.exports = app;
