const express = require("express");
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const moment = require("moment");

const { Blockchain, Block, chainDB } = require("./simpleChain");

const app = express();
app.chain = new Blockchain();
app.signatureRequests = {};
app.requestStage = Object.freeze("waitingForSignature");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post("/block", (req, res) => {
  const { body } = req.body;
  if (!body) return res.send({ error: "Add block requires body." });
  app.chain
    .addBlock(new Block(body))
    .then(block => {
      console.log("add blk =>", block);
      res.send(block);
    })
    .catch(e => res.send({ error: `add block => ${e}` }));
});

app.post("/requestValidation", (req, res) => {
  const { walletAddress } = req.body;
  if (walletAddress === undefined)
    return res.send({ error: "walletAddress required in body." });
  if (app.signatureRequests[walletAddress])
    return res.send(signMessage(walletAddress));
  app.signatureRequests[walletAddress] = { requestTimestamp: moment() };
  res.send(signMessage(walletAddress));
});

const signMessage = walletAddress => {
  const requestTimestamp =
    app.signatureRequests[walletAddress].requestTimestamp;
  const validationMinutesRemaining = moment(
    requestTimestamp
      .clone()
      .add(5, "minutes")
      .diff(moment())
  ).format("m:ss:SS");
  return {
    signMessage: `${walletAddress}:${requestTimestamp}:starRegistry`,
    validationMinutesRemaining
  };
};
module.exports = app;
