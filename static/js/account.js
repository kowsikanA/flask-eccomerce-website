
    function getUserData(token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload.sub || payload.identity || payload.email || "";
        const name = payload.name || "";
        const phone = payload.phone_number || payload.phone || "";

        return {
          email,
          name,
          phone,
          initial: email.charAt(0).toUpperCase() || "U"
        };
      } catch {
        return { email: "User", name: "", phone: "", initial: "U" };
      }
    }

    function getAvatarColor(letter) {
      const colors = ["#2BD1F0", "#4F46E5", "#16A34A", "#F97316", "#9333EA", "#DC2626", "#0284C7"];
      return colors[letter.charCodeAt(0) % colors.length];
    }

    async function loadAccount() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  const basicUser = getUserData(token);

  // avatar
  const avatar = document.getElementById("account-avatar");
  avatar.textContent = basicUser.initial;
  avatar.style.backgroundColor = getAvatarColor(basicUser.initial);

  try {
    const res = await fetch("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await res.json();

    document.getElementById("account-email").textContent = user.email || "User";
    document.getElementById("info-email").textContent = user.email || "Not available";
    document.getElementById("info-phone").textContent = user.phone_number || "Not available";

  } catch (err) {
    console.error(err);
  }
}

    function logout() {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }

    loadAccount();
  