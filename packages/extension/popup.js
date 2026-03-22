const API_URL = "https://api-production-449f.up.railway.app";

// DOM
const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loginForm = document.getElementById("login-form");
const storeForm = document.getElementById("store-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const loginBtn = document.getElementById("login-btn");
const loginSubtitle = document.getElementById("login-subtitle");
const toggleMode = document.getElementById("toggle-mode");
const serviceName = document.getElementById("service-name");
const apiKey = document.getElementById("api-key");
// storeError removed — all alerts show on the button
const storeBtn = document.getElementById("store-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");

let token = null;
let email = null;
let isRegisterMode = false;

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
  resetStoreBtn();
  userInfo.textContent = email;
  serviceName.value = "";
  apiKey.value = "";
  setTimeout(() => serviceName.focus(), 50);
}

// Toggle login ↔ register
toggleMode.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  loginBtn.textContent = isRegisterMode ? "Create Account" : "Sign In";
  loginSubtitle.textContent = isRegisterMode ? "Create an account to store keys" : "Sign in to store keys";
  toggleMode.textContent = isRegisterMode ? "Already have an account?" : "Create an account";
  loginError.classList.add("hidden");
});

// Login / Register
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = isRegisterMode ? "Creating..." : "Signing in...";

  const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
      }),
    });

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      loginError.textContent = data.error || `Authentication failed (${res.status})`;
      loginError.classList.remove("hidden");
      return;
    }

    token = data.token;
    email = data.user.email;

    await chrome.storage.local.set({ locker_token: token, locker_email: email });
    showMainView();
  } catch {
    loginError.textContent = "Cannot connect to Locker API";
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = isRegisterMode ? "Create Account" : "Sign In";
  }
});

// Helper: reset button to default
function resetStoreBtn() {
  storeBtn.disabled = false;
  storeBtn.textContent = "Store Key";
  storeBtn.classList.remove("success-state", "error-state");
}

// Helper: show error on the button, auto-reset after 3s
function showBtnError(msg) {
  storeBtn.textContent = msg;
  storeBtn.classList.remove("success-state");
  storeBtn.classList.add("error-state");
  storeBtn.disabled = true;
  setTimeout(resetStoreBtn, 3000);
}

// Store key
storeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetStoreBtn();
  storeBtn.disabled = true;
  storeBtn.textContent = "Storing...";

  const name = serviceName.value.trim().toLowerCase();
  const key = apiKey.value;

  if (!name || !key) {
    showBtnError("Both fields required");
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
      await chrome.storage.local.remove(["locker_token", "locker_email"]);
      token = null;
      email = null;
      showLoginView();
      loginError.textContent = "Session expired";
      loginError.classList.remove("hidden");
      return;
    }

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
      const msg = data.error || "Failed";
      showBtnError(msg.length > 45 ? msg.slice(0, 45) + "…" : msg);
      return;
    }

    // Success
    storeBtn.textContent = `\u2713 Stored: ${name}`;
    storeBtn.classList.add("success-state");
    storeBtn.disabled = true;
    serviceName.value = "";
    apiKey.value = "";
    setTimeout(() => window.close(), 1500);
  } catch {
    showBtnError("Connection failed");
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
  await chrome.storage.local.remove(["locker_token", "locker_email"]);
  token = null;
  email = null;
  showLoginView();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.close();
});

init();
