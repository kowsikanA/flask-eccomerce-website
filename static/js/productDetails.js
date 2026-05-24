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

const accordian = document.getElementsByClassName("accordion");
  let i;

  for (i = 0; i < accordian.length; i++) {
    accordian[i].addEventListener("click", function () {
      this.classList.toggle("active");
      const panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }

   async function fetchRelatedProducts(tag) {
    const container = document.querySelector(".related-products .products");
    container.innerHTML = "";

    if (!tag) return;

    try {
      const res = await fetch(
        `https://dummyjson.com/products/category/${encodeURIComponent(tag)}`
      );

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const data = await res.json();
      const products = data.products || [];

      if (products.length === 0) {
        container.innerHTML = "<p>No related products found.</p>";
        return;
      }

      const firstFourProducts = products.slice(0, 4);

      firstFourProducts.forEach((prod) => {
        const card = document.createElement("div");
        card.className = "related-product-card";

        card.innerHTML = `
          <img src="${prod.thumbnail}" alt="${prod.title}" class="related-product-img" />
          <h4 class="related-product-title">${prod.title}</h4>
          <p class="related-product-price">$${prod.price}</p>
        `;

        card.addEventListener("click", () => {
          localStorage.setItem("selectedProductId", prod.id);
          window.location.href = "/productDetails";
        });

        container.appendChild(card);
      });

      if (products.length > 4) {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "view-more-wrapper";

        buttonWrapper.innerHTML = `
          <a href="/search?query=${encodeURIComponent(tag)}" class="view-more-btn">
            View More Products
          </a>
        `;

        document.querySelector(".related-products").appendChild(buttonWrapper);
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Failed to load related products.</p>";
    }
  }
 let currentProduct = null;
  const largeImage = document.querySelector(".largeImage");
  const imageGallery = document.querySelector(".imageGallery");

  async function getData() {
    const productId = localStorage.getItem("selectedProductId");
    if (!productId) {
      console.error("No product ID found in localStorage");
      return;
    }

    const url = `https://dummyjson.com/products/${productId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Response status ${res.status}`);
      }

      currentProduct = await res.json();

      const mainImg = document.createElement("img");
      mainImg.className = "main-img";
      mainImg.src = currentProduct.thumbnail;
      largeImage.innerHTML = "";
      largeImage.append(mainImg);

      const imagesArray = currentProduct.images;
      imagesArray.forEach((smallImage) => {
        const viewImg = document.createElement("img");
        viewImg.src = smallImage;
        viewImg.className = "viewImg";
        imageGallery.append(viewImg);

        viewImg.onclick = function () {
          mainImg.src = viewImg.src;
        };
      });

      document.querySelector(".product-title").textContent = currentProduct.title;
      document.querySelector(".product-cost").textContent = `$${currentProduct.price}`;
      document.querySelector(".product-brand").textContent = `Brand: ${currentProduct.brand}`;
      document.querySelector(".description").textContent = currentProduct.description;

      const starContainer = document.querySelector(".star-rating");
      const ratingValue = currentProduct.rating;

      starContainer.innerHTML = "";

      const starsDiv = generateStars(ratingValue);
      while (starsDiv.firstChild) {
        starContainer.appendChild(starsDiv.firstChild);
      }

      const ratingText = document.createElement("span");
      ratingText.textContent = `${ratingValue.toFixed(1)} / 5`;
      starContainer.appendChild(ratingText);

      const availabilityStatus = document.querySelector(".availability");
      const statusValue = currentProduct.availabilityStatus
        ? currentProduct.availabilityStatus.trim()
        : "Unknown";

      availabilityStatus.innerHTML = `Availability Status: <span>${statusValue}</span>`;
      const span = availabilityStatus.querySelector("span");
      span.style.fontWeight = "bold";

      const statusLower = statusValue.toLowerCase();
      if (statusLower === "low stock") {
        span.style.color = "orange";
      } else if (statusLower === "out of stock" || statusLower === "unavailable") {
        span.style.color = "red";
      } else if (statusLower === "in stock" || statusLower === "available") {
        span.style.color = "green";
      } else {
        span.style.color = "gray";
      }

      const specsTable = document.querySelector(".product-specs table");
      const possibleSources = [
        currentProduct.category,
        currentProduct.dimensions,
        currentProduct.details,
        currentProduct.warrantyInformation,
        currentProduct.returnPolicy,
      ];

      let mergedEntries = [];
      possibleSources.forEach((source) => {
        if (!source) return;

        if (typeof source === "object" && !Array.isArray(source)) {
          mergedEntries.push(...Object.entries(source));
        } else if (Array.isArray(source)) {
          source.forEach((item) => {
            if (item.key && item.value) {
              mergedEntries.push([item.key, item.value]);
            }
          });
        } else if (typeof source === "string") {
          mergedEntries.push(["Category", source]);
        }
      });

      mergedEntries = mergedEntries.filter(
        (v, i, arr) => arr.findIndex((t) => t[0] === v[0]) === i
      );

      specsTable.innerHTML = "";

      if (mergedEntries.length === 0) {
        specsTable.innerHTML = `<tr><td>No specifications available</td></tr>`;
      } else {
        specsTable.innerHTML = `
          <tr>
            <th>Specification</th>
            <th>Details</th>
          </tr>
        `;

        mergedEntries.forEach(([key, value]) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${key}</td><td>${value}</td>`;
          specsTable.appendChild(tr);
        });
      }

      if (currentProduct && currentProduct.category) {
        fetchRelatedProducts(currentProduct.category);
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  getData();

  const addQ = document.querySelector(".add-q");
  const quantityDisplay = document.querySelector(".quantity");
  const subtractQ = document.querySelector(".subtract-q");

  let quantity = 1;
  quantityDisplay.textContent = quantity;

  addQ.addEventListener("click", () => {
    quantity++;
    quantityDisplay.textContent = quantity;
  });

  subtractQ.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      quantityDisplay.textContent = quantity;
    }
  });

  const modalAddToCartBtn = document.querySelector(".cart-btn");

  modalAddToCartBtn.addEventListener("click", async () => {
    if (!currentProduct) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      showNotification("Please sign in before adding items to your cart.", "error");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
          product_id: currentProduct.id,
          name: currentProduct.title,
          price: currentProduct.price,
          image_url: currentProduct.thumbnail,
          description: currentProduct.description,
          quantity: quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Could not add this product to your cart.";
        showNotification(message, "error");
        return;
      }

      showNotification(`Added "${currentProduct.title}" to your cart.`, "success");
    } catch (err) {
      console.error(err);
      showNotification(
        "We ran into a network error. Please try again in a moment.",
        "error"
      );
    }
  });

   function generateStars(rating) {
    const starDiv = document.createElement("div");
    starDiv.className = "star-rating";

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      const star = document.createElement("i");
      star.className = "fa fa-star";
      starDiv.appendChild(star);
    }

    if (hasHalfStar) {
      const halfStar = document.createElement("i");
      halfStar.className = "fa fa-star-half-o";
      starDiv.appendChild(halfStar);
    }

    for (let i = 0; i < emptyStars; i++) {
      const star = document.createElement("i");
      star.className = "fa fa-star-o";
      starDiv.appendChild(star);
    }

    return starDiv;
  }

  async function fetchReviews() {
    const productId = localStorage.getItem("selectedProductId");
    if (!productId) return;

    const url = `https://dummyjson.com/products/${productId}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Response status ${res.status}`);
      }

      const data = await res.json();
      const apiReviews = data.reviews || [];

      const savedReviews =
        JSON.parse(localStorage.getItem(`reviews_${productId}`)) || [];

      const reviews = [...apiReviews, ...savedReviews];

      const ratingContainer = document.getElementById("reviews-container");
      ratingContainer.innerHTML = "";

      if (reviews.length === 0) {
        ratingContainer.innerHTML = `<p>No reviews available for this product</p>`;
        return;
      }

      const averageRating =
        reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
        reviews.length;

      document.getElementById("overall-rating-number").textContent =
        averageRating.toFixed(1);

      document.getElementById("total-review-count").textContent =
        `${reviews.length} Reviews`;

      const overallStars = document.querySelector(".overall-rating-stars");

      if (overallStars) {
        overallStars.innerHTML = "";

        const overallStarsDiv = generateStars(averageRating);

        while (overallStarsDiv.firstChild) {
          overallStars.appendChild(overallStarsDiv.firstChild);
        }
      }


      const starContainer = document.querySelector(".star-rating");
      starContainer.innerHTML = "";

      const starsDiv = generateStars(averageRating);
      while (starsDiv.firstChild) {
        starContainer.appendChild(starsDiv.firstChild);
      }

      const ratingText = document.createElement("span");
      ratingText.textContent = `${averageRating.toFixed(1)} / 5`;
      starContainer.appendChild(ratingText);

      reviews.forEach((review) => {
        const customerReviewDiv = document.createElement("div");
        customerReviewDiv.className = "rating-customer";

        const iconDiv = document.createElement("div");
        iconDiv.className = "icon-container";
        iconDiv.innerHTML = `<i class="fa fa-user"></i>`;

        const contentDiv = document.createElement("div");
        contentDiv.className = "customer-review";

        const nameEl = document.createElement("h4");
        nameEl.textContent = review.reviewerName || "Anonymous";

        const emailEl = document.createElement("p");
        emailEl.className = "email";
        emailEl.textContent = review.reviewerEmail || "";

        const starDiv = generateStars(Number(review.rating));

        const dateEl = document.createElement("p");
        dateEl.className = "dateCreated";
        dateEl.textContent = new Date(review.date).toLocaleDateString();

        starDiv.appendChild(dateEl);

        const commentEl = document.createElement("p");
        commentEl.className = "reviewInfo";
        commentEl.textContent = review.comment;

        contentDiv.append(nameEl, emailEl, starDiv, commentEl);
        customerReviewDiv.append(iconDiv, contentDiv);
        ratingContainer.appendChild(customerReviewDiv);
      });
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.id !== "submit-review-btn") return;

    const productId = localStorage.getItem("selectedProductId");
    if (!productId) return;

    const name = document.getElementById("reviewer-name").value.trim();
    const email = document.getElementById("reviewer-email").value.trim();
    const rating = Number(document.getElementById("review-rating").value);
    const comment = document.getElementById("review-comment").value.trim();

    if (!name || !email || !comment) {
      showNotification("Please fill out all review fields.", "error");
      return;
    }

    const newReview = {
      reviewerName: name,
      reviewerEmail: email,
      rating,
      comment,
      date: new Date().toISOString(),
    };

    const savedReviews =
      JSON.parse(localStorage.getItem(`reviews_${productId}`)) || [];

    savedReviews.push(newReview);

    localStorage.setItem(`reviews_${productId}`, JSON.stringify(savedReviews));

    document.getElementById("reviewer-name").value = "";
    document.getElementById("reviewer-email").value = "";
    document.getElementById("review-rating").value = "5";
    document.getElementById("review-comment").value = "";

    showNotification("Review added successfully.", "success");
    fetchReviews();
  });

  
document.addEventListener("click", (e) => {

  if (e.target.id === "open-review-btn") {
    document
      .getElementById("add-review-box")
      .classList.remove("hidden");
  }

  if (e.target.id === "cancel-review-btn") {
    document
      .getElementById("add-review-box")
      .classList.add("hidden");
  }

});


document.addEventListener("DOMContentLoaded", fetchReviews);

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