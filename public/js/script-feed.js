// Selectors
const menuItems = document.querySelectorAll(".menu-item");
const theme = document.querySelector("#theme");
const themeModal = document.querySelector(".customize-theme");
const fontSizeOptions = document.querySelectorAll(".choose-size span");
const root = document.querySelector(":root");
const colorPalette = document.querySelectorAll(".choose-color span");
const Bg1 = document.querySelector(".bg-1");
const Bg2 = document.querySelector(".bg-2");
const Bg3 = document.querySelector(".bg-3");
const logOut = document.getElementById("log-out-btn");

// Username from local storage
const username = localStorage.getItem("username");

// User Data Elements
let usernameElement = document.getElementById("username");
const profilePicElement = document.getElementById("pfp");
const friendsTab = document.querySelector(".friends-tab");

// Utility Functions
const addActiveClass = (element, className = "active") =>
  element.classList.add(className);
const removeActiveClass = (elements, className = "active") =>
  elements.forEach((el) => el.classList.remove(className));

// Add this after the other utility functions
const getSequenceInfo = (friendCount) => {
  if (friendCount >= 100) return { level: 1, name: "The FOOL", max: 150 };
  if (friendCount >= 50) return { level: 2, name: "Celebrity", max: 100 };
  if (friendCount >= 20) return { level: 3, name: "Popular Kid", max: 50 };
  if (friendCount >= 5) return { level: 4, name: "NPC", max: 20 };
  return { level: 5, name: "Friendless", max: 5 };
};

const getSequenceDescription = (level) => {
  const descriptions = {
    1: "Ascended beyond mortal friendships",
    2: "Living the life of fame and connections",
    3: "Rising star in the social scene",
    4: "Just beginning their social journey",
    5: "Seeking their first connections",
  };
  return descriptions[level] || "Unknown sequence";
};

// Create popup HTML
const createProfilePopup = () => {
  const popup = document.createElement("div");
  popup.className = "profile-popup";
  popup.innerHTML = `
    <i class="uil uil-times close-popup"></i>
    <div class="profile-header">
      <h2 class="username"></h2>
      <p class="email"></p>
    </div>
    <div class="sequence-progress">
      <div class="title">
        <h3>Sequence: <span class="sequence-name"></span></h3>
        <span class="friend-count"></span>
      </div>
      <div class="bar">
        <div class="progress">
          <img class="sequence-icon" src="" alt="sequence">
        </div>
      </div>
    </div>
    <div class="user-stats">
      <div class="stat-item">
        <h4 class="posts-count">0</h4>
        <p>Posts</p>
      </div>
      <div class="stat-item">
        <h4 class="friends-count">0</h4>
        <p>Friends</p>
      </div>
      <div class="stat-item">
        <h4 class="interests-count">0</h4>
        <p>Interests</p>
      </div>
    </div>
    <div class="interests-list"></div>
  `;

  const overlay = document.createElement("div");
  overlay.className = "profile-popup-overlay";

  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  return { popup, overlay };
};

