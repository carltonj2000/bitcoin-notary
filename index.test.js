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
const moment = require("moment");

beforeAll(async done => {
  /* change callback to promis so async/await can be used */
  const del = fileDir =>
    new Promise((resolve, reject) =>
      rimraf(fileDir, e => {
        if (e) return reject(e);
        else return resolve(`deleted ${fileDir}`);
      })
    );
  //await del(chainDB);
  //await del(testStarDataFilename);
  //await generateStarData();
  const validationWindow = validationWindowOptions.oneSecond;
  app.setValidationWindow(validationWindow);
  jest.setTimeout(app.getExpireTimeInMs() * 2 + 1000);
  done();
});

describe("basic server tests", () => {
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

/** start a validation request */
const reqValidation = address =>
  request(app)
    .post("/requestValidation")
    .send({ address })
    .expect(200)
    .expect("Content-type", /json/)
    .then(resp => JSON.parse(resp.text))
    .catch(e => console.error("reqValidation", e));

/** request a signature/user-address validation */
const reqSignature = (address, signature) =>
  request(app)
    .post("/message-signature/validate")
    .send({ address, signature })
    .expect("Content-type", /json/)
    .expect(200)
    .then(resp => JSON.parse(resp.text))
    .catch(e => console.error("reqSignature", e));

/** request to register a start */
const reqRegister = (address, star) =>
  request(app)
    .post("/block")
    .send({ address, star })
    .expect("Content-type", /json/)
    .expect(200)
    .then(resp => JSON.parse(resp.text))
    .catch(e => console.error("reqSignature", e));

/** request via get a urlPath */
const reqPath = urlpath =>
  request(app)
    .get(urlpath)
    .expect("Content-type", /json/)
    .expect(200)
    .then(resp => JSON.parse(resp.text))
    .catch(e => console.error("reqPath", e));

/** sleep for a given number of ms - used to test timeout condition */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe("id validation", () => {
  let address, privateKey, compressed;

  beforeAll(async () => {
    const keyPair = bitcoin.ECPair.makeRandom();
    ({ publicKey: pubkey, privateKey, compressed } = keyPair);
    ({ address } = bitcoin.payments.p2pkh({ pubkey }));
  });
  test("invalid signature", async done => {
    await reqValidation(address);
    const respS = await reqSignature(address, "bad"); // bad signature
    expect(respS.status.messageSignature).toBe("invalid");
    done();
  });

  test("valid signature", async done => {
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
    const respV = await reqValidation(address);
    const signature = bitcoinMessage
      .sign(respV.message, new Buffer.from(privateKey, "base64"), compressed)
      .toString("base64");
    await sleep(app.getExpireTimeInMs() + 1000);
    const respS = await reqSignature(address, signature);
    expect(parseFloat(respS.status.validationWindow)).toBe(0.0);
    done();
  });
});

describe("with test users", () => {
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

  describe("star registration", async () => {
    test("with test users and stars", async done => {
      expect(users).not.toBeFalsy();
      let firstStar = true;
      for (const user of users) {
        for (const star of user.stars) {
          if (firstStar) {
            await addStar(user, star, app.getExpireTimeInMs() + 1000);
            firstStar = false;
          } else await addStar(user, star);
        }
      }
      done();
    });

    const addStar = async (user, star, waitRms = 0) => {
      const { address, privateKey, compressed } = user;
      const respV = await reqValidation(address);
      expect(respV).not.toBeFalsy();
      expect(respV.message).not.toBeFalsy();
      const signature = bitcoinMessage
        .sign(respV.message, new Buffer.from(privateKey, "base64"), compressed)
        .toString("base64");
      const respS = await reqSignature(address, signature);
      expect(respS.registerStar).toBe(true);
      if (waitRms) await sleep(waitRms);
      const respR = await reqRegister(address, star);
      /* verify some feilds in the response */
      expect(respR.time).toBeTruthy();
      expect(respR.hash).toBeTruthy();
      expect(respR.previousBlockHash).toBeTruthy();
    };
  });

  describe("star lookup by", async () => {
    let chain;

    beforeAll(async () => (chain = await reqPath("/getchain")));

    test("wallet address", async done => {
      expect(chain.length).toBeGreaterThan(1);
      for (const user of users) {
        const stars = await reqPath(`/stars/address:${user.address}`);
        expect(stars.length).toBe(getStarsByWallet(user.address).length);
      }
      done();
    });

    test("hash", async done => {
      expect(chain.length).toBeGreaterThan(1);
      const star = JSON.parse(getRandomStar());
      const resp = await reqPath(`/stars/hash:${star.hash}`);
      expect(resp.height).toBe(star.height);
      expect(resp.hash).toBe(star.hash);
      done();
    });

    test("block height", async done => {
      expect(chain.length).toBeGreaterThan(1);
      const star = JSON.parse(getRandomStar());
      const resp = await reqPath(`/block/${star.height}`);
      expect(resp.height).toBe(star.height);
      expect(resp.hash).toBe(star.hash);
      done();
    });

    const getRandomStar = () => chain[Math.floor(Math.random() * chain.length)];
    const getStarsByWallet = wallet =>
      chain.reduce((a, starStr) => {
        const star = JSON.parse(starStr);
        if (star.body.address === wallet) return [...a, star];
        else return a;
      }, []);
  });
});
