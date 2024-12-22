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
    const response = await fetch(
      `/api/profiles/${username}/friends/${friendUsername}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

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
    const response = await fetch(
      `/api/profiles/${username}/friends/${friendUsername}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.ok) {
      fetchAndDisplayUsers();
    } else {
      const data = await response.json();
      console.error("Error adding friend:", data.error);
    }
  } catch (error) {
    console.error("Network or server error:", error);
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
        addButton.addEventListener("click", () => addFriend(user.username));

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

friendsMenuItem.addEventListener("click", fetchAndDisplayFriends);
exploreMenuItem.addEventListener("click", fetchAndDisplayUsers);

document.addEventListener("DOMContentLoaded", () => {
  if (username) {
    fetchUserProfile(username);
  } else {
    console.error("No username found in local storage.");
  }
});
