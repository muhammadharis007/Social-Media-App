const WebSocket = require("ws");

class GameServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.games = new Map();
    this.users = new Map();

    this.wss.on("connection", (ws) => {
      ws.on("message", (message) =>
        this.handleMessage(ws, JSON.parse(message))
      );
      ws.on("close", () => this.handleDisconnect(ws));
    });
  }

  handleMessage(ws, message) {
    console.log("Received message:", message);
    switch (message.type) {
      case "auth":
        this.handleAuth(ws, message.username);
        break;
      case "create_game":
        this.createGame(ws, message.username);
        break;
      case "join_game":
        this.joinGame(ws, message.gameId);
        break;
      case "start_game":
        this.startGame(message.gameId);
        break;
      case "submit_story":
        this.submitStory(message.gameId, message.username, message.text);
        break;
      case "submit_vote":
        this.submitVote(message.gameId, message.username, message.votedFor);
        break;
    }
  }

  handleAuth(ws, username) {
    this.users.set(ws, { username });
    ws.send(
      JSON.stringify({
        type: "auth_success",
        username,
      })
    );
  }

  createGame(ws, username) {
    const gameId = Math.random().toString(36).substring(7);
    const game = {
      id: gameId,
      host: username,
      players: [username],
      status: "waiting",
      story: [],
      currentTurn: 0,
      submissions: {},
      votes: {},
      scores: {},
    };
    this.games.set(gameId, game);

    ws.send(
      JSON.stringify({
        type: "game_created",
        game,
      })
    );
  }

  joinGame(ws, gameId) {
    const game = this.games.get(gameId);
    const user = this.users.get(ws);

    if (!game || !user) return;

    if (!game.players.includes(user.username)) {
      game.players.push(user.username);
      game.scores[user.username] = 0;
    }

    this.broadcastGameState(gameId);
  }

  startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.players.length < 3) return;

    game.status = "playing";
    game.currentTurn = 0;
    this.broadcastGameState(gameId);
  }

  submitStory(gameId, username, text) {
    const game = this.games.get(gameId);
    if (!game || game.status !== "playing") return;

    game.submissions[username] = text;

    if (Object.keys(game.submissions).length === game.players.length) {
      game.story.push(...Object.values(game.submissions));
      game.submissions = {};
      game.status = "voting";
    }

    this.broadcastGameState(gameId);
  }

  submitVote(gameId, username, votedFor) {
    const game = this.games.get(gameId);
    if (!game || game.status !== "voting") return;

    game.votes[username] = votedFor;
    game.scores[votedFor] = (game.scores[votedFor] || 0) + 1;

    if (Object.keys(game.votes).length === game.players.length) {
      game.votes = {};
      game.currentTurn++;
      game.status = game.currentTurn >= 5 ? "completed" : "playing";
    }

    this.broadcastGameState(gameId);
  }

  handleDisconnect(ws) {
    const user = this.users.get(ws);
    if (!user) return;

    // Remove user from any games they're in
    for (const [gameId, game] of this.games.entries()) {
      const playerIndex = game.players.indexOf(user.username);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          this.games.delete(gameId);
        } else {
          this.broadcastGameState(gameId);
        }
      }
    }

    this.users.delete(ws);
  }

  broadcastGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const gameState = JSON.stringify({
      type: "game_state",
      game,
    });

    this.wss.clients.forEach((client) => {
      const user = this.users.get(client);
      if (user && game.players.includes(user.username)) {
        client.send(gameState);
      }
    });
  }
}

module.exports = GameServer;
