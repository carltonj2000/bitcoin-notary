const app = require("./app");

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("Loading bockchain.");
  app.chain
    .finishActions()
    .then(() => {
      console.log(
        `Blockchain loaded and API server listening on port ${port}!`
      );
    })
    .catch(e =>
      console.error("Blockchain failed initialization with error =>", e)
    );
});
