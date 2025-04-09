const API_KEY = "5ad8b614-bd03-4554-9bc5-918e09d974f5";
const cardForm = document.getElementById("cardForm");
const cardDisplay = document.getElementById("cardDisplay");
const libraryDisplay = document.getElementById("libraryDisplay");
const background = document.getElementById("background");
const interval = 3000; // Background change interval

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
  const res = await fetch("https://api.pokemontcg.io/v2/cards?pageSize=1&random=true", {
    headers: { "X-Api-Key": API_KEY },
  });

  const data = await res.json();
  const card = data.data[0]; // Get the first random card
  if (!card || !card.images.large) return;

  background.style.opacity = "0";

  setTimeout(() => {
    background.style.backgroundImage = `url(${card.images.large})`;
    background.style.opacity = "1";
  }, 1500);
}

// Initialize the app
renderLibrary();
setRandomPokemonBackground();
setInterval(setRandomPokemonBackground, interval);