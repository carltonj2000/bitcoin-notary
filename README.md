# Blockchain Notary Web API

- This repository contains the code for the notary project of the
  [Udacity Blockchain Nanodegree](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309).
- This project uses:
  - Node v10.8.0
  - Express v4.16.3
  - ... other dependencies can be seen in the `package.json` file
  - To Do - Not necessary to meet project goals
    - Remove console.log on the server and client application.

This project is based of the
[Web API Project](https://github.com/carltonj2000/project3bc-rest-api).

## Run Project

To install dependencies and start the server do the following:

```
yarn
yarn start
```

The web API detailed in the next section can be access via a minimal GUI at http://localhost:8000 or using curl with the following commands.

```
# view block - block number follows block below
curl http://localhost:8000/block/0
# add block
curl -X "POST" "http://localhost:8000/block" -H 'Content-Type: application/json' -d $'{"body":"block body contents"}'
```

## Web API

The server provides the following endpoints.

### http://localhost:8000/block/{BLOCK_HEIGHT} GET

When a GET request is performed at the URL noted above, the block data at {BLOCK_HEIGHT} is returned in a JSON format.

### http://localhost:8000/block POST

When a POST request is performed at the URL noted above, with a JSON body in the following format { "body" : "data for block" }. The returned value will be the inserted block data in a JSON format.
