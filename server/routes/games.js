const express = require("express");
const router = express.Router();
const gameState = require("../gameState");

// Status endpoint
router.post("/status", (req, res) => {
  const { username, status, force } = req.body;
  gameState.setPlayerOnline(username);
  res.json({ success: true, timestamp: Date.now() });
});

// Get online players
router.get("/online-players", (req, res) => {
  res.json(gameState.getOnlinePlayers());
});

// Join game
router.post("/join", (req, res) => {
  const { hostUsername, playerUsername } = req.body;
  let game = gameState.getGame(hostUsername);

  if (!game) {
    game = gameState.createGame(hostUsername);
  }

  game = gameState.addPlayerToGame(hostUsername, playerUsername);
  res.json(game);
});

// Get active game
router.get("/active/:username", (req, res) => {
  const { username } = req.params;
  const activeGame = gameState.getPlayerGame(username);
  res.json(activeGame);
});

// Game actions
router.post("/action", (req, res) => {
  const { hostUsername, action, data } = req.body;
  const game = gameState.getGame(hostUsername);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  switch (action) {
    case "start_game":
      if (game.players.length >= 3) {
        game.status = "playing";
        game.currentRound = {
          phase: "writing",
          deadline: Date.now() + 120000,
          currentPlayer: 0,
        };
        game.lastActivity = Date.now();
      }
      break;

    case "check_status":
      // Just return current game state
      break;

    case "submit_story":
      if (game.currentRound.phase === "writing") {
        game.submissions[data.player] = data.text;
        if (Object.keys(game.submissions).length === game.players.length) {
          game.story.push(...Object.values(game.submissions));
          game.currentRound.phase = "voting";
          game.currentRound.deadline = Date.now() + 30000;
          game.submissions = {};
        }
      }
      break;
    // ... other action cases ...
  }

  gameState.updateGame(hostUsername, game);
  res.json(game);
});

// Leave game
router.post("/leave", (req, res) => {
  const { hostUsername, username } = req.body;
  const result = gameState.removePlayerFromGame(hostUsername, username);
  res.json(result);
});

// Get all games
router.get("/active-games", (req, res) => {
  res.json(gameState.getAllGames());
});

// Add a new endpoint to check if game can start
router.get("/can-start/:hostUsername", (req, res) => {
  const { hostUsername } = req.params;
  const game = gameState.getGame(hostUsername);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  const canStart = game.players.length >= 3 && game.status === "waiting";
  res.json({ canStart, playerCount: game.players.length });
});

module.exports = router;
