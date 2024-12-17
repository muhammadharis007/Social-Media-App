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

// User Data Elements
const usernameElement = document.getElementById("username");
const profilePicElement = document.getElementById("pfp");

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
    notificationCount.style.display = "none";
  } else {
    notificationsPopup.style.display = "none";
  }
};

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    removeActiveClass(menuItems);
    addActiveClass(item);
    toggleNotificationPopup(item);
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
const fetchUserData = async () => {
  try {
    const response = await fetch("/api/profiles/me");

    const data = await response.json();
    if (data.username) {
      usernameElement.textContent = data.username;
    }
    if (data.pfp) {
      profilePicElement.src = data.pfp;
    }
  } catch (error) {
    const response = await fetch("/api/profiles/me");
    console.log(await response.json());
    console.error("Error fetching user data:", error);
  }
};

document.addEventListener("DOMContentLoaded", fetchUserData);