const createSequenceBar = (friendCount) => {
  const sequences = [
    { level: 5, name: "Friendless", required: 0, icon: "/images/5.png" },
    { level: 4, name: "NPC", required: 5, icon: "/images/4.png" },
    { level: 3, name: "Popular Kid", required: 20, icon: "/images/3.png" },
    { level: 2, name: "Celebrity", required: 50, icon: "/images/2.png" },
    { level: 1, name: "The FOOL", required: 100, icon: "/images/1.png" },
  ];

  // Find current sequence and calculate progress percentage
  let currentIndex = sequences.findIndex((seq) => friendCount < seq.required);
  if (currentIndex === -1) currentIndex = sequences.length - 1;

  // Calculate width percentage based on achieved sequences
  const totalWidth = sequences.length - 1;
  const achievedWidth = sequences.length - 1 - currentIndex;
  const progressPercentage = (achievedWidth / totalWidth) * 100;

  return `
    <div class="sequence-bar-container">
      <div class="scroll-hint scroll-left"><i class="uil uil-angle-left"></i></div>
      <div class="sequence-bar-wrapper">
        <div class="sequence-bar">
          <div class="sequence-progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="sequence-checkpoints">
          ${sequences
            .map(
              (seq, index) => `
            <div class="checkpoint ${index >= currentIndex ? "" : "reached"}">
              <div class="checkpoint-icon">
                <img src="${seq.icon}" alt="${seq.name}">
              </div>
              <div class="checkpoint-label">${seq.name}</div>
              <div class="sequence-tooltip">
                <div class="tooltip-icon">
                  <img src="${seq.icon}" alt="${seq.name}">
                </div>
                <h4>${seq.name}</h4>
                <div class="sequence-number">Sequence ${seq.level}</div>
                <p class="tooltip-text">${getSequenceDescription(seq.level)}</p>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      <div class="scroll-hint scroll-right"><i class="uil uil-angle-right"></i></div>
    </div>
  `;
};

// Show profile popup
const showProfilePopup = async (username) => {
  try {
    const response = await fetch(`/api/profiles/${username}`);
    const userData = await response.json();

    if (!response.ok) throw new Error("Failed to fetch user data");

    const { popup, overlay } = createProfilePopup();

    // Calculate sequence
    const friendCount = userData.friends?.length || 0;
    const sequence = getSequenceInfo(friendCount);
    const progress = (friendCount / sequence.max) * 100;

    // Update popup content
    popup.querySelector(".username").textContent = userData.username;
    popup.querySelector(".email").textContent = userData.email || "";
    popup.querySelector(".sequence-name").textContent = sequence.name;
    popup.querySelector(".friend-count").textContent = `${friendCount} friends`;
    popup.querySelector(".friends-count").textContent = friendCount;
    popup.querySelector(".posts-count").textContent =
      userData.posts?.length || 0;
    popup.querySelector(".interests-count").textContent =
      userData.interests?.length || 0;

    // Update progress bar and sequence icon
    const progressBar = popup.querySelector(".progress");
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    popup.querySelector(".sequence-icon").src = `/images/${sequence.level}.png`;

    // Display interests
    const interestsList = popup.querySelector(".interests-list");
    interestsList.innerHTML = `
      <h3>Interests</h3>
      <p>${userData.interests?.join(", ") || "No interests listed"}</p>
    `;

    popup.querySelector(".sequence-progress").innerHTML = `
      <div class="title">
        <h3>Current Sequence: <span class="sequence-name">${
          sequence.name
        }</span></h3>
        <span class="friend-count">${friendCount} friends</span>
      </div>
      ${createSequenceBar(friendCount)}
    `;

    // Add scroll functionality
    const container = popup.querySelector(".sequence-bar-container");
    const wrapper = popup.querySelector(".sequence-bar-wrapper");
    const scrollLeft = popup.querySelector(".scroll-left");
    const scrollRight = popup.querySelector(".scroll-right");

    scrollLeft.addEventListener("click", () => {
      container.scrollBy({ left: -100, behavior: "smooth" });
    });

    scrollRight.addEventListener("click", () => {
      container.scrollBy({ left: 100, behavior: "smooth" });
    });

    // Show tooltip on hover
    const checkpoints = popup.querySelectorAll(".checkpoint");
    checkpoints.forEach((checkpoint) => {
      checkpoint.addEventListener("mouseenter", () => {
        checkpoint.querySelector(".checkpoint-popup").style.visibility =
          "visible";
      });
      checkpoint.addEventListener("mouseleave", () => {
        checkpoint.querySelector(".checkpoint-popup").style.visibility =
          "hidden";
      });
    });

    // Show popup with animation
    requestAnimationFrame(() => {
      overlay.classList.add("active");
      popup.classList.add("active");
    });

    // Close popup handlers
    const closePopup = () => {
      popup.classList.remove("active");
      overlay.classList.remove("active");
      setTimeout(() => {
        popup.remove();
        overlay.remove();
      }, 300);
    };

    popup.querySelector(".close-popup").addEventListener("click", closePopup);
    overlay.addEventListener("click", closePopup);
  } catch (error) {
    console.error("Error showing profile popup:", error);
  }
};

// Add click handlers for usernames
document.addEventListener("click", (e) => {
  const username = e.target.closest(".post-user, #username");
  if (username) {
    showProfilePopup(username.textContent);
  }
});

// ============== SIDEBAR ==============
const toggleNotificationPopup = (item) => {
  const notificationsPopup = document.querySelector(".notifications-popup");
  const notificationCount = document.querySelector(
    "#notifications .notification-count"
  );

  if (item.id === "notifications") {
    notificationsPopup.style.display = "block";
    // notificationCount.style.display = "none";
  } else {
    notificationsPopup.style.display = "none";
  }
};

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    removeActiveClass(menuItems);
    addActiveClass(item);
    // toggleNotificationPopup(item);
  });
});

// ============== THEME MODAL ==============
const openThemeModal = () => (themeModal.style.display = "grid");
const closeThemeModal = (e) => {
  if (e.target.classList.contains("customize-theme")) {
    themeModal.style.display = "none";
  }
};

theme.addEventListener("click", openThemeModal);
themeModal.addEventListener("click", closeThemeModal);

// ============== FONT SIZE ==============
const updateFontSize = (size) => {
  const sizes = {
    "font-size-1": { fontSize: "10px", topLeft: "5.4rem", topRight: "5.4rem" },
    "font-size-2": { fontSize: "13px", topLeft: "5.4rem", topRight: "-7rem" },
    "font-size-3": { fontSize: "16px", topLeft: "-2rem", topRight: "-17rem" },
    "font-size-4": { fontSize: "19px", topLeft: "-5rem", topRight: "-25rem" },
    "font-size-5": { fontSize: "22px", topLeft: "-12rem", topRight: "-35rem" },
  };

  const { fontSize, topLeft, topRight } = sizes[size];
  root.style.setProperty("--sticky-top-left", topLeft);
  root.style.setProperty("--sticky-top-right", topRight);
  document.querySelector("html").style.fontSize = fontSize;
};

fontSizeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    removeActiveClass(fontSizeOptions);
    addActiveClass(option);
    updateFontSize(option.classList[0]);
  });
});

// ============== COLOR PALETTE ==============
const updatePrimaryColor = (colorClass) => {
  const hues = {
    "color-1": 252,
    "color-2": 52,
    "color-3": 352,
    "color-4": 152,
    "color-5": 202,
  };
  root.style.setProperty("--primary-color-hue", hues[colorClass]);
};

colorPalette.forEach((color) => {
  color.addEventListener("click", () => {
    removeActiveClass(colorPalette);
    addActiveClass(color);
    updatePrimaryColor(color.classList[0]);
  });
});

// ============== BACKGROUND COLORS ==============
const updateBackground = (bgConfig) => {
  root.style.setProperty("--light-color-lightness", bgConfig.light);
  root.style.setProperty("--white-color-lightness", bgConfig.white);
  root.style.setProperty("--dark-color-lightness", bgConfig.dark);
};

Bg1.addEventListener("click", () => {
  removeActiveClass([Bg2, Bg3]);
  addActiveClass(Bg1);
  window.location.reload(); // Reset customization
});

Bg2.addEventListener("click", () => {
  removeActiveClass([Bg1, Bg3]);
  addActiveClass(Bg2);
  updateBackground({ light: "15%", white: "20%", dark: "95%" });
});

Bg3.addEventListener("click", () => {
  removeActiveClass([Bg1, Bg2]);
  addActiveClass(Bg3);
  updateBackground({ light: "0%", white: "10%", dark: "95%" });
});

// ============== USER DATA ==============
const fetchUserProfile = async (username) => {
  try {
    const response = await fetch(`/api/profiles/${username}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("User profile data:", data);
      usernameElement.textContent = data.username;
    } else {
      console.error("Error fetching user profile:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
};

// Select the feeds container and Friends menu item
const feedsContainer = document.querySelector(".feeds");
const friendsMenuItem = document.querySelector("#friends");
const exploreMenuItem = document.querySelector("#explore");
const recommendedMenuItem = document.querySelector("#recommended");

// Function to fetch and display friends
const fetchAndDisplayFriends = async () => {
  try {
    const response = await fetch(`/api/profiles/${username}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok && data.friends && data.friends.length > 0) {
      feedsContainer.innerHTML = "";

      data.friends.forEach((friend) => {
        const feed = document.createElement("div");
        feed.classList.add("feed");

        const head = document.createElement("div");
        head.classList.add("head");

        const user = document.createElement("div");
        user.classList.add("user");

        const info = document.createElement("div");
        info.classList.add("info");

        const friendName = document.createElement("h3");
        friendName.textContent = friend;

        const removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-danger");
        removeButton.textContent = "Remove Friend";
        removeButton.addEventListener("click", () => removeFriend(friend));

        info.appendChild(friendName);
        user.appendChild(info);
        head.appendChild(user);
        feed.appendChild(head);
        feed.appendChild(removeButton);

        feedsContainer.appendChild(feed);
      });

      feedsContainer.style.overflowY = "auto";
      feedsContainer.style.maxHeight = "500px";
    } else if (data.friends && data.friends.length === 0) {
      feedsContainer.innerHTML = "<p>No friends to display</p>";
    } else {
      console.error("Error fetching friends:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
};

// Function to remove a friend
const removeFriend = async (friendUsername) => {
  try {
    const response = await fetch(`/api/friends/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, friendUsername }),
    });

    if (response.ok) {
      fetchAndDisplayFriends();
    } else {
      const data = await response.json();
      console.error("Error removing friend:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
};

// Function to add a friend
const addFriend = async (friendUsername) => {
  try {
    if (friendUsername === username) {
      alert("You cannot add yourself as a friend");
      return;
    }

    const response = await fetch("/api/friends/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username,
        friendUsername,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Friend added successfully!");
      // Refresh the current view based on active tab
      const activeTab = document.querySelector(".menu-item.active");
      if (activeTab.id === "explore") {
        await fetchAndDisplayUsers();
      } else if (activeTab.id === "recommended") {
        await fetchAndDisplayRecommendationsInFeed();
      }
      // Also refresh the recommendations sidebar
      await fetchAndDisplayRecommendations();
    } else {
      throw new Error(data.error || "Failed to add friend");
    }
  } catch (error) {
    console.error("Error adding friend:", error);
    alert(error.message || "Failed to add friend. Please try again.");
  }
};

// Function to fetch and display users in the explore tab
const fetchAndDisplayUsers = async () => {
  try {
    const response = await fetch("/api/profiles/profiles");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching users:", errorText);
      return;
    }

    const data = await response.json();

    if (data.length > 0) {
      feedsContainer.innerHTML = "";

      data.forEach((user) => {
        const feed = document.createElement("div");
        feed.classList.add("feed");

        const head = document.createElement("div");
        head.classList.add("head");

        const userDiv = document.createElement("div");
        userDiv.classList.add("user");

        const info = document.createElement("div");
        info.classList.add("info");

        const userName = document.createElement("h3");
        userName.textContent = user.username;

        const userInterests = document.createElement("small");
        userInterests.textContent = `Interests: ${user.interests.join(", ")}`;

        const addButton = document.createElement("button");
        addButton.classList.add("btn", "btn-primary");
        addButton.textContent = "Add Friend";
        addButton.dataset.username = user.username;

        if (user.friends.includes(username)) {
          addButton.disabled = true;
          const alreadyFriendIcon = document.createElement("i");
          alreadyFriendIcon.classList.add("uil", "uil-check-circle");
          info.appendChild(alreadyFriendIcon);
        } else {
          feed.appendChild(addButton);
        }

        info.appendChild(userName);
        info.appendChild(userInterests);
        userDiv.appendChild(info);
        head.appendChild(userDiv);
        feed.appendChild(head);

        feedsContainer.appendChild(feed);
      });

      feedsContainer.style.overflowY = "auto";
      feedsContainer.style.maxHeight = "500px";
    } else if (data.length === 0) {
      feedsContainer.innerHTML = "<p>No users to display</p>";
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
};
// Function to fetch and display friend recommendations in the feed container
const fetchAndDisplayRecommendationsInFeed = async () => {
  try {
    const response = await fetch(`/api/profiles/recommend/${username}`);
    const data = await response.json();

    if (response.ok) {
      feedsContainer.innerHTML = "";

      data.forEach((recommendation) => {
        const feed = document.createElement("div");
        feed.classList.add("feed");

        feed.innerHTML = `
          <div class="head">
            <div class="user">
              <div class="info">
                <h3>${recommendation.username}</h3>
                <div class="similarity-score">
                  <div class="score-bar" style="width: ${recommendation.score}%"></div>
                  <span>${recommendation.score}% Match</span>
                </div>
                <small>${recommendation.commonInterests} shared interests</small>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" data-username="${recommendation.username}">
            Add Friend
          </button>
        `;

        feedsContainer.appendChild(feed);
      });

      feedsContainer.style.overflowY = "auto";
      feedsContainer.style.maxHeight = "500px";
    }
  } catch (error) {
    console.error("Error fetching recommendations:", error);
  }
};

// Event delegation for dynamically added buttons
feedsContainer.addEventListener("click", async (event) => {
  if (
    event.target.classList.contains("btn-primary") &&
    event.target.dataset.username
  ) {
    event.preventDefault();
    const friendUsername = event.target.dataset.username;
    await addFriend(friendUsername);
  }
});

// Function to fetch and display friend recommendations
const fetchAndDisplayRecommendations = async () => {
  try {
    const response = await fetch(`/api/profiles/recommend/${username}`);
    const data = await response.json();

    if (response.ok) {
      const recommendationsContainer = document.getElementById(
        "recommendations-container"
      );
      recommendationsContainer.innerHTML = "";

      data.slice(0, 4).forEach((recommendation) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request");

        const infoDiv = document.createElement("div");
        infoDiv.classList.add("info");

        const nameDiv = document.createElement("div");
        const nameH5 = document.createElement("h5");
        nameH5.textContent = recommendation.username;
        const mutualFriendsP = document.createElement("p");
        mutualFriendsP.classList.add("text-muted");
        mutualFriendsP.textContent = `${recommendation.mutualFriends} mutual friends`;

        nameDiv.appendChild(nameH5);
        nameDiv.appendChild(mutualFriendsP);
        infoDiv.appendChild(nameDiv);

        const actionDiv = document.createElement("div");
        actionDiv.classList.add("action");
        const acceptButton = document.createElement("button");
        acceptButton.classList.add("btn", "btn-primary");
        acceptButton.textContent = "Add";
        acceptButton.addEventListener("click", () =>
          addFriend(recommendation.username)
        );

        actionDiv.appendChild(acceptButton);

        requestDiv.appendChild(infoDiv);
        requestDiv.appendChild(actionDiv);

        recommendationsContainer.appendChild(requestDiv);
      });
    } else {
      console.error("Error fetching recommendations:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
};

// Function to fetch and display friends of friends in sidebar
const fetchAndDisplayFriendsOfFriends = async () => {
  try {
    const response = await fetch(
      `/api/profiles/friends-of-friends/${username}`
    );
    const data = await response.json();

    if (response.ok) {
      const recommendationsContainer = document.getElementById(
        "recommendations-container"
      );
      recommendationsContainer.innerHTML = `
        <h4>People You Might Know</h4>
      `;

      data.forEach((recommendation) => {
        const requestDiv = document.createElement("div");
        requestDiv.classList.add("request");

        requestDiv.innerHTML = `
          <div class="info">
            <h5>${recommendation.username}</h5>
            <p class="text-muted">${recommendation.mutualFriends} mutual friends</p>
          </div>
          <div class="action">
            <button class="btn btn-primary" data-username="${recommendation.username}">Add Friend</button>
          </div>
        `;

        const addButton = requestDiv.querySelector(".btn");
        addButton.addEventListener("click", async () => {
          addButton.disabled = true;
          await addFriend(recommendation.username);
          fetchAndDisplayFriendsOfFriends(); // Refresh the list
        });

        recommendationsContainer.appendChild(requestDiv);
      });

      if (data.length === 0) {
        recommendationsContainer.innerHTML += `
          <div class="request">
            <p class="text-muted">No recommendations available</p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Error fetching friends of friends:", error);
  }
};

logOut.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(data.message);
      window.location.href = "/login";
    } else {
      console.error("Logout failed:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
  }
});

// Add this function near the top with other utility functions
const setUserOnline = async () => {
  try {
    await fetch("/api/games/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        status: "online",
        timestamp: Date.now(),
      }),
    });
  } catch (err) {
    console.error("Failed to set online status:", err);
  }
};

// Update the DOM Content Loaded event listener
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  if (username) {
    // Set user online immediately
    await setUserOnline();

    fetchUserProfile(username);
    fetchAndDisplayFriendsOfFriends();
    /* ...rest of existing initialization code... */
  }
});

// DOM Content Loaded Event Listener
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  const homeMenuItem = document.querySelector(".menu-item"); // Select first menu item (home)
  const gamesMenuItem = document.querySelector("#games");

  if (username) {
    fetchUserProfile(username);
    fetchAndDisplayFriendsOfFriends(); // Use this instead of fetchAndDisplayRecommendations

    // Initially mark home as active and display posts
    if (homeMenuItem) {
      addActiveClass(homeMenuItem);
      displayPosts();
    }

    // Add click handlers for all menu items
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        // Check if it's the games tab
        if (item.id === "games") {
          // Store current active state in session storage
          sessionStorage.setItem(
            "previousTab",
            document.querySelector(".menu-item.active").id
          );
          window.location.href = "/games.html";
          return; // Exit early to prevent other handlers
        }

        removeActiveClass(menuItems);
        addActiveClass(item);

        // Handle different tab clicks
        if (item === homeMenuItem) {
          displayPosts();
        } else if (item.id === "friends") {
          fetchAndDisplayFriends();
        } else if (item.id === "explore") {
          fetchAndDisplayUsers();
        } else if (item.id === "recommended") {
          fetchAndDisplayRecommendationsInFeed();
        }
      });
    });

    // Handle create post form
    const createPostForm = document.querySelector(".create-post");
    if (createPostForm) {
      createPostForm.addEventListener("submit", handleCreatePost);
    }
  } else {
    console.error("No username found in local storage.");
  }
});

// Remove the separate event listeners for menu items since they're now handled above
// Remove these lines:
// friendsMenuItem.addEventListener("click", fetchAndDisplayFriends);
// exploreMenuItem.addEventListener("click", fetchAndDisplayUsers);
// recommendedMenuItem.addEventListener("click", fetchAndDisplayRecommendationsInFeed);
// homeMenuItem.addEventListener("click", ...);

// Function to format date
const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Function to fetch all posts (user's and friends')
const fetchAllPosts = async () => {
  try {
    const userResponse = await fetch(`/api/posts/${username}/posts`);
    const userData = await userResponse.json();

    const profileResponse = await fetch(`/api/profiles/${username}`);
    const profileData = await profileResponse.json();

    let allPosts = [...userData];

    // Fetch friends' posts
    if (profileData.friends && profileData.friends.length > 0) {
      const friendsPosts = await Promise.all(
        profileData.friends.map((friend) =>
          fetch(`/api/posts/${friend}/posts`)
            .then((res) => res.json())
            .then((posts) =>
              posts.map((post) => ({ ...post, username: friend }))
            )
        )
      );
      allPosts = [
        ...allPosts.map((post) => ({ ...post, username })),
        ...friendsPosts.flat(),
      ];
    } else {
      allPosts = allPosts.map((post) => ({ ...post, username }));
    }

    // Sort posts by time (most recent first)
    return allPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

// Function to update like count
const updateLikeCount = async (postId, username, currentLikes) => {
  try {
    const response = await fetch(
      `/api/posts/${username}/posts/${postId}/like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to update like count");
    return await response.json();
  } catch (error) {
    console.error("Error updating like count:", error);
    return null;
  }
};

// Function to display posts in feed
const displayPosts = async () => {
  const posts = await fetchAllPosts();
  const feedsContainer = document.querySelector(".feeds");
  if (!feedsContainer) return;

  feedsContainer.innerHTML = "";

  posts.forEach((post) => {
    const postHtml = `
      <div class="feed">
        <div class="head">
          <div class="user">
            <div class="info">
              <h3 class="post-user">${post.username}</h3>
              <small class="post-time">${formatDate(post.time)}</small>
            </div>
          </div>
          <span class="edit">
            <i class="uil uil-ellipsis-h"></i>
          </span>
        </div>
        
        <div class="post-content">
          <p>${post.text}</p>
        </div>

        <div class="action-buttons">
          <div class="interaction-buttons">
            <button class="like-button ${
              post.liked ? "liked" : ""
            }" data-post-id="${post.id}" data-username="${post.username}">
              <i class="uil uil-heart"></i>
              <span>Like</span>
            </button>
            <div class="liked-by">
              <span class="like-count">${post.likes || 0} likes</span>
            </div>
          </div>
        </div>
      </div>
    `;

    feedsContainer.insertAdjacentHTML("beforeend", postHtml);
  });

  // Add event listeners for like buttons after they're added to the DOM
  document.querySelectorAll(".like-button").forEach((button) => {
    if (button) {
      button.addEventListener("click", handleLikeClick);
    }
  });
};

// Separate handler function for like button clicks
const handleLikeClick = async (e) => {
  const postId = e.currentTarget.dataset.postId;
  const postUsername = e.currentTarget.dataset.username;
  const likeCountElement = e.currentTarget
    .closest(".feed")
    .querySelector(".like-count");

  try {
    const result = await updateLikeCount(postId, postUsername);
    if (result) {
      likeCountElement.textContent = `${result.likes} likes`;
      e.currentTarget.classList.toggle("liked");

      // Add animation effect
      const heartIcon = e.currentTarget.querySelector("i");
      if (heartIcon) {
        heartIcon.style.transform = "scale(1.3)";
        setTimeout(() => {
          heartIcon.style.transform = "scale(1)";
        }, 200);
      }
    }
  } catch (error) {
    console.error("Error updating like count:", error);
  }
};

// Separate handler function for create post form
const handleCreatePost = async (event) => {
  event.preventDefault();

  const postInput = document.getElementById("create-post");
  if (!postInput) return;

  const postContent = postInput.value.trim();
  if (!postContent) {
    alert("Post content cannot be empty");
    return;
  }

  try {
    const response = await fetch(`/api/posts/${username}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ text: postContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create post");
    }

    const data = await response.json();
    alert("Post created successfully!");
    postInput.value = "";
    displayPosts(); // Refresh posts after creating new one
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Failed to create post. Please try again.");
  }
};
