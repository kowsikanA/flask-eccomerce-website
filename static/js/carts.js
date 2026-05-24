
  
function handleLogout() {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
}

function getUserData(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const email = payload.sub || payload.identity || "";
    return {
      email,
      initial: email.charAt(0).toUpperCase() || "U"
    };
  } catch {
    return { email: "User", initial: "U" };
  }
}

function getAvatarColor(letter) {
  const colors = [
    "#2BD1F0",
    "#4F46E5",
    "#16A34A",
    "#F97316",
    "#9333EA",
    "#DC2626",
    "#0284C7"
  ];
  return colors[letter.charCodeAt(0) % colors.length];
}

function updateAuthUI() {
  const authLink = document.getElementById("auth-link");
  const dropdown = document.getElementById("user-dropdown");
  const dropdownAvatar = document.getElementById("dropdown-avatar");
  const dropdownEmail = document.getElementById("dropdown-email");

  const token = localStorage.getItem("access_token");

  if (!token) {
    authLink.textContent = "Sign In";
    authLink.href = "/login";
    authLink.classList.remove("user-avatar");
    dropdown.classList.add("hidden");
    return;
  }

  const user = getUserData(token);

  // avatar circle
  authLink.textContent = user.initial;
  authLink.href = "#";
  authLink.classList.add("user-avatar");
  authLink.style.backgroundColor = getAvatarColor(user.initial);

  // dropdown info
  dropdownAvatar.textContent = user.initial;
  dropdownAvatar.style.backgroundColor = getAvatarColor(user.initial);
  dropdownEmail.textContent = user.email;

  // toggle dropdown
  authLink.onclick = (e) => {
    e.preventDefault();
    dropdown.classList.toggle("hidden");
  };
}

// logout click
document.addEventListener("click", (e) => {
  if (e.target.id === "logout-btn") {
    handleLogout();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "account-btn") {
    window.location.href = "/account";
  }
});

// click outside closes dropdown
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown");
  const authLink = document.getElementById("auth-link");

  if (!dropdown || !authLink) return;

  if (!authLink.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

document.addEventListener("DOMContentLoaded", updateAuthUI);

  
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
  

  
    let subtotal = 0.0;
    const subTotalEl = document.querySelector(".subtotal");
    const subTotalTotalEl = document.querySelector(".subtotal-total");
    const cartBody = document.getElementById("cart-body");
    const emptyCartEl = document.getElementById("empty-cart");
    const cartCountText = document.getElementById("cart-count-text");

    function updateSubtotalDisplay() {
      subTotalEl.textContent = `$${subtotal.toFixed(2)}`;
      subTotalTotalEl.textContent = `$${subtotal.toFixed(2)}`;
      localStorage.setItem("cart_subtotal", subtotal.toFixed(2));
    }

    async function loadCart() {
      const token = localStorage.getItem("access_token");
      subtotal = 0;

      if (!token) {
        cartCountText.textContent = "Please sign in to view your cart.";
        emptyCartEl.classList.remove("hidden");
        updateSubtotalDisplay();
        return;
      }

      try {
        const resp = await fetch("/api/cart", {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + token,
          },
        });

        if (!resp.ok) {
          console.error("Failed to load cart", resp.status);
          cartCountText.textContent = "Could not load your cart.";
          return;
        }

        const cartData = await resp.json();
        cartBody.innerHTML = "";

        if (!cartData || cartData.length === 0) {
          emptyCartEl.classList.remove("hidden");
          cartCountText.textContent = "0 items in your cart";
          updateSubtotalDisplay();
          return;
        }

        emptyCartEl.classList.add("hidden");
        cartCountText.textContent = `${cartData.length} item(s) in your cart`;

        for (const item of cartData) {
          const productResp = await fetch(`https://dummyjson.com/products/${item.product_id}`);
          const product = await productResp.json();

          const productImage = product.thumbnail;
          const productPrice = product.price;
          const totalCost = (productPrice * item.quantity).toFixed(2);
          subtotal += parseFloat(totalCost);

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>
              <div class="cart-product">
                <img src="${productImage}" alt="${product.title}">
                <div>
                  <h3>${product.title}</h3>
                  <p>${product.category ? product.category.replaceAll("-", " ") : "Product"}</p>
                </div>
              </div>
            </td>
            <td>
              <span class="quantity-pill">${item.quantity}</span>
            </td>
            <td>$${productPrice}</td>
            <td class="row-total">$${totalCost}</td>
            <td>
              <button class="delete-btn" data-cart-id="${item.id}">
                Remove
              </button>
            </td>
          `;

          cartBody.appendChild(row);
        }

        updateSubtotalDisplay();
      } catch (err) {
        console.error("Error loading cart:", err);
        cartCountText.textContent = "Error loading cart.";
      }
    }

    document.querySelector(".carts-table").addEventListener("click", async (e) => {
      if (!e.target.classList.contains("delete-btn")) return;

      const btn = e.target;
      const cartId = btn.dataset.cartId;
      const token = localStorage.getItem("access_token");

      if (!token) {
        showNotification("You must be signed in to modify your cart.", "error");
        return;
      }

      const confirmDelete = confirm("Remove this item from your cart?");
      if (!confirmDelete) return;

      try {
        const resp = await fetch(`/api/cart/${cartId}`, {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer " + token,
          },
        });

        await resp.json().catch(() => ({}));

        if (!resp.ok) {
          showNotification("Could not delete this item.", "error");
          return;
        }

        const row = btn.closest("tr");
        const totalCell = row.querySelector(".row-total");

        if (totalCell) {
          const value = parseFloat(totalCell.textContent.replace("$", "")) || 0;
          subtotal -= value;
          if (subtotal < 0) subtotal = 0;
          updateSubtotalDisplay();
        }

        row.remove();

        const remainingRows = cartBody.querySelectorAll("tr").length;
        cartCountText.textContent = `${remainingRows} item(s) in your cart`;

        if (remainingRows === 0) {
          emptyCartEl.classList.remove("hidden");
        }

        showNotification("Item removed from cart.", "success");
      } catch (err) {
        console.error("Error deleting cart item:", err);
        showNotification("Network error. Please try again.", "error");
      }
    });

    document.getElementById("checkout-btn").addEventListener("click", async () => {
      if (subtotal <= 0) {
        showNotification("Your cart is empty.", "error");
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        showNotification("You must be signed in to checkout.", "error");
        window.location.href = "{{ url_for('login') }}";
        return;
      }

      try {
        const resp = await fetch("/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
          },
        });

        const data = await resp.json();

        if (!resp.ok) {
          showNotification("Failed to start payment.", "error");
          return;
        }

        window.location.href = data.checkout_url;
      } catch (err) {
        console.error(err);
        showNotification("Network error starting checkout.", "error");
      }
    });

    window.addEventListener("DOMContentLoaded", loadCart);
  

  
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
  