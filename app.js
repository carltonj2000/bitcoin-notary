/**
 * @author Carlton Joseph
 * @fileoverview Private Blockchain Notary Webservice
 */
const express = require("express");
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const moment = require("moment");

const { Blockchain, Block, chainDB } = require("./simpleChain");
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
  if (app.validationRequests[address]) return res.send(message(address));
  const requestTimeStamp = moment().valueOf();
  /* remove this entry when the time expires */
  const timeout = setTimeout(
    () => delete app.validationRequests[address],
    app.getExpireTimeInMs()
  );
  app.validationRequests[address] = { requestTimeStamp, timeout };
  res.send(message(address));
});

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
  const requestTS = moment(requestTimeStamp);
  const timeNow = moment();
  let validationWindow;
  if (
    requestTS
      .clone()
      .add(app.validationWindow.number, app.validationWindow.units)
      .isBefore(timeNow)
  )
    validationWindow = "0.0";
  else {
    timeRemaining = moment(
      requestTS
        .clone()
        .add(app.validationWindow.number, app.validationWindow.units)
        .diff(timeNow)
    );
    const fractionOfSeconds = timeRemaining.format("S");
    const seconds = timeRemaining.seconds() + timeRemaining.minutes() * 60;
    validationWindow = `${seconds}.${fractionOfSeconds}`;
  }
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
  if (star == undefined || !star)
    return res.send({
      error: "Missing star information required for start registration."
    });
  const maxStoryLength = 500;
  if (star.story.length > maxStoryLength)
    star.story = star.story.substring(0, maxStoryLength);
  app.chain
    .addBlock(new Block({ address, star }))
    .then(block => {
      console.log("add blk =>", block);
      res.send(block);
    })
    .catch(e => res.send({ error: `add block => ${e}` }));
});

/** star lookup by block height */
app.get("/block/:blockHeight", (req, res) => {
  const { blockHeight } = req.params;
  console.log("height =", blockHeight);
  if (!blockHeight) return res.send({ error: "Get block required height." });
  app.chain
    .getBlock(blockHeight)
    .then(block => {
      console.log("blk =>", block);
      res.send(block);
    })
    .catch(e => res.send({ error: `get block => ${e}` }));
});

/** star lookup by wallet address */
app.get("/star/address::address", (req, res) => {
  const { address } = req.params;
  app.chain
    .searchByAddress(address)
    .then(stars => res.send(stars))
    .catch(e => res.send({ error: `search failed for address => ${address}` }));
});

/** star lookup by block hash */
app.get("/star/hash::hash", (req, res) => {
  const { hash } = req.params;
  app.chain
    .searchByHash(hash)
    .then(star => res.send(star))
    .catch(e => res.send({ error: `search failed for hash => ${hash}` }));
});

/** get the complete block chain - use in testing */
app.get("/getchain", (_, res) => {
  app.chain
    .getchain()
    .then(chain => res.send(chain))
    .catch(e => console.log(e) || res.send({ error: e.toString() }));
});

module.exports = app;
