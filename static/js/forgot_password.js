 const notificationEl = document.getElementById("notification");
    let notificationTimeout;

    function showNotification(message, type = "success", duration = 3000) {
      if (!notificationEl) return;

      notificationEl.className = "notification";
      notificationEl.textContent = message;

      if (type === "success") {
        notificationEl.classList.add("notification-success");
      } else if (type === "error") {
        notificationEl.classList.add("notification-error");
      }

      notificationEl.classList.add("show");

      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }

      notificationTimeout = setTimeout(() => {
        notificationEl.classList.remove("show");
      }, duration);
    }

    notificationEl?.addEventListener("click", () => {
      notificationEl.classList.remove("show");
    });

    async function resetPassword() {
      const email = document.getElementById("fp-email").value;
      const answer = document.getElementById("fp-answer").value;
      const newPassword = document.getElementById("fp-new-password").value;
      const confirmPassword = document.getElementById("fp-confirm-password").value;

      try {
        const res = await fetch("/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            security_answer: answer,
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });

        const data = await res.json();

        if (!res.ok) {
          showNotification(data.error || "Could not reset password.", "error");
          return;
        }

        showNotification(data.message || "Password updated!", "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } catch (err) {
        console.error(err);
        showNotification("Network error. Please try again.", "error");
      }
    }