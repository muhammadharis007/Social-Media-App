class Game {
  constructor() {
    this.username = localStorage.getItem("username");
    if (!this.username) {
      window.location.href = "/login.html";
      return;
    }

    this.setupUI();
    this.connectWebSocket();
  }

  connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.ws = new WebSocket(`${protocol}//${window.location.host}`);

    this.ws.onopen = () => {
      console.log("Connected to game server");
      this.authenticate();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log("Disconnected from server");
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  authenticate() {
    this.ws.send(
      JSON.stringify({
        type: "auth",
        username: this.username,
      })
    );
  }

  setupUI() {
    document.querySelector(".game-container").innerHTML = `
            <div class="game-header">
                <button class="back-btn">Back to Feed</button>
                <h1>Bullshit Invoker</h1>
                <div class="game-status">Waiting for players...</div>
            </div>
            <div class="game-content">
                <div class="players-section">
                    <h2>Players</h2>
                    <div id="players-list"></div>
                    <button id="start-game" style="display: none">Start Game</button>
                </div>
                <div class="game-area">
                    <div id="story-container"></div>
                    <div id="input-area" style="display: none">
                        <textarea maxlength="100" placeholder="Add to the story..."></textarea>
                        <button id="submit-story">Submit</button>
                    </div>
                    <div id="voting-area" style="display: none">
                        <h3>Vote for the best contribution</h3>
                        <div id="voting-options"></div>
                        <button id="submit-vote">Vote</button>
                    </div>
                </div>
            </div>
        `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelector(".back-btn").onclick = () =>
      (window.location.href = "feed.html");
    document
      .getElementById("start-game")
      ?.addEventListener("click", () => this.startGame());
    document
      .getElementById("submit-story")
      ?.addEventListener("click", () => this.submitStory());
    document
      .getElementById("submit-vote")
      ?.addEventListener("click", () => this.submitVote());
  }

  handleMessage(message) {
    switch (message.type) {
      case "auth_success":
        this.createGame();
        break;
      case "game_created":
      case "game_state":
        this.updateGameState(message.game);
        break;
    }
  }

  createGame() {
    this.ws.send(
      JSON.stringify({
        type: "create_game",
        username: this.username,
      })
    );
  }

  updateGameState(game) {
    this.currentGame = game;
    this.updatePlayersList(game.players);
    this.updateGameStatus(game.status);
    this.updateGameArea(game);

    // Show/hide start button for host
    const startButton = document.getElementById("start-game");
    if (startButton) {
      startButton.style.display =
        game.host === this.username &&
        game.status === "waiting" &&
        game.players.length >= 3
          ? "block"
          : "none";
    }
  }

  updatePlayersList(players) {
    const list = document.getElementById("players-list");
    list.innerHTML = players
      .map(
        (player) => `
            <div class="player">
                ${player} ${player === this.currentGame?.host ? "(Host)" : ""}
            </div>
        `
      )
      .join("");
  }

  updateGameStatus(status) {
    const statusEl = document.querySelector(".game-status");
    statusEl.textContent =
      {
        waiting: "Waiting for players...",
        playing: "Game in progress",
        voting: "Voting in progress",
        completed: "Game completed",
      }[status] || status;
  }

  updateGameArea(game) {
    const inputArea = document.getElementById("input-area");
    const votingArea = document.getElementById("voting-area");
    const storyContainer = document.getElementById("story-container");

    // Update story
    storyContainer.innerHTML = game.story
      .map(
        (text, i) => `
            <div class="story-entry">
                <span class="entry-number">${i + 1}</span>
                <p>${text}</p>
            </div>
        `
      )
      .join("");

    // Show/hide input based on turn
    if (game.status === "playing") {
      const isMyTurn = game.players[game.currentTurn] === this.username;
      inputArea.style.display = isMyTurn ? "block" : "none";
      votingArea.style.display = "none";
    } else if (game.status === "voting") {
      inputArea.style.display = "none";
      votingArea.style.display = "block";
      this.updateVotingOptions(game.players);
    } else {
      inputArea.style.display = "none";
      votingArea.style.display = "none";
    }
  }

  updateVotingOptions(players) {
    const votingOptions = document.getElementById("voting-options");
    votingOptions.innerHTML = players
      .filter((player) => player !== this.username)
      .map(
        (player) => `
                <div class="voting-option">
                    <input type="radio" name="vote" value="${player}" id="vote-${player}">
                    <label for="vote-${player}">${player}</label>
                </div>
            `
      )
      .join("");
  }

  startGame() {
    this.ws.send(
      JSON.stringify({
        type: "start_game",
        gameId: this.currentGame.id,
      })
    );
  }

  submitStory() {
    const textarea = document.querySelector("#input-area textarea");
    const text = textarea.value.trim();
    if (!text) return;

    this.ws.send(
      JSON.stringify({
        type: "submit_story",
        gameId: this.currentGame.id,
        username: this.username,
        text,
      })
    );

    textarea.value = "";
  }

  submitVote() {
    const selected = document.querySelector('input[name="vote"]:checked');
    if (!selected) return;

    this.ws.send(
      JSON.stringify({
        type: "submit_vote",
        gameId: this.currentGame.id,
        username: this.username,
        votedFor: selected.value,
      })
    );
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", () => {
  new Game();
});
