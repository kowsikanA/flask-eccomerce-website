  
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

    
      const form = document.getElementById("search-form");
      const input = document.getElementById("search-input");
      const navInput = document.getElementById("nav-search-input");
      const feedback = document.getElementById("search-feedback");
      const resultsCount = document.getElementById("results-count");
      const pageTitle = document.getElementById("page-title");
      const results = document.getElementById("search-results");
      const categoryFilter = document.getElementById("category-filter");
      const sortFilter = document.getElementById("sort-filter");
      const minPrice = document.getElementById("min-price");
      const maxPrice = document.getElementById("max-price");
      const clearFilters = document.getElementById("clear-filters");
      const loadMoreBtn = document.getElementById("load-more-btn");

      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get("query") || "";

      let allProducts = [];
      let currentProducts = [];
      let visibleCount = 12;
      const PRODUCTS_PER_LOAD = 12;

      if (initialQuery) {
        input.value = initialQuery;
        navInput.value = initialQuery;
        pageTitle.textContent = `Results for "${initialQuery}"`;
      }

      async function loadProducts() {
        feedback.textContent = "Loading products...";

        try {
          const response = await fetch(
            "https://dummyjson.com/products?limit=0&select=id,title,price,thumbnail,category,description,rating,discountPercentage,brand"
          );

          const data = await response.json();
          allProducts = data.products || [];
          populateCategories(allProducts);
          applySearchAndFilters();
        } catch (error) {
          feedback.textContent = "Could not load products. Please try again.";
          results.innerHTML = "<p class='empty'>Could not load products.</p>";
        }
      }

      function populateCategories(products) {
        const categories = [...new Set(products.map(product => product.category))].sort();

        categories.forEach(category => {
          const option = document.createElement("option");
          option.value = category;
          option.textContent = category.replaceAll("-", " ");
          categoryFilter.appendChild(option);
        });
      }

      function applySearchAndFilters() {
        const query = input.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const sort = sortFilter.value;
        const min = minPrice.value ? Number(minPrice.value) : null;
        const max = maxPrice.value ? Number(maxPrice.value) : null;

        let filtered = [...allProducts];

        if (category !== "all") {
          filtered = filtered.filter(product => product.category === category);
        }

        if (query) {
          filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            (product.description || "").toLowerCase().includes(query) ||
            (product.brand || "").toLowerCase().includes(query)
          );
          pageTitle.textContent = `Results for "${input.value.trim()}"`;
        } else {
          pageTitle.textContent = "Search Products";
        }

        if (min !== null) {
          filtered = filtered.filter(product => product.price >= min);
        }

        if (max !== null) {
          filtered = filtered.filter(product => product.price <= max);
        }

        if (sort === "price-low") {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sort === "price-high") {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sort === "name-az") {
          filtered.sort((a, b) => a.title.localeCompare(b.title));
        }

        currentProducts = filtered;
        visibleCount = PRODUCTS_PER_LOAD;
        renderProducts();
      }

      function renderProducts() {
        results.innerHTML = "";

        const visibleProducts = currentProducts.slice(0, visibleCount);

        feedback.textContent =
          currentProducts.length === 0
            ? "No products found. Try another search or category."
            : `Showing ${Math.min(visibleCount, currentProducts.length)} of ${currentProducts.length} product(s).`;

        resultsCount.textContent =
          currentProducts.length === 0
            ? "No products available"
            : `${currentProducts.length} product(s) found`;

        if (visibleProducts.length === 0) {
          results.innerHTML = "<p class='empty'>No products found.</p>";
          loadMoreBtn.style.display = "none";
          return;
        }

        results.innerHTML = visibleProducts.map(product => {
          const discount = product.discountPercentage
            ? `<span class="discount-badge">${Math.round(product.discountPercentage)}% off</span>`
            : "";

          const rating = product.rating
            ? `<span class="rating">★ ${product.rating}</span>`
            : "";

          return `
            <article class="search-product-card">
              <div class="product-image-wrap">
                ${discount}
                <img src="${product.thumbnail}" alt="${product.title}">
              </div>

              <div class="product-card-body">
                <p class="product-category">${product.category.replaceAll("-", " ")}</p>
                <h3>${product.title}</h3>
                <p class="product-description">${product.description || ""}</p>

                <div class="product-meta">
                  ${rating}
                  <span>Online only</span>
                </div>

                <div class="product-bottom">
                  <p class="product-price">$${product.price}</p>
                  <button type="button" class="quick-view-btn" data-id="${product.id}">
                    View Item
                  </button>
                </div>
              </div>
            </article>
          `;
        }).join("");

        loadMoreBtn.style.display =
          visibleCount >= currentProducts.length ? "none" : "inline-flex";
      }

      document.addEventListener("click", (e) => {
        if (!e.target.classList.contains("quick-view-btn")) return;

        const productId = e.target.dataset.id;
        localStorage.setItem("selectedProductId", productId);
        window.location.href = "/productDetails";
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        applySearchAndFilters();
      });

      input.addEventListener("input", applySearchAndFilters);
      categoryFilter.addEventListener("change", applySearchAndFilters);
      sortFilter.addEventListener("change", applySearchAndFilters);
      minPrice.addEventListener("input", applySearchAndFilters);
      maxPrice.addEventListener("input", applySearchAndFilters);

      clearFilters.addEventListener("click", () => {
        input.value = "";
        navInput.value = "";
        categoryFilter.value = "all";
        sortFilter.value = "relevance";
        minPrice.value = "";
        maxPrice.value = "";
        applySearchAndFilters();
      });

      loadMoreBtn.addEventListener("click", () => {
        visibleCount += PRODUCTS_PER_LOAD;
        renderProducts();
      });

      loadProducts();
    