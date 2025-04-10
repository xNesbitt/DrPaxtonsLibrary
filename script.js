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

  // Optionally: Save user data in Firestore or localStorage
  saveUserToFirestore(user);
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
function saveCard(card) {
  const library = JSON.parse(localStorage.getItem("cardLibrary")) || [];

  // Prevent duplicates
  const exists = library.some(saved => saved.id === card.id);
  if (exists) {
    alert("Card is already in your library.");
    return;
  }

  library.push(card);
  localStorage.setItem("cardLibrary", JSON.stringify(library));
  renderLibrary();
}


// Render the library
function renderLibrary() {
  const library = JSON.parse(localStorage.getItem("cardLibrary")) || [];
  libraryDisplay.innerHTML = library
    .map(
      (card) => `
    <div class="lib-card">
      <img src="${card.images.small}" />
      <div>
        <h4>${card.name}</h4>
        <p>Set: ${card.set.name}</p>
      </div>
    </div>
  `
    )
    .join("");
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
renderLibrary();
setRandomPokemonBackground();
setInterval(setRandomPokemonBackground, interval);