const fs = require("fs");
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

test.skip("file id validation", done => {
  fs.readFile("star-data.json", "utf8", (err, data) => {
    if (err) return console.log(err);
    const jsonData = JSON.parse(data);
    const { pubkey: pubK, privateKey: privK, compressed } = jsonData[0].user;
    const pubkey = new Buffer.from(pubK, "base64");
    const privateKey = new Buffer.from(privK, "base64");
    const { address } = bitcoin.payments.p2pkh({ pubkey });
    reqV(address)
      .then(resp => JSON.parse(resp.text))
      .then(resp => {
        const signature = bitcoinMessage
          .sign(resp.message, privateKey, compressed)
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
});

test.skip("star registration", done => {
  const keyPair = bitcoin.ECPair.makeRandom();
  const { publicKey: pubkey, privateKey, compressed } = keyPair;
  const { address } = bitcoin.payments.p2pkh({ pubkey });
  reqV(address)
    .then(resp => JSON.parse(resp.text))
    .then(resp => {
      const signature = bitcoinMessage
        .sign(resp.message, privateKey, compressed)
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

const addStar = (user, star) => {
  const { pubkey: pubK, privateKey: privK, compressed } = user;
  const pubkey = new Buffer.from(pubK, "base64");
  const privateKey = new Buffer.from(privK, "base64");
  const { address } = bitcoin.payments.p2pkh({ pubkey });
  return reqV(address)
    .then(resp => JSON.parse(resp.text))
    .then(resp => {
      const signature = bitcoinMessage
        .sign(resp.message, privateKey, compressed)
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
        console.log("registering star", star);
        request(app)
          .post("/block")
          .send({ address, star })
          /*.expect("Content-type", /json/)
        .expect(200)
        .then(resp => JSON.parse(resp.text))*/
          .then(resp => console.log(resp.text));
      }
    });
};
test.skip("file star registration", done => {
  fs.readFile("star-data.json", "utf8", (err, data) => {
    if (err) return console.log(err);
    const users = JSON.parse(data);
    const promises = [];
    users.forEach(user =>
      user.stars.forEach(star => {
        promises.push(addStar(user, star, done));
        console.log(user.address, star.story);
      })
    );
    Promise.all(promises)
      .then(() => console.log("Promises finished") || done(0))
      .catch(e => console.log("Promises failed", e));
  });
});

test.skip("file star lookup by wallet address", done => {
  fs.readFile("star-data.json", "utf8", (err, data) => {
    if (err) return console.log(err);
    const users = JSON.parse(data);
    const promises = [];
    users.forEach(user =>
      promises.push(
        request(app)
          .get(`/star/address:${user.address}`)
          /*.expect("Content-type", /json/)
    .expect(200)
    .then(resp => JSON.parse(resp.text))*/
          .then(resp => console.log(resp.text))
      )
    );

    Promise.all(promises).then(() => {
      console.log("Finished search promises.");
      done();
    });
  });
});

test.skip("star lookup by hash", done => {
  const hash =
    "0e1fa725c0dbb308cbdc24bea04f9639dc24f26ef378b076f16402e0f9a47cf0";
  request(app)
    .get(`/star/hash:${hash}`)
    .then(resp => console.log(resp.text) || done());
});

test("star lookup by block height", done => {
  request(app)
    .get("/block/5")
    .then(resp => console.log(resp.text) || done());
});

test.skip("show chain", () => request(app).get("/showchain"));
