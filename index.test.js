/**
 * @author Carlton Joseph
 * @fileoverview Jest test cases for Star Blockchain Notary Service
 */
const fs = require("fs");
const request = require("supertest");
const rimraf = require("rimraf"); // utility to remove a non empty directory
const bitcoin = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const app = require("./app");
const { chainDB } = require("./simpleChain");
const {
  generateStarData,
  testStarDataFilename
} = require("./generate-star-data");
const { validationWindowOptions } = require("./validationWindow");

beforeAll(async () => {
  try {
    //console.log(await del(chainDB));
    //console.log(await del(testStarDataFilename));
    //console.log(await generateStarData());
    app.setValidationWindow(validationWindowOptions.oneSecond);
  } catch (e) {
    console.log(e);
  }
  /* change callback to promis so async/await can be used */
  const del = fileDir =>
    new Promise((resolve, reject) =>
      rimraf(fileDir, e => {
        if (e) return reject(e);
        else return resolve(`deleted ${fileDir}`);
      })
    );
});

describe.skip("basic server tests", () => {
  test("test server responds", () =>
    request(app)
      .get("/")
      .expect(200));

  test("verify user timeout", async done => {
    const dummy = "dummy";
    const resp = await reqValidation(dummy);
    expect(resp.address).toEqual(dummy);
    expect(parseFloat(resp.validationWindow)).toBeGreaterThan(0.0);
    /* verify that after a timeout we get a new validation window */
    setTimeout(async () => {
      const resp = await reqValidation(dummy);
      expect(resp.address).toEqual(dummy);
      expect(parseFloat(resp.validationWindow)).toBeGreaterThan(0.0);
      done();
    }, app.getExpireTimeInMs() + 1000);
  });
});

/** make a validation request with a dummy address */
const reqValidation = address =>
  request(app)
    .post("/requestValidation")
    .send({ address })
    .expect(200)
    .expect("Content-type", /json/)
    .then(resp => JSON.parse(resp.text));

/** continue a validation request with a validation signed message */
const reqSignature = (address, signature) =>
  request(app)
    .post("/message-signature/validate")
    .send({ address, signature })
    .expect("Content-type", /json/)
    .expect(200)
    .then(resp => JSON.parse(resp.text));

/** sleep for a given number of ms */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe("id validation", () => {
  let users;

  beforeAll(async () => {
    /* read in the test users and their star data */
    try {
      users = await new Promise((resolve, reject) => {
        fs.readFile("star-data.json", "utf8", (err, data) => {
          if (err) return reject(err);
          resolve(JSON.parse(data));
        });
      });
    } catch (e) {
      console.error(e);
    }
  });

  test("invalid signature", async done => {
    expect(users).not.toBeFalsy();
    const { address } = users[0]; // arbitrary user address
    await reqValidation(address);
    const respS = await reqSignature(address, "bad"); // bad signature
    expect(respS.status.messageSignature).toBe("invalid");
    done();
  });

  test("valid signature", async done => {
    expect(users).not.toBeFalsy();
    const { address, privateKey, compressed } = users[0];
    const respV = await reqValidation(address);
    const signature = bitcoinMessage
      .sign(respV.message, new Buffer.from(privateKey, "base64"), compressed)
      .toString("base64");
    sleep(app.getExpireTimeInMs() + 1000);
    const respS = await reqSignature(address, signature);
    expect(respS.status.messageSignature).toBe("valid");
    done();
  });

  test("timeout", async done => {
    expect(users).not.toBeFalsy();
    const { address, privateKey, compressed } = users[0];
    const respV = await reqValidation(address);
    const signature = bitcoinMessage
      .sign(respV.message, new Buffer.from(privateKey, "base64"), compressed)
      .toString("base64");
    await sleep(app.getExpireTimeInMs() + 1000);
    const respS = await reqSignature(address, signature);
    expect(respS.status.validationWindow).toBe(0.0);
    done();
  });
});

describe.skip("star registration", () => {
  test.skip("file star registration", done => {
    expect(users).toBeTruthy();
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

  const addStar = (user, star) => {
    const { pubkey: pubK, privateKey: privK, compressed } = user;
    const pubkey = new Buffer.from(pubK, "base64");
    const privateKey = new Buffer.from(privK, "base64");
    const { address } = bitcoin.payments.p2pkh({ pubkey });
    return reqValidation(address)
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
});

describe.skip("star lookup", () => {
  test("show chain", () => request(app).get("/showchain"));
  test("file star lookup by wallet address", done => {
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

  test("star lookup by hash", done => {
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

  test("get chain", () =>
    request(app)
      .get("/getchain")
      .then(chain => console.log(chain)));
});
