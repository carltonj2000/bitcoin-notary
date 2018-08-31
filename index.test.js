const request = require("supertest");
const rimraf = require("rimraf"); // utility to remove a non empty directory
const moment = require("moment");

const app = require("./app");
const { chainDB } = require("./simpleChain");
test.skip("clear blockchain", done => {
  rimraf(chainDB, e => {
    if (e) console.error("Failed deleting DB", e);
    done();
  });
});

test("test server responds", () => request(app).get("/"));

const reqV = v =>
  request(app)
    .post("/requestValidation")
    .send({ walletAddress: "carlton" })
    .expect("Content-type", /json/)
    .expect(200)
    .then(resp => {
      console.log("req", v, resp.text);
      return resp;
    });

test("request validation", done =>
  reqV(1) &&
  setTimeout(() => {
    reqV(2);
    done();
  }, 2000));

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
