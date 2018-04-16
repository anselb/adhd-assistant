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

  // Return promise that will return bot responses
  return sessionClient
    .detectIntent(request)
    .then(responses => {
      console.log('Detected intent');

      const result = responses[0].queryResult;
      console.log(result.fulfillmentMessages[0].text.text[0])

      console.log(`  Query: ${result.queryText}`);
      console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
      } else {
        console.log(`  No intent matched.`);
      }

      botReplies = result.fulfillmentMessages
      return botReplies
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}

// Calculates how long to wait before sending a message
function botTimeout(msg) {
  const charactersPerSec = 6
  const millisecondsInSec = 1000
  return msg.length / charactersPerSec * millisecondsInSec
}

// Sends a message after a calculated delay to seem more natural
function respondAfterDelay(message, callback) {
  waitTime = botTimeout(message)
  setTimeout(function() {
    callback(message);
  }, waitTime);
}

io.on('connection', function (socket) {
  console.log('a user connected')
  botResponse('start medication tree').then(replies => {
    var repliesLength = replies.length;
    for (var i = 0; i < repliesLength; i++) {
        io.emit('chat message', replies[i].text.text[0]);
    }
  })

  socket.on('chat message', function (msg) {
      io.emit('chat message', msg);
  })

  socket.on('chat message', function (msg) {
    botResponse(msg).then(replies => {
      var repliesLength = replies.length;
      for (var i = 0; i < repliesLength; i++) {
        message = replies[i].text.text[0]

        respondAfterDelay(message, function(response) {
          io.emit('chat message', response);
        })
      }
    })
  })

  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
})

http.listen(process.env.PORT || 3000, function(){
  console.log('Socket Chat listening on port 3000')
})
