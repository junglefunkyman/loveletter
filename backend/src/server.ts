import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import {AddressInfo} from "net";
import * as session from 'express-session';
import {ErrorCode, error, Message, MessageType, websocketReporter, BoardStateMessage, JoinMessage} from "./protocol";
import {ThrowReporter} from "io-ts/lib/ThrowReporter";
import * as Either from 'fp-ts/lib/Either';
import {pipe} from "fp-ts/lib/pipeable";
import {PlayerController} from "./PlayerController";
import {GamesController} from "./game/GameController";
import {fold} from "fp-ts/lib/Either";

const app = express();

const sessionParser = session({
  saveUninitialized: false,
  secret: "Нарба",
  resave: false
});

app.use(sessionParser);

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const gamesController = new GamesController();

function generateUserId(): string {
  return "RandomUser" + Math.ceil(Math.random() * 100);
}

function authenticate(req: any, callback: (userId: string) => any) {
  sessionParser(req, {} as any, () => {
    if (!req.session.userId) {
      const userId = generateUserId();
      console.log("Generated userId: " + userId);
      req.session.userId = userId;
      callback(userId);
    } else {
      callback(req.session.userId);
    }
  });
}

wss.on('connection', (ws: WebSocket, request: any) => {
  authenticate(request, userId => {
    const playerController = new PlayerController(userId);

    playerController.on('join', joinMessageObj => {
      pipe(JoinMessage.decode(joinMessageObj), fold(
        error => console.log("Failed to parse JoinMessage:" + error),
        joinMessage => {
          gamesController.onJoin(userId, joinMessage.gameId).then(game => {
            playerController.join(game);
          })
      }));
    });

    // Wait for hello message.
    ws.on('message', (m: string) => {
      const parsedMessage = Either.parseJSON(m, reason => {
        ws.send(error(ErrorCode.INVALID_MESSAGE, "Invalid JSON received: " + reason));
      })

      pipe(parsedMessage, Either.map(message => {
        const typedMessage = Message.decode(message);
        ThrowReporter.report(typedMessage)
        // websocketReporter(ws).report(typedMessage)

        pipe(typedMessage, Either.map(mes => {
          const type = mes.type
          playerController.onMessage(type, message);
        }))

        console.log('received: %s', typedMessage);

        playerController.on('stateReady', state => {
          ws.send(JSON.stringify(state));
        });

        ws.send(`Hello ${userId}, you sent -> ${typedMessage}`);
      }));
    });

    ws.on('error', (error) => console.log("Error: " + error));

    ws.send(`Hi there ${userId}, I am a WebSocket server`);
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  console.log("Connection upgrade!");
  console.log("Parsing session from request...");

  authenticate(request, userId => {
    console.log("Successfully parsed session for " + userId);

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  });
});

//start our server
server.listen(process.env.PORT || 8999, () => {
  const address = server.address() as AddressInfo;
  console.log(`Server started on port ${address.port} :)`);
});