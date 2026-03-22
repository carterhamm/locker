const API_URL = "https://api-production-449f.up.railway.app";

// DOM elements
const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loginForm = document.getElementById("login-form");
const storeForm = document.getElementById("store-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const loginBtn = document.getElementById("login-btn");
const serviceName = document.getElementById("service-name");
const apiKey = document.getElementById("api-key");
const storeError = document.getElementById("store-error");
const storeSuccess = document.getElementById("store-success");
const storeBtn = document.getElementById("store-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

// State
let token = null;
let email = null;

// Init — check if already logged in
async function init() {
  const stored = await chrome.storage.local.get(["locker_token", "locker_email"]);
  if (stored.locker_token && stored.locker_email) {
    token = stored.locker_token;
    email = stored.locker_email;
    showMainView();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  loginView.classList.remove("hidden");
  mainView.classList.add("hidden");
  loginError.classList.add("hidden");
  setTimeout(() => loginEmail.focus(), 50);
}

function showMainView() {
  loginView.classList.add("hidden");
  mainView.classList.remove("hidden");
  storeError.classList.add("hidden");
  storeSuccess.classList.add("hidden");
  userInfo.textContent = email;
  // Clear fields and focus service name
  serviceName.value = "";
  apiKey.value = "";
  setTimeout(() => serviceName.focus(), 50);
}

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || "Login failed";
      loginError.classList.remove("hidden");
      return;
    }

    token = data.token;
    email = data.user.email;

    await chrome.storage.local.set({
      locker_token: token,
      locker_email: email,
    });

    showMainView();
  } catch (err) {
    loginError.textContent = "Cannot connect to Locker API";
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

// Store key
storeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  storeError.classList.add("hidden");
  storeSuccess.classList.add("hidden");
  storeBtn.disabled = true;
  storeBtn.textContent = "Storing...";

  const name = serviceName.value.trim().toLowerCase();
  const key = apiKey.value;

  if (!name || !key) {
    storeError.textContent = "Both fields are required";
    storeError.classList.remove("hidden");
    storeBtn.disabled = false;
    storeBtn.textContent = "Store Key";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ service: name, key }),
    });

    if (res.status === 401) {
      // Token expired — force re-login
      await chrome.storage.local.remove(["locker_token", "locker_email"]);
      token = null;
      email = null;
      showLoginView();
      loginError.textContent = "Session expired. Please sign in again.";
      loginError.classList.remove("hidden");
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      storeError.textContent = data.error || "Failed to store key";
      storeError.classList.remove("hidden");
      return;
    }

    storeSuccess.textContent = `Key stored for ${name}`;
    storeSuccess.classList.remove("hidden");
    serviceName.value = "";
    apiKey.value = "";

    // Auto-close after 1.5s
    setTimeout(() => window.close(), 1500);
  } catch (err) {
    storeError.textContent = "Cannot connect to Locker API";
    storeError.classList.remove("hidden");
  } finally {
    storeBtn.disabled = false;
    storeBtn.textContent = "Store Key";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["locker_token", "locker_email"]);
  token = null;
  email = null;
  showLoginView();
});

// Keyboard shortcut: Esc closes popup
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.close();
});

init();
