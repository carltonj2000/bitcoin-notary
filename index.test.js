const request = require("supertest");
const rimraf = require("rimraf"); // utility to remove a non empty directory
const moment = require("moment");
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");

const app = require("./app");
const { chainDB } = require("./simpleChain");
test.skip("clear blockchain", done => {
  rimraf(chainDB, e => {
    if (e) console.error("Failed deleting DB", e);
    done();
  });
});

test.skip("test server responds", () => request(app).get("/"));

const reqV = address =>
  request(app)
    .post("/requestValidation")
    .send({ address })
    .then(
      resp => (address === "dummy" ? console.log(resp.text) || resp : resp)
    );
//.expect("Content-type", /json/)
//.expect(200);

test.skip("allow user request - deliver user response", done =>
  reqV("dummy") &&
  setTimeout(() => {
    reqV("dummy");
    done();
  }, 2000));

test("request validation", done => {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { publicKey: pubkey, privateKey, compressed: kpCompressed } = keyPair;
  const { address: address } = bitcoin.payments.p2pkh({ pubkey });
  reqV(address)
    .then(resp => JSON.parse(resp.text))
    .then(resp => {
      const signature = bitcoinMessage
        .sign(resp.message, privateKey, kpCompressed)
        .toString("base64");
      //      const errMsgSig = "bob"; // test error case
      setTimeout(() => {
        request(app)
          .post("/message-signature/validate")
          .send({ address, signature })
          //        .send({ address, signature: errMsgSig }) // test error case
          .expect("Content-type", /json/)
          .expect(200)
          .then(resp => {
            console.log(resp.text);
            done();
          });
      }, 0); // change time out to fail or pass validation window
    });
});

test.skip("moment", done => {
  const now = moment();
  const nowP1 = now.clone().add(1, "minute");
  const diff = nowP1.diff(now);
  console.log("n", now, "n+1", nowP1, "diff", diff);
  setTimeout(() => {
    const diff2 = moment().diff(now);
    const diff3 = now.diff(moment());
    console.log("d2", diff2, "d3", diff3);
    done();
  }, 1000);
});
