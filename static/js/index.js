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

 let selectedProduct = null;
    let allProducts = [];
    let filteredProducts = [];
    let activeCategory = "smartphone";

    let visibleCount = 4;
    const PRODUCTS_PER_LOAD = 4;

    function renderProducts(products) {
      const productListDiv = document.getElementById("product-list");
      productListDiv.innerHTML = "";

      const visible = products.slice(0, visibleCount);

      if (visible.length === 0) {
        productListDiv.innerHTML =
          "<p style='color:#64748b; text-align:center;'>No products found.</p>";
        updateLoadMore(products);
        return;
      }

      visible.forEach(product => {
        const div = document.createElement("div");
        div.className = "product";

        div.innerHTML = `
      <img src="${product.thumbnail}" class="product-image">
      <p class="product-name">${product.title}</p>
      <p class="product-category">${product.category}</p>
      <h3 class="product-price">$${product.price}</h3>
    `;

        div.onclick = () => openProductModal(product);
        productListDiv.appendChild(div);
      });

      updateLoadMore(products);
    }

    function updateLoadMore(products) {
  const btn = document.getElementById("view-more-btn");

  if (!btn) return;

  // current category/search
  const query =
  activeCategory || document.getElementById("product-search").value || "products";

  btn.href = `/search?query=${encodeURIComponent(query)}`;

  // hide button if few products
  if (products.length <= PRODUCTS_PER_LOAD) {
    btn.style.display = "none";
  } else {
    btn.style.display = "inline-block";
  }
}

    function applyFilters() {
      let filtered = [...allProducts];

      filtered = filtered.filter(p => p.category === activeCategory);

      const query = document.getElementById("product-search").value.toLowerCase();

      if (query) {
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }

      filteredProducts = filtered;
      visibleCount = PRODUCTS_PER_LOAD;
      renderProducts(filteredProducts);
    }

    async function fetchProducts() {
      const res = await fetch(
        "https://dummyjson.com/products?limit=0&select=id,title,price,thumbnail,category,description"
      );
      const data = await res.json();

      allProducts = data.products;
      filteredProducts = allProducts;

      renderProducts(filteredProducts);
    }

   
    // CATEGORY FILTER
    document.querySelectorAll(".category-pill").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".category-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        activeCategory = btn.dataset.category;
        applyFilters();
      };
    });

    // SEARCH
    document.getElementById("product-search").addEventListener("input", applyFilters);

    // MODAL
    function openProductModal(product) {
      selectedProduct = product;

      document.getElementById("modal-image").src = product.thumbnail;
      document.getElementById("modal-title").textContent = product.title;
      document.getElementById("modal-category").textContent = product.category;
      document.getElementById("modal-price").textContent = "$" + product.price;
      document.getElementById("modal-description").textContent = product.description;

      document.getElementById("product-modal").classList.remove("hidden");
    }

    document.getElementById("modal-close").onclick = () => {
      document.getElementById("product-modal").classList.add("hidden");
    };

    // ✅ FIXED: View Details routing
    document.getElementById("modal-view-details").onclick = () => {
      if (!selectedProduct) return;

      // store product for next page
      localStorage.setItem("selectedProductId", selectedProduct.id);

      // redirect
      window.location.href = "/productDetails";
    };

    document.getElementById("modal-add-to-cart").onclick = async () => {
      if (!selectedProduct) return;

      const token = localStorage.getItem("access_token");

      if (!token) {
        showNotification("Please sign in before adding items to your cart.", "error");

        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return;
      }

      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: selectedProduct.id,
            name: selectedProduct.title,
            price: selectedProduct.price,
            image_url: selectedProduct.thumbnail,
            description: selectedProduct.description,
            quantity: 1,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showNotification(data.error || "Could not add item to cart.", "error");
          return;
        }

        showNotification(`Added "${selectedProduct.title}" to your cart.`, "success");

        document.getElementById("product-modal").classList.add("hidden");

      } catch (err) {
        console.error(err);
        showNotification("Network error. Please try again.", "error");
      }
    };

    fetchProducts();
const chatWidget = document.getElementById("chat-widget");
  const chatToggle = document.getElementById("chat-toggle");
  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  function appendMessage(role, text) {
    const msg = document.createElement("div");

    msg.className = "chat-message " + role;

    // IMPORTANT:
    // Use innerHTML so clickable links render properly
    msg.innerHTML = text;

    // Open links in new tab automatically
    const links = msg.querySelectorAll("a");

    links.forEach(link => {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      // optional styling
      link.style.color = "#fff";
      link.style.textDecoration = "underline";
      link.style.wordBreak = "break-all";
    });

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
        body: JSON.stringify({
          prompt: text,
        }),
      });

      if (!resp.ok) {
        thinkingEl.innerHTML = "Error: " + resp.status;
        return;
      }

      const data = await resp.json();

      thinkingEl.innerHTML =
        data.output || "(No response from model.)";

      // make returned links clickable
      const links = thinkingEl.querySelectorAll("a");

      links.forEach(link => {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");

        link.style.color = "#fff";
        link.style.textDecoration = "underline";
        link.style.wordBreak = "break-all";
      });

    } catch (err) {
      console.error(err);

      thinkingEl.innerHTML =
        "Network error. Please try again.";
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