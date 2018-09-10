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

test.skip("id validation", done => {
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

test("star registration", done => {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { publicKey: pubkey, privateKey, compressed: kpCompressed } = keyPair;
  const { address } = bitcoin.payments.p2pkh({ pubkey });
  reqV(address)
    .then(resp => JSON.parse(resp.text))
    .then(resp => {
      const signature = bitcoinMessage
        .sign(resp.message, privateKey, kpCompressed)
        .toString("base64");
      //      const errMsgSig = "bob"; // test error case
      return new Promise(resolve =>
        setTimeout(
          () =>
            request(app)
              .post("/message-signature/validate")
              .send({ address, signature })
              //        .send({ address, signature: errMsgSig }) // test error case
              .expect("Content-type", /json/)
              .expect(200)
              .then(resp => JSON.parse(resp.text))
              .then(resp => resolve(resp)),
          0
        )
      ); // change time out to fail or pass validation window
    })
    .then(resp => {
      if (!resp.registerStar) {
        console.log("Failed to get star registation authorization.");
      } else {
        const star = stars[0];
        console.log("registering star", star);
        request(app)
          .post("/block")
          .send({ address, star })
          /*.expect("Content-type", /json/)
          .expect(200)
          .then(resp => JSON.parse(resp.text))*/
          .then(resp => console.log(resp.text));
      }
      done();
    });
});

const stars = [
  {
    dec: "-26° 29' 24.9",
    ra: "16h 29m 1.0s",
    story: "Found star using https://www.google.com/sky/"
  }
];
