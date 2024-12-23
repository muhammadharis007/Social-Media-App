class GameStateManager {
  constructor() {
    this.games = new Map();
    this.onlinePlayers = new Map();
    this.lastActivity = new Map();

    // Cleanup interval
    setInterval(() => this.cleanup(), 10000);
  }

  // Player status management
  setPlayerOnline(username, gameId = null) {
    this.onlinePlayers.set(username, {
      status: "online",
      lastSeen: Date.now(),
      gameId,
    });
  }

  setPlayerOffline(username) {
    this.onlinePlayers.delete(username);
  }

  isPlayerOnline(username) {
    const player = this.onlinePlayers.get(username);
    if (!player) return false;
    return Date.now() - player.lastSeen < 15000; // 15 seconds threshold
  }

  // Game management
  createGame(hostUsername) {
    const game = {
      players: [hostUsername],
      status: "waiting",
      story: [],
      currentPlayer: 0,
      iteration: 0,
      scores: {},
      timeCreated: Date.now(),
      lastActivity: Date.now(),
      playerOrder: [hostUsername],
      submissions: {},
      votes: {},
      currentRound: {
        phase: "waiting",
        deadline: null,
      },
    };
    this.games.set(hostUsername, game);
    return game;
  }

  getGame(hostUsername) {
    return this.games.get(hostUsername);
  }

  updateGame(hostUsername, updates) {
    const game = this.games.get(hostUsername);
    if (!game) return null;

    Object.assign(game, updates);
    game.lastActivity = Date.now();
    return game;
  }

  addPlayerToGame(hostUsername, playerUsername) {
    const game = this.games.get(hostUsername);
    if (!game) return null;

    if (!game.players.includes(playerUsername)) {
      game.players.push(playerUsername);
      game.playerOrder.push(playerUsername);
      game.scores[playerUsername] = 0;
      this.setPlayerOnline(playerUsername, hostUsername);
    }
    return game;
  }

  removePlayerFromGame(hostUsername, playerUsername) {
    const game = this.games.get(hostUsername);
    if (!game) return null;

    game.players = game.players.filter((p) => p !== playerUsername);
    if (game.players.length === 0) {
      this.games.delete(hostUsername);
      return { ended: true };
    }

    // Transfer host if needed
    if (playerUsername === hostUsername && game.players.length > 0) {
      const newHost = game.players[0];
      this.games.set(newHost, { ...game, hostUsername: newHost });
      this.games.delete(hostUsername);
      return { newHost, game: this.games.get(newHost) };
    }

    return game;
  }

  // Utility methods
  getOnlinePlayers() {
    const now = Date.now();
    const onlinePlayers = {};

    this.onlinePlayers.forEach((data, username) => {
      if (now - data.lastSeen < 15000) {
        onlinePlayers[username] = data;
      }
    });

    return onlinePlayers;
  }

  cleanup() {
    const now = Date.now();

    // Cleanup inactive games
    for (const [host, game] of this.games.entries()) {
      if (now - game.lastActivity > 300000) {
        // 5 minutes
        this.games.delete(host);
      }
    }

    // Cleanup offline players
    for (const [username, data] of this.onlinePlayers.entries()) {
      if (now - data.lastSeen > 15000) {
        this.onlinePlayers.delete(username);
      }
    }
  }

  getPlayerGame(username) {
    for (const [host, game] of this.games.entries()) {
      if (game.players.includes(username)) {
        return { hostUsername: host, game };
      }
    }
    return null;
  }

  getAllGames() {
    const games = {};
    this.games.forEach((game, host) => {
      games[host] = game;
    });
    return games;
  }
}

// Create a singleton instance
const gameState = new GameStateManager();
module.exports = gameState;
