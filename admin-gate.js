const gateStatusNote = document.getElementById("gateStatusNote");
const googleLoginWrap = document.getElementById("googleLoginWrap");

function setGateStatus(text, isError = false) {
  if (!gateStatusNote) return;
  gateStatusNote.textContent = text;
  gateStatusNote.classList.toggle("error", isError);
}

async function gateApi(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function handleGoogleCredential(response) {
  try {
    setGateStatus("Verifying Gmail...");
    const res = await gateApi("/api/admin/google-auth", {
      method: "POST",
      body: JSON.stringify({ idToken: response.credential })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGateStatus(data.error || "Google verification failed.", true);
      return;
    }

    setGateStatus("Verified. Redirecting to admin login...");
    window.location.href = "/admin/login";
  } catch {
    setGateStatus("Network issue during verification.", true);
  }
}

async function initGate() {
  const existing = await gateApi("/api/admin/gate-session");
  if (existing.ok) {
    const data = await existing.json();
    if (data.verified) {
      window.location.href = "/admin/login";
      return;
    }
  }

  const configRes = await gateApi("/api/admin/google-config");
  if (!configRes.ok) {
    setGateStatus("Google config load failed on server.", true);
    return;
  }

  const config = await configRes.json();
  if (!config.configured || !config.clientId) {
    setGateStatus("Server Google auth configured nahi hai. Developer setup required.", true);
    return;
  }

  if (!window.google?.accounts?.id) {
    setGateStatus("Google SDK load failed.", true);
    return;
  }

  window.google.accounts.id.initialize({
    client_id: config.clientId,
    callback: handleGoogleCredential
  });

  window.google.accounts.id.renderButton(googleLoginWrap, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width: Math.min(window.innerWidth - 60, 360)
  });

  setGateStatus("Use allowed Gmail to continue.");
}

initGate();
