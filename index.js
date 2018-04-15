const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const dialogflow = require('dialogflow');

require('dotenv').config();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
})

// Dialogflow variables
const projectId = 'adhd-assistant';
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';

// Instantiate a DialogFlow client.
const sessionClient = new dialogflow.SessionsClient({
  projectId: projectId,
  credentials: {
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL
  }
});

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// Call DialogFlow API whenever a message is sent into the chat
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

  // Return promise that will return bot response
  return sessionClient
    .detectIntent(request)
    .then(responses => {
      console.log('Detected intent');

      const result = responses[0].queryResult;
      console.log(`  Query: ${result.queryText}`);
      console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
      } else {
        console.log(`  No intent matched.`);
      }

      botReply = result.fulfillmentText
      return botReply
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}

// Function for delaying bot response to seem more natural
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
