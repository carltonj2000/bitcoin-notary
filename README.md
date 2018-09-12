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

# Scratch pad

Ignore every thing below this line as I use it just for a scratch pad.

console.log simpleChain.js:150
blk => {"hash":"7a0bc818370b670a1c3a8d5f6a932da1f826c2395ec215b5ad11e100f2583f12","height":1,"body":{"address":"14edRzd1PYA59UqKv8Es5RLNHLPqi9Uun3","star":{"dec":"-26° 29' 24.0","ra":"16h 29m 0.0s","story":"Found star 0 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"92ce54ba689255a5fb3f26493873409585880212400be456a092ee4fe5c1a9c2"}

console.log simpleChain.js:150
blk => {"hash":"0e1fa725c0dbb308cbdc24bea04f9639dc24f26ef378b076f16402e0f9a47cf0","height":2,"body":{"address":"1Q6Fd2ABw96RwgJfPWYkyo6etdyRvLSf56","star":{"dec":"-26° 29' 24.1","ra":"16h 29m 1.0s","story":"Found star 1 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"7a0bc818370b670a1c3a8d5f6a932da1f826c2395ec215b5ad11e100f2583f12"}

console.log simpleChain.js:150
blk => {"hash":"6d7dfb80cff198f3460a7293f34810fccd5922944f5d2e672d911628d62d4324","height":3,"body":{"address":"1Q6Fd2ABw96RwgJfPWYkyo6etdyRvLSf56","star":{"dec":"-26° 29' 24.2","ra":"16h 29m 2.0s","story":"Found star 2 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"0e1fa725c0dbb308cbdc24bea04f9639dc24f26ef378b076f16402e0f9a47cf0"}

console.log simpleChain.js:150
blk => {"hash":"5847680f8fd253f6c2a2357819e06bc73de73a516a80dc5d0c519bcc6c2b4fae","height":4,"body":{"address":"1H3si8tpnyfMRr76JCRCzyYqhuDXRhUGdJ","star":{"dec":"-26° 29' 24.3","ra":"16h 29m 3.0s","story":"Found star 3 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"6d7dfb80cff198f3460a7293f34810fccd5922944f5d2e672d911628d62d4324"}

console.log simpleChain.js:150
blk => {"hash":"4f0cea6a36e6515082eae333c6dfc643006f3a4a2c43c5781be7d0733debe016","height":5,"body":{"address":"1H3si8tpnyfMRr76JCRCzyYqhuDXRhUGdJ","star":{"dec":"-26° 29' 24.4","ra":"16h 29m 4.0s","story":"Found star 4 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"5847680f8fd253f6c2a2357819e06bc73de73a516a80dc5d0c519bcc6c2b4fae"}

console.log simpleChain.js:150
blk => {"hash":"832f874d06ecf113f649f70880d075c9e95809917398fd0ea45bcc445cb649b3","height":6,"body":{"address":"1H3si8tpnyfMRr76JCRCzyYqhuDXRhUGdJ","star":{"dec":"-26° 29' 24.5","ra":"16h 29m 5.0s","story":"Found star 5 using https://www.google.com/sky/"}},"time":"1536710931","previousBlockHash":"4f0cea6a36e6515082eae333c6dfc643006f3a4a2c43c5781be7d0733debe016"}
