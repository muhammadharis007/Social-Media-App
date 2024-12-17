// Password visibility toggle
const showHiddenPassword = (inputPassword, inputIcon) => {
  const input = document.getElementById(inputPassword),
    iconEye = document.getElementById(inputIcon);

  iconEye.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      iconEye.classList.add("ri-eye-line");
      iconEye.classList.remove("ri-eye-off-line");
    } else {
      input.type = "password";
      iconEye.classList.remove("ri-eye-line");
      iconEye.classList.add("ri-eye-off-line");
    }
  });
};

showHiddenPassword("password", "input-icon");

// Toggle between login and register modes
let isRegisterMode = false;
document.getElementById("toggleMode").addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;

  const formTitle = document.getElementById("formTitle");
  const formDescription = document.getElementById("formDescription");
  const registerFields = document.getElementById("registerFields");
  const interestsDiv = document.getElementById("interestsDiv");
  const toggleModeButton = document.getElementById("toggleMode");

  if (isRegisterMode) {
    formTitle.innerText = "Create Account";
    formDescription.innerText = "Register to get started.";
    registerFields.style.display = "block";
    interestsDiv.style.display = "block";
    toggleModeButton.innerText = "Log In";
  } else {
    formTitle.innerText = "Welcome Back";
    formDescription.innerText = "Please login to continue.";
    registerFields.style.display = "none";
    interestsDiv.style.display = "none";
    toggleModeButton.innerText = "Register";
  }
});

// Handle form submission
document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent page refresh

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const name = isRegisterMode
    ? document.getElementById("name").value.trim()
    : "";
  const email = isRegisterMode
    ? document.getElementById("email").value.trim()
    : "";
  const interests = isRegisterMode
    ? Array.from(document.querySelectorAll(".interest__item.selected")).map(
        (el) => el.getAttribute("data-interest")
      )
    : [];
  const errorMessage = document.getElementById("error-message");
  const interestError = document.getElementById("interestError");

  // Validate interests for registration
  if (isRegisterMode && interests.length < 3) {
    interestError.style.display = "block";
    return;
  } else {
    interestError.style.display = "none";
  }

  try {
    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    const body = isRegisterMode
      ? { username, password, name, email, interests }
      : { username, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok) {
      if (isRegisterMode) {
        alert("Registration successful! Please log in.");
        window.location.reload(); // Switch back to login mode
      } else {
        // Redirect to feed page on successful login
        window.location.href = "/feed.html";
      }
    } else {
      errorMessage.textContent = result.error || "An error occurred.";
    }
  } catch (error) {
    errorMessage.textContent =
      "An unexpected error occurred. Please try again.";
    console.error("Auth error:", error);
  }
});

// Handle interest selection for registration
document.querySelectorAll(".interest__item").forEach((item) => {
  item.addEventListener("click", () => {
    item.classList.toggle("selected");
  });
});
