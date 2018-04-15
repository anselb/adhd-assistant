var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
})


// Imports the Google Cloud client library.
const Storage = require('@google-cloud/storage');

// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
const storage = new Storage({
  keyFilename: './adhd-assistant-b16fc1d8777e.json'
});

// Makes an authenticated API request.
storage
  .getBuckets()
  .then((results) => {
    const buckets = results[0];

    console.log('Buckets:');
    buckets.forEach((bucket) => {
      console.log(bucket.name);
    });
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });


// Dialogflow
// You can find your project ID in your Dialogflow agent settings
const projectId = 'adhd-assistant'; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: './adhd-assistant-b16fc1d8777e.json'
});

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);


function botResponse(msg) {
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: msg,
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  // var botReply =

  return sessionClient
    .detectIntent(request)
    .then(responses => {
      console.log('Detected intent');
      const result = responses[0].queryResult;
      console.log(`  Query: ${result.queryText}`);
      console.log(`  Response: ${result.fulfillmentText}`);

      botReply = result.fulfillmentText
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
      } else {
        console.log(`  No intent matched.`);
      }
      console.log(botReply, "testing")
      return botReply
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

}

function botTimeout(msg) {
    const charactersPerSec = 6
    const millisecondsInSec = 1000
    return msg.length / charactersPerSec * millisecondsInSec
}

io.on('connection', function (socket) {
    console.log('a user connected')
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    })
    socket.on('chat message', function (msg) {
        // Old Timeout
        // setTimeout(function () {
        //   botResponse(msg).then(reply => {
        //     io.emit('chat message', reply);
        //   })
        // }, botTimeout(msg))
      botResponse(msg).then(reply => {
        io.emit('chat message', reply);
      })
    })
    socket.on('disconnect', function () {
        console.log('user disconnected')
    })
})

http.listen(process.env.PORT || 3000, function(){
    console.log('Socket Chat listening on port 3000')
})
