const API_KEY = "5ad8b614-bd03-4554-9bc5-918e09d974f5";
const cardForm = document.getElementById("cardForm");
const cardDisplay = document.getElementById("cardDisplay");
const libraryDisplay = document.getElementById("libraryDisplay");
const background = document.getElementById("background");
const interval = 3000;
const firebaseConfig = {
  apiKey: "AIzaSyAlKKZ4HerfqyBGDNFm8sKsnyWZ4FJx6-4",
  authDomain: "paxtonslibrary.firebaseapp.com",
  databaseURL: "https://paxtonslibrary-default-rtdb.firebaseio.com",
  projectId: "paxtonslibrary",
  storageBucket: "paxtonslibrary.firebasestorage.app",
  messagingSenderId: "283184662620",
  appId: "1:283184662620:web:5a5ea818d63a0e9c6d3e99",
  measurementId: "G-SMG3QHGCK0"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

// Firebase Authentication (Google Sign-In)
const googleLoginButton = document.getElementById('googleLoginButton');

googleLoginButton.addEventListener('click', () => {
  console.log("✅ Login button clicked"); // 👈 Test log

  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log('✅ User logged in: ', user);
      renderUserInfo(user);
    })
    .catch((error) => {
      console.error('❌ Error during Google sign-in:', error);
    });
});
document.getElementById('logoutButton').addEventListener('click', () => {
  firebase.auth().signOut().then(() => {
    console.log("✅ User signed out — now reloading the page.");
    window.location.reload(); // ✅ This refreshes the entire page
  }).catch((error) => {
    console.error("❌ Sign-out error:", error);
  });
});
function handleSignOutUI() {
  const userInfoContainer = document.getElementById('userInfo');
  userInfoContainer.innerHTML = "";
  document.getElementById('googleLoginButton').style.display = "inline-block";
  document.getElementById('logoutButton').style.display = "none";
}

// Render user info after login
function renderUserInfo(user) {
  const userInfoContainer = document.getElementById('userInfo');
  if (userInfoContainer) {
    userInfoContainer.innerHTML = `
      <h2>Welcome, ${user.displayName}</h2>
      <img src="${user.photoURL}" alt="User Avatar" />
      <p>Email: ${user.email}</p>
    `;
  }
  document.getElementById('googleLoginButton').style.display = "none";
  document.getElementById('logoutButton').style.display = "inline-block";
  saveUserToFirestore(user);
  renderLibrary(); // Load saved cards from Firestore
}

// Save user data to Firestore (optional)
function saveUserToFirestore(user) {
  const userRef = firestore.collection('users').doc(user.uid);
  userRef.set({
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }).then(() => {
    console.log("User info saved to Firestore!");
  }).catch((error) => {
    console.error("Error saving user data:", error);
  });
}

