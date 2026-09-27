const API = "/api";

let products = [];


// ================= HELPER FUNCTIONS =================

function $(id) {
    return document.getElementById(id);
}


function showNotification(message, type = "normal") {

    const notification = $("notification");

    notification.textContent = message;
    notification.style.display = "block";

    if (type === "error") {
        notification.style.background = "#dc2626";
    } else if (type === "success") {
        notification.style.background = "#16a34a";
    } else {
        notification.style.background = "#111827";
    }

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}


function escapeHtml(text) {

    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ================= AUTH =================

function getToken() {
    return localStorage.getItem("shopapi_token");
}


function getUser() {

    const user = localStorage.getItem("shopapi_user");

    try {
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}


function saveSession(token, user) {

    localStorage.setItem("shopapi_token", token);
    localStorage.setItem("shopapi_user", JSON.stringify(user));
}


function clearSession() {

    localStorage.removeItem("shopapi_token");
    localStorage.removeItem("shopapi_user");
}


function showLogin() {

    $("loginForm").classList.remove("hidden");
    $("registerForm").classList.add("hidden");
}


function showRegister() {

    $("loginForm").classList.add("hidden");
    $("registerForm").classList.remove("hidden");
}


async function login(event) {

    event.preventDefault();

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    try {

        const response = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        saveSession(data.token, data.user);

        showNotification(
            "Login successful!",
            "success"
        );

        showApp();

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


async function register(event) {

    event.preventDefault();

    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;

    try {

        const response = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        showNotification(
            "Registration successful. Please login.",
            "success"
        );

        $("registerName").value = "";
        $("registerEmail").value = "";
        $("registerPassword").value = "";

        showLogin();

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


async function logout() {

    try {

        const token = getToken();

        if (token) {

            await fetch(`${API}/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

    } catch (error) {

        console.log(error);

    } finally {

        clearSession();

        $("appPage").classList.add("hidden");
        $("authPage").classList.remove("hidden");

        showLogin();

        showNotification(
            "Logged out successfully.",
            "success"
        );
    }
}


// ================= API HELPER =================

async function api(url, options = {}) {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (response.status === 401) {

        clearSession();

        $("appPage").classList.add("hidden");
        $("authPage").classList.remove("hidden");

        showLogin();

        throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            "Something went wrong"
        );
    }

    return data;
}


// ================= SHOW APP =================

function showApp() {

    const user = getUser();

    if (!user || !getToken()) {
        return;
    }

    $("authPage").classList.add("hidden");
    $("appPage").classList.remove("hidden");

    updateUserUI(user);

    loadProducts();
    loadBookings();
}


function updateUserUI(user) {

    const name = user.name || "User";
    const email = user.email || "";

    $("navUserName").textContent = name;

    $("profileName").textContent = name;
    $("profileEmail").textContent = email;

    $("profileNameInput").value = name;
    $("profileEmailInput").value = email;

    $("profileInitial").textContent =
        name.charAt(0).toUpperCase();

    if (user.profileImage) {

        $("profileImage").src =
            user.profileImage.startsWith("http")
                ? user.profileImage
                : user.profileImage;

        $("profileImage").style.display = "block";
        $("profileInitial").style.display = "none";

    } else {

        $("profileImage").style.display = "none";
        $("profileInitial").style.display = "flex";
    }
}


// ================= NAVIGATION =================

function showSection(sectionId, button) {

    document.querySelectorAll(".content-section")
        .forEach(section => {
            section.classList.add("hidden");
        });

    $(sectionId).classList.remove("hidden");

    document.querySelectorAll(".nav-tab")
        .forEach(tab => {
            tab.classList.remove("active");
        });

    button.classList.add("active");

    if (sectionId === "productsSection") {
        loadProducts();
    }

    if (sectionId === "bookingsSection") {
        loadBookings();
    }
}


// ================= PRODUCTS =================

async function loadProducts() {

    const container = $("productsGrid");

    container.innerHTML =
        `<div class="loading">Loading products...</div>`;

    try {

        const data = await api(`${API}/products`);

        products = data.products || data.data || data;

        if (!Array.isArray(products)) {
            products = [];
        }

        renderProducts();

    } catch (error) {

        container.innerHTML =
            `<div class="empty error-message">
                ${escapeHtml(error.message)}
            </div>`;
    }
}


function renderProducts() {

    const container = $("productsGrid");

    if (!products.length) {

        container.innerHTML =
            `<div class="empty">
                No products available yet.
             </div>`;

        return;
    }

    container.innerHTML = products.map(product => {

        const price = Number(product.price || 0);
        const discount = Number(product.discount || 0);

        const finalPrice =
            price - (price * discount / 100);

        const quantity =
            Number(product.quantity || 0);

        return `
            <div class="product-card">

                <span class="product-category">
                    ${escapeHtml(product.category)}
                </span>

                <h3>
                    ${escapeHtml(product.name)}
                </h3>

                <p class="product-description">
                    ${
                        escapeHtml(
                            product.description ||
                            "No description available."
                        )
                    }
                </p>

                <div class="product-price">
                    ₹${finalPrice.toFixed(2)}

                    ${
                        discount > 0
                        ? `
                            <span class="original-price">
                                ₹${price.toFixed(2)}
                            </span>
                        `
                        : ""
                    }
                </div>

                ${
                    discount > 0
                    ? `
                        <div class="discount">
                            ${discount}% discount
                        </div>
                    `
                    : ""
                }

                <div class="product-stock">
                    Stock: ${quantity}
                </div>

                <div class="product-actions">

                    <button
                        class="btn primary btn-small"
                        onclick="openBookingModal('${product._id}')"
                        ${quantity <= 0 ? "disabled" : ""}
                    >
                        ${
                            quantity <= 0
                            ? "Out of Stock"
                            : "Book"
                        }
                    </button>

                    <button
                        class="btn secondary btn-small"
                        onclick="editProduct('${product._id}')"
                    >
                        Edit
                    </button>

                    <button
                        class="btn secondary btn-small"
                        onclick="deleteProduct('${product._id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


// ================= PRODUCT MODAL =================

function openProductModal(product = null) {

    $("productModal").classList.remove("hidden");

    if (product) {

        $("productModalTitle").textContent =
            "Edit Product";

        $("productId").value =
            product._id;

        $("productName").value =
            product.name;

        $("productCategory").value =
            product.category;

        $("productPrice").value =
            product.price;

        $("productSku").value =
            product.sku;

        $("productDescription").value =
            product.description || "";

        $("productDiscount").value =
            product.discount || 0;

        $("productQuantity").value =
            product.quantity || 0;

    } else {

        $("productModalTitle").textContent =
            "Add Product";

        $("productId").value = "";

        $("productName").value = "";
        $("productCategory").value = "";
        $("productPrice").value = "";
        $("productSku").value = "";
        $("productDescription").value = "";
        $("productDiscount").value = 0;
        $("productQuantity").value = 1;
    }
}


function closeProductModal() {

    $("productModal").classList.add("hidden");
}


function editProduct(id) {

    const product =
        products.find(item => item._id === id);

    if (!product) {
        return;
    }

    openProductModal(product);
}


async function saveProduct(event) {

    event.preventDefault();

    const id = $("productId").value;

    const productData = {

        name: $("productName").value.trim(),

        category:
            $("productCategory").value.trim(),

        price:
            Number($("productPrice").value),

        sku:
            $("productSku").value.trim(),

        description:
            $("productDescription").value.trim(),

        discount:
            Number($("productDiscount").value || 0),

        quantity:
            Number($("productQuantity").value)
    };


    try {

        if (id) {

            await api(`${API}/products/${id}`, {

                method: "PUT",

                body: JSON.stringify(productData)

            });

            showNotification(
                "Product updated successfully.",
                "success"
            );

        } else {

            await api(`${API}/products`, {

                method: "POST",

                body: JSON.stringify(productData)

            });

            showNotification(
                "Product added successfully.",
                "success"
            );
        }

        closeProductModal();

        loadProducts();

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


async function deleteProduct(id) {

    const product =
        products.find(item => item._id === id);

    if (!product) {
        return;
    }

    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        await api(`${API}/products/${id}`, {
            method: "DELETE"
        });

        showNotification(
            "Product deleted successfully.",
            "success"
        );

        loadProducts();

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


// ================= BOOKING =================

function openBookingModal(id) {

    const product =
        products.find(item => item._id === id);

    if (!product) {
        return;
    }

    $("bookingProductId").value =
        product._id;

    $("bookingProductName").textContent =
        `${product.name} — ₹${product.price}`;

    $("bookingQuantity").value = 1;

    $("bookingQuantity").max =
        product.quantity;

    $("bookingModal").classList.remove("hidden");
}


function closeBookingModal() {

    $("bookingModal").classList.add("hidden");
}


async function placeBooking() {

    const productId =
        $("bookingProductId").value;

    const quantity =
        Number($("bookingQuantity").value);

    if (!productId || quantity < 1) {

        showNotification(
            "Please enter a valid quantity.",
            "error"
        );

        return;
    }

    try {

        await api(`${API}/bookings`, {

            method: "POST",

            body: JSON.stringify({

                product_id: productId,

                quantity: quantity

            })
        });

        closeBookingModal();

        showNotification(
            "Booking placed successfully!",
            "success"
        );

        loadProducts();
        loadBookings();

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


// ================= BOOKINGS =================

async function loadBookings() {

    const container =
        $("bookingsContainer");

    container.innerHTML =
        `<div class="loading">
            Loading bookings...
         </div>`;

    try {

        const data =
            await api(`${API}/bookings/my`);

        const bookings =
            data.bookings ||
            data.data ||
            data;

        renderBookings(
            Array.isArray(bookings)
                ? bookings
                : []
        );

    } catch (error) {

        container.innerHTML =
            `<div class="empty error-message">
                ${escapeHtml(error.message)}
             </div>`;
    }
}


function renderBookings(bookings) {

    const container =
        $("bookingsContainer");

    if (!bookings.length) {

        container.innerHTML =
            `<div class="empty">
                You haven't booked anything yet.
             </div>`;

        return;
    }

    container.innerHTML =
        bookings.map(booking => {

            const product =
                booking.product_id;

            const productName =
                typeof product === "object"
                    ? product.name
                    : "Product";

            const quantity =
                booking.quantity || 0;

            const total =
                Number(
                    booking.total_amount || 0
                );

            return `
                <div class="booking-card">

                    <h3>
                        ${escapeHtml(productName)}
                    </h3>

                    <div class="booking-details">

                        <div class="booking-detail">

                            <span>Quantity</span>

                            <strong>
                                ${quantity}
                            </strong>

                        </div>

                        <div class="booking-detail">

                            <span>Total Amount</span>

                            <strong>
                                ₹${total.toFixed(2)}
                            </strong>

                        </div>

                        <div class="booking-detail">

                            <span>Booking ID</span>

                            <strong>
                                ${escapeHtml(
                                    String(
                                        booking._id || ""
                                    ).slice(-8)
                                )}
                            </strong>

                        </div>

                    </div>

                </div>
            `;

        }).join("");
}


// ================= PROFILE =================

async function updateProfile(event) {

    event.preventDefault();

    const name =
        $("profileNameInput").value.trim();

    const email =
        $("profileEmailInput").value.trim();

    try {

        const data =
            await api(`${API}/profile`, {

                method: "PUT",

                body: JSON.stringify({
                    name,
                    email
                })
            });

        const updatedUser =
            data.user ||
            data.data ||
            data;

        const token =
            getToken();

        if (updatedUser && updatedUser.email) {

            saveSession(
                token,
                updatedUser
            );

            updateUserUI(
                updatedUser
            );
        }

        showNotification(
            "Profile updated successfully.",
            "success"
        );

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


async function uploadProfilePicture(event) {

    event.preventDefault();

    const file =
        $("profilePicture").files[0];

    if (!file) {

        showNotification(
            "Please select an image.",
            "error"
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "profileImage",
        file
    );

    try {

        const data =
            await api(
                `${API}/profile/picture`,
                {
                    method: "PUT",
                    body: formData
                }
            );

        const updatedUser =
            data.user ||
            data.data ||
            data;

        const token =
            getToken();

        if (
            updatedUser &&
            updatedUser.profileImage
        ) {

            saveSession(
                token,
                updatedUser
            );

            updateUserUI(
                updatedUser
            );
        }

        $("profilePicture").value = "";

        showNotification(
            "Profile picture updated.",
            "success"
        );

    } catch (error) {

        showNotification(
            error.message,
            "error"
        );
    }
}


// ================= START APPLICATION =================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const token =
            getToken();

        const user =
            getUser();

        if (token && user) {

            showApp();

        } else {

            $("authPage")
                .classList
                .remove("hidden");

            $("appPage")
                .classList
                .add("hidden");
        }

    }
);