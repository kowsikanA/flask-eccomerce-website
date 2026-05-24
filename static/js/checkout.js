

  const chatWidget = document.getElementById("chat-widget");
  const chatToggle = document.getElementById("chat-toggle");
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = "chat-message " + role;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
  }

  async function sendChat() {
    const text = (chatInput.value || "").trim();
    if (!text) return;

    appendMessage("user", text);
    chatInput.value = "";

    const thinkingEl = appendMessage("bot", "Thinking...");

    try {
      const resp = await fetch("/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!resp.ok) {
        thinkingEl.textContent = "Error: " + resp.status;
        return;
      }

      const data = await resp.json();
      thinkingEl.textContent = data.output || "(No response from model.)";
    } catch (err) {
      console.error(err);
      thinkingEl.textContent = "Network error. Please try again.";
    }
  }

  chatToggle.addEventListener("click", () => {
    chatWidget.classList.toggle("open");
  });

  chatSend.addEventListener("click", sendChat);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendChat();
    }
  });



  document.addEventListener("DOMContentLoaded", () => {
    // 1) Load subtotal from local storage into order summary
    const total = localStorage.getItem("cart_subtotal");
    const totalEl = document.getElementById("order-total");
    if (total && totalEl) {
      totalEl.textContent = `Order total: $${total}`;
    }

    // 2) Update auth link based on presence of token
    const authLink = document.getElementById("auth-link");
    const token = localStorage.getItem("access_token");

    if (authLink) {
      if (token) {
        authLink.textContent = "Sign Out";
        authLink.href = "#";
        authLink.onclick = function (e) {
          e.preventDefault();
          localStorage.removeItem("access_token");
          window.location.href = "{{ url_for('login') }}";
        };
      } else {
        authLink.textContent = "Sign In";
        authLink.href = "{{ url_for('login') }}";
      }
    }

    // 3) Stripe checkout handler
    const payBtn = document.querySelector(".payment-btn");
    if (!payBtn) return;

    payBtn.addEventListener("click", async () => {
      const storedToken = localStorage.getItem("access_token");
      if (!storedToken) {
        alert("You must be logged in to checkout.");
        window.location.href = "{{ url_for('login') }}";
        return;
      }

      const name = document.getElementById("cardholder").value.trim();
      const number = document.getElementById("cardNumber").value.trim();
      const expiry = document.getElementById("expiryDate").value.trim();
      const cvv = document.getElementById("cvv").value.trim();

      if (!name || !number || !expiry || !cvv) {
        alert("Please fill in all card details.");
        return;
      }

      // Basic front-end validation for mock card details
      if (number.length < 12 || cvv.length < 3) {
        alert("Please enter a valid mock card number and CVV.");
        return;
      }

      try {
        const resp = await fetch("/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + storedToken,
          },
        });

        const data = await resp.json();

        if (!resp.ok) {
          alert(data.error || "Failed to start payment.");
          return;
        }

        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } catch (err) {
        console.error(err);
        alert("Network error starting checkout.");
      }
    });
  });