// Handle form submission to search for a Pokémon card
cardForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cardName = document.getElementById("cardName").value.trim();
  if (!cardName) return;

  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${cardName}`, {
    headers: { "X-Api-Key": API_KEY },
  });

  const data = await res.json();
  const card = data.data[0]; // Take the first match
  if (!card) {
    cardDisplay.innerHTML = `<p>No card found.</p>`;
    return;
  }

  const cardHtml = `
    <div class="card">
      <img src="${card.images.small}" />
      <div>
        <h3>${card.name}</h3>
        <p>Set: ${card.set.name}</p>
        <p>Market Price: $${card.cardmarket?.prices?.averageSellPrice?.toFixed(2) || "N/A"}</p>
        <button onclick='saveCard(${JSON.stringify(card).replace(/'/g, "&apos;")})'>Save to Library</button>
      </div>
    </div>
  `;

  cardDisplay.innerHTML = cardHtml;
});

// Save a card to the library
async function saveCard(card) {
  const user = firebase.auth().currentUser;
  if (!user) return alert("You must be logged in to save cards.");

  const cardRef = firestore
    .collection("users")
    .doc(user.uid)
    .collection("cards")
    .doc(card.id);

  try {
    const doc = await cardRef.get();
    if (doc.exists) {
      alert("Card already exists in your library.");
      return;
    }

    await cardRef.set({
      ...card,
      dateAdded: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Card saved to Firestore with timestamp:", card.name);
    renderLibrary(); // Refresh display
  } catch (err) {
    console.error("❌ Failed to save card:", err);
  }
}

async function deleteCard(cardId) {
  const user = firebase.auth().currentUser;
  if (!user) return alert("You must be logged in.");

  const cardRef = firestore
    .collection("users")
    .doc(user.uid)
    .collection("cards")
    .doc(cardId);

  try {
    await cardRef.delete();
    console.log(`🗑️ Deleted card: ${cardId}`);
    renderLibrary(); // Refresh the UI
  } catch (err) {
    console.error("❌ Failed to delete card:", err);
  }
}
// Render the library
async function renderLibrary() {

const rarityFilter = document.getElementById("rarityFilter").value;
const typeFilter = document.getElementById("typeFilter").value;
const subtypeFilter = document.getElementById("subtypeFilter").value;
const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  const user = firebase.auth().currentUser;
  if (!user) {
    libraryDisplay.innerHTML = "<p>Please log in to view your library.</p>";
    return;
  }

  const cardsRef = firestore
    .collection("users")
    .doc(user.uid)
    .collection("cards");

  try {
    const snapshot = await cardsRef.get();
    if (snapshot.empty) {
      libraryDisplay.innerHTML = "<p>No cards saved yet.</p>";
      return;
    }

    const cards = [];
    snapshot.forEach(doc => cards.push(doc.data()));

    let filteredCards = cards.filter(card => {
      const matchRarity = !rarityFilter || card.rarity === rarityFilter;
      const matchType = !typeFilter || card.supertype === typeFilter;
      const matchSubtype = !subtypeFilter || (card.subtypes || []).includes(subtypeFilter);
      const matchSearch = !searchTerm || card.name.toLowerCase().includes(searchTerm);
      return matchRarity && matchType && matchSubtype && matchSearch;
    });

    const sortOption = document.getElementById("sortOptions").value;

filteredCards.sort((a, b) => {
  switch (sortOption) {
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "rarity":
      return (a.rarity || "").localeCompare(b.rarity || "");
    case "price-high":
      return (b.cardmarket?.prices?.averageSellPrice || 0) - (a.cardmarket?.prices?.averageSellPrice || 0);
    case "price-low":
      return (a.cardmarket?.prices?.averageSellPrice || 0) - (b.cardmarket?.prices?.averageSellPrice || 0);
    case "set":
      return (a.set?.name || "").localeCompare(b.set?.name || "");
    case "type":
      return (a.supertype || "").localeCompare(b.supertype || "");
    case "date-desc":
      return (b.dateAdded?.seconds || 0) - (a.dateAdded?.seconds || 0);
    case "date-asc":
      return (a.dateAdded?.seconds || 0) - (b.dateAdded?.seconds || 0);
    case "number":
      return parseInt(a.number) - parseInt(b.number);
    default:
      return 0;
  }
});

libraryDisplay.innerHTML = filteredCards.map(card => `
  <div class="lib-card">
    <img src="${card.images.small}" />
    <div class="card-info">
      <h4>${card.name}</h4>
      <p><strong>Set:</strong> ${card.set?.name || "N/A"}</p>
      <p><strong>Rarity:</strong> ${card.rarity || "N/A"}</p>
      <p><strong>Type:</strong> ${card.supertype || "N/A"}</p>
      <p><strong>Subtype:</strong> ${(card.subtypes || []).join(', ') || "N/A"}</p>
      <p><strong>Card #:</strong> ${card.number || "N/A"}</p>
      <p><strong>Market Price:</strong> $${card.cardmarket?.prices?.averageSellPrice?.toFixed(2) || "0.00"}</p>
      <button onclick="deleteCard('${card.id}')">Remove</button>
    </div>
  </div>
`).join("");       

  } catch (err) {
    console.error("❌ Failed to load library:", err);
    libraryDisplay.innerHTML = "<p>Error loading library.</p>";
  }
}

// Set a random Pokémon card as the background
async function setRandomPokemonBackground() {
  try {
    const res = await fetch("https://api.pokemontcg.io/v2/cards?pageSize=1&random=true", {
      headers: { "X-Api-Key": API_KEY },
    });

    if (!res.ok) throw new Error("API request failed");

    const data = await res.json();
    const card = data.data[0];
    if (!card || !card.images.large) return;

    background.style.opacity = "0";

    setTimeout(() => {
      background.style.backgroundImage = `url(${card.images.large})`;
      background.style.opacity = "1";
    }, 1500);
  } catch (error) {
    console.error("Background card fetch error:", error);
  }
}

// Initialize the app
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    renderUserInfo(user); // ✅ Already triggers renderLibrary()
  } else {
    handleSignOutUI();
  }
});
setRandomPokemonBackground();
setInterval(setRandomPokemonBackground, interval);
document.getElementById("sortOptions").addEventListener("change", renderLibrary);
document.getElementById("rarityFilter").addEventListener("change", renderLibrary);
document.getElementById("typeFilter").addEventListener("change", renderLibrary);
document.getElementById("subtypeFilter").addEventListener("change", renderLibrary);
document.getElementById("clearFiltersButton").addEventListener("click", () => {
  document.getElementById("rarityFilter").value = "";
  document.getElementById("typeFilter").value = "";
  document.getElementById("subtypeFilter").value = "";
  document.getElementById("sortOptions").value = "name-asc"; // optional reset
  renderLibrary(); // refresh with no filters
});
document.getElementById("searchInput").addEventListener("input", renderLibrary);