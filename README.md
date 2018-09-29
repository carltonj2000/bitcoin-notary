# Blockchain Notary Web API

- This repository contains the code for the notary project of the
  [Udacity Blockchain Nanodegree](https://www.udacity.com/course/blockchain-developer-nanodegree--nd1309).
- This project uses:
  - Node v10.8.0
  - Express v4.16.3
  - ... other dependencies can be seen in the `package.json` file

This project is based of the
[Web API Project](https://github.com/carltonj2000/project3bc-rest-api).

## Run Project

Install dependencies, start the web API server and run the tests, buy executing
the following commands respectively.

```
yarn
yarn start
yarn test
```

## Web API

The web API server provides the following functionality:

- Validate User - via wallet address
- Register One Star - for validated user
- Look Up A Star - by wallet address, block hash &amp; block height

The endpoints, require for the above functionality, are described in the
following sections. All endpoints use JSON for requests and responses.
For more precision the server returns milliseconds for the `requestTimeStamp`
(not seconds as shown in the text below).

### Validate User

In order to validate a user the following transactions occur:

| Client to server                   | Server to client                           |
| ---------------------------------- | ------------------------------------------ |
| Requests wallet address validation | Request signature for a message            |
| Returns signed message             | Verifies signature and allows registration |

#### Requests wallet address validation &amp; Request signature for a message

##### POST `http://localhost:8000/requestValidation`

The client performs a POST request at the URL noted above with the data in the
following format.

```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}
```

The server response with a message to sign, within a given validation window
(in seconds), in the following format.

```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "requestTimeStamp": "1532296090",
  "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
  "validationWindow": 300
}
```

#### Returns signed message &amp; Verifies signature and allows registration

##### POST `http://localhost:8000/validate`

The client performs a POST request at the URL noted above with the data in the
following format.

```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}
```

If the client responds within the validation window, then the server responds
with the data in the format seen below. If `"registerStar": true` is seen then
the signature is correct and the client is allowed to register one star with no
time limit. A value of `"registerStar": false` means the user can not register
a star due to an invalid message signature.

```
{
  "registerStar": true,
  "status": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "requestTimeStamp": "1532296090",
    "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
    "validationWindow": 193,
    "messageSignature": "valid"
  }
}
```

If the client responds outside the validation window, then the server responds
with the data in the format seen below.

```
{
  "registerStar": false,
  "status": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "validationWindow": 0
  }
}
```

### Register One Star

##### POST `http://localhost:8000/block`

Once a client is validated, the client is allowed to register one star by
performing a POST request at the URL noted above with the data in the
following format.

```
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}
```

Once the star is registered, the server responds with data in the following
format. The star `"story"` is truncated by the server to 500 bytes if it
is longer than 500 bytes.

```
{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```

### Look Up A Star

#### Star lookup by wallet address

##### GET `http://localhost:8000/stars/address:[ADDRESS]`

The client performs a GET request, with the wallet address, at the URL noted
above.
The server responds with data in the following format.

```
[
  {
    "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
    "height": 1,
    "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
        "ra": "16h 29m 1.0s",
        "dec": "-26° 29' 24.9",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "time": "1532296234",
    "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
  },
  {
    "hash": "6ef99fc533b9725bf194c18bdf79065d64a971fa41b25f098ff4dff29ee531d0",
    "height": 2,
    "body": {
      "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
      "star": {
        "ra": "17h 22m 13.1s",
        "dec": "-27° 14' 8.2",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "time": "1532330848",
    "previousBlockHash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
  }
]
```

#### Star lookup by block hash

##### GET `http://localhost:8000/stars/hash:[hash]`

The client performs a GET request, with the star hash value, at the URL noted
above.
The server responds with data in the following format.

```
{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```

#### Star lookup by block height

##### GET `http://localhost:8000/block/[height]`

The client performs a GET request, with a block hight, at the URL noted
above.
The server responds with data in the following format.

```
{
  "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
  "height": 1,
  "body": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "star": {
      "ra": "16h 29m 1.0s",
      "dec": "-26° 29' 24.9",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1532296234",
  "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```

## Testing

At present the tests have some issues.
Specifically the

- deletion of the blockchain database directory,
- deletion of the test star data file, and
- the generation of the new test data file
  are problematic and are commented out.

Due to this the following text is a description of operational intent and not
what is actually happening. The above steps are done manually.

The `index.test.js` file uses `jestjs` test to test the endpoints noted in the
previous sections.
The `jestjs`-tests `describe`-sections are summarized below and full details
can be found in the `index.test.js`.

- Before the tests are run the following operations are done:
  - remove the star blockchain by deleting the `blockchainDB` directory,
  - remove the test data by deleting the `star-data.json` file, and
  - generate a new set of star data in the `star-data.json` file.
    - `star-data.json` is generated by the `generate-star-data.js` file.
    - `star-data.json` is generated with three wallet addresses
      and 1, 2 &amp; 3 stars respectively.
- `basic server tests` verifies basic server functionality
- `id validation` verifies id validation functionality
- `with test users` from the `star-data.json` file
  - `star registration` registers all the stars in the `star-data.json` file.
  - `star lookup by` looks up stars by wallet address, block hash and block
    height. It verifies them with a retrieved copy of the blockchain data.

# Review 2 notes

# Scratch pad

Ignore every thing below this line, as I use it for a scratch pad.
