// Mock Product Data
let allProducts = []

// Global State
let cart = JSON.parse(localStorage.getItem("cart")) || []
const currentFilters = {
  search: "",
  category: "",
  sort: "",
}

// DOM Elements
const productsGrid = document.getElementById("productsGrid")
const searchInput = document.getElementById("searchInput")
const categoryFilter = document.getElementById("categoryFilter")
const sortFilter = document.getElementById("sortFilter")
const cartToggle = document.getElementById("cartToggle")
const cartModal = document.getElementById("cartModal")
const cartOverlay = document.getElementById("cartOverlay")
const cartClose = document.getElementById("cartClose")
const cartItems = document.getElementById("cartItems")
const cartEmpty = document.getElementById("cartEmpty")
const cartBadge = document.getElementById("cartBadge")
const totalPrice = document.getElementById("totalPrice")
const checkoutBtn = document.getElementById("checkoutBtn")
const checkoutModal = document.getElementById("checkoutModal")
const checkoutOverlay = document.getElementById("checkoutOverlay")
const checkoutClose = document.getElementById("checkoutClose")
const checkoutForm = document.getElementById("checkoutForm")
const summaryPrice = document.getElementById("summaryPrice")
const successMessage = document.getElementById("successMessage")
const loadingSpinner = document.getElementById("loadingSpinner")
const noProducts = document.getElementById("noProducts")

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts()
  updateCartUI()
})

// Fetch Products
function fetchProducts() {
  loadingSpinner.style.display = "flex"
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((data) => {
      allProducts = data
      loadingSpinner.style.display = "none"
      populateCategoryFilter(data)
      displayProducts()
    })
    .catch((err) => {
      console.error("Failed to fetch products:", err)
      loadingSpinner.innerHTML = `<p style="text-align:center;color:red;">⚠️ Failed to load products. Please try again later.</p>`
    })
}

// Populate Category Filter
function populateCategoryFilter(products) {
  const uniqueCategories = [...new Set(products.map((p) => p.category))]
  categoryFilter.innerHTML = `<option value="">All</option>`
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = capitalize(category)
    categoryFilter.appendChild(option)
  })
}

// Display Products
function displayProducts() {
  const filtered = allProducts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(currentFilters.search.toLowerCase())
    const matchesCategory =
      currentFilters.category === "" || p.category.toLowerCase() === currentFilters.category.toLowerCase()
    return matchesSearch && matchesCategory
  })

  if (currentFilters.sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price)
  } else if (currentFilters.sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price)
  }

  productsGrid.innerHTML = ""

  if (filtered.length === 0) {
    noProducts.style.display = "block"
    return
  } else {
    noProducts.style.display = "none"
  }

  filtered.forEach((product) => {
    const productCard = document.createElement("div")
    productCard.className = "product-card"
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.title}" loading="lazy">
      <h3>${truncateText(product.title, 50)}</h3>
      <div class="price">$${product.price.toFixed(2)}</div>
      <button class="add-to-cart" data-id="${product.id}">
        <i class="fas fa-shopping-cart"></i> Add to Cart
      </button>
    `
    productsGrid.appendChild(productCard)
  })

  // Add event listeners to all add-to-cart buttons
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(btn.getAttribute("data-id"))
      addToCart(id)

      // Visual feedback
      btn.innerHTML = '<i class="fas fa-check"></i> Added!'
      btn.style.backgroundColor = "#28a745"
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart'
        btn.style.backgroundColor = "#007bff"
      }, 1000)
    })
  })
}

// Helper Functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

// Cart Functions
function addToCart(productId) {
  const product = allProducts.find((p) => p.id === productId)
  if (!product) return

  const existing = cart.find((item) => item.id === productId)

  if (existing) {
    existing.qty++
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      qty: 1,
    })
  }

  saveCart()
  updateCartUI()
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCart()
  updateCartUI()
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.id === productId)
  if (!item) return

  item.qty += change

  if (item.qty <= 0) {
    removeFromCart(productId)
  } else {
    saveCart()
    updateCartUI()
  }
}

function updateCartUI() {
  cartItems.innerHTML = ""

  if (cart.length === 0) {
    cartEmpty.style.display = "block"
    cartBadge.textContent = "0"
    cartBadge.style.display = "none"
    totalPrice.textContent = "$0.00"
    if (summaryPrice) summaryPrice.textContent = "$0.00"
    if (checkoutBtn) checkoutBtn.disabled = true
    return
  }

  cartEmpty.style.display = "none"
  if (checkoutBtn) checkoutBtn.disabled = false

  let total = 0
  let totalCount = 0

  cart.forEach((item) => {
    const itemEl = document.createElement("div")
    itemEl.className = "cart-item"
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="item-details">
        <h4>${truncateText(item.title, 40)}</h4>
        <p>$${item.price.toFixed(2)} × ${item.qty}</p>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
            <i class="fas fa-minus"></i>
          </button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${item.id})">
        <i class="fas fa-trash-alt"></i>
      </button>
    `
    cartItems.appendChild(itemEl)

    total += item.price * item.qty
    totalCount += item.qty
  })

  cartBadge.textContent = totalCount
  cartBadge.style.display = totalCount > 0 ? "block" : "none"
  totalPrice.textContent = `$${total.toFixed(2)}`
  if (summaryPrice) summaryPrice.textContent = `$${total.toFixed(2)}`
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart))
}

// Event Listeners
searchInput.addEventListener(
  "input",
  debounce((e) => {
    currentFilters.search = e.target.value
    displayProducts()
  }, 300),
)

categoryFilter.addEventListener("change", (e) => {
  currentFilters.category = e.target.value
  displayProducts()
})

sortFilter.addEventListener("change", (e) => {
  currentFilters.sort = e.target.value
  displayProducts()
})

// Cart Modal Handlers
cartToggle.addEventListener("click", () => {
  cartModal.classList.add("open")
})

cartClose.addEventListener("click", () => {
  cartModal.classList.remove("open")
})

cartOverlay.addEventListener("click", () => {
  cartModal.classList.remove("open")
})

// Checkout Modal Handlers
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return
    cartModal.classList.remove("open")
    setTimeout(() => checkoutModal.classList.add("open"), 200)
  })
}

if (checkoutClose) {
  checkoutClose.addEventListener("click", () => {
    checkoutModal.classList.remove("open")
  })
}

if (checkoutOverlay) {
  checkoutOverlay.addEventListener("click", () => {
    checkoutModal.classList.remove("open")
  })
}

// Submit Order
if (checkoutForm) {
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Close checkout modal
    checkoutModal.classList.remove("open")

    // Clear cart
    cart = []
    saveCart()
    updateCartUI()

    // Reset form
    checkoutForm.reset()

    // Show success message
    successMessage.classList.add("show")
    setTimeout(() => {
      successMessage.classList.remove("show")
    }, 3000)
  })
}

// Escape key closes modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cartModal.classList.remove("open")
    if (checkoutModal) checkoutModal.classList.remove("open")
  }
})

// Debounce Function
function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
