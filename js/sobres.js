fetch('https://usuario.github.io/repositorio/data.json')


class PokemonTCG {
  constructor() {
    this.pokemonData = []
    this.availablePacks = []
    this.ownedPokemon = this.loadOwnedPokemon()
    this.currentOpeningPack = null

    this.init()
  }

  async init() {
    await this.loadPokemonData()
    this.generatePacks()
    this.setupEventListeners()
    this.updateUI()
  }

  // Cargar datos de la PokeAPI
  async loadPokemonData() {
    try {
      console.log("Cargando datos de Pokémon...")


      const promises = []
      for (let i = 1; i <= 151; i++) {
        promises.push(this.fetchPokemon(i))
      }

      const results = await Promise.all(promises)
      this.pokemonData = results.filter((pokemon) => pokemon !== null)

      console.log(`Cargados ${this.pokemonData.length} Pokémon`)
    } catch (error) {
      console.error("Error cargando datos de Pokémon:", error)
      this.pokemonData = this.getFallbackPokemon()
    }
  }

  async fetchPokemon(id) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const pokemon = await response.json()

      return {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default,
        types: pokemon.types.map((type) => type.type.name),
        height: pokemon.height,
        weight: pokemon.weight,
        stats: pokemon.stats.map((stat) => ({
          name: stat.stat.name,
          value: stat.base_stat,
        })),
      }
    } catch (error) {
      console.error(`Error fetching Pokemon ${id}:`, error)
      return null
    }
  }

  // Generar 3 sobres con 6 cartas cada uno
  generatePacks() {
    this.availablePacks = []

    for (let i = 0; i < 3; i++) {
      const pack = {
        id: i + 1,
        name: `Sobre ${i + 1}`,
        cards: this.generateRandomCards(6),
        opened: false,
      }
      this.availablePacks.push(pack)
    }

    this.renderPacks()
  }

  // Generar cartas aleatorias
  generateRandomCards(count) {
    const cards = []

    for (let i = 0; i < count; i++) {
      if (this.pokemonData.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.pokemonData.length)
        const pokemon = this.pokemonData[randomIndex]

        
        const rarity = this.getRandomRarity()

        cards.push({
          ...pokemon,
          rarity: rarity,
          cardId: `${pokemon.id}-${Date.now()}-${Math.random()}`,
        })
      }
    }

    return cards
  }

  // Sistema de rareza
  getRandomRarity() {
    const rand = Math.random()
    if (rand < 0.05) return "legendary" 
    if (rand < 0.15) return "rare" 
    if (rand < 0.35) return "uncommon" 
    return "common" // 65%
  }


  renderPacks() {
    const packsGrid = document.getElementById("packs-grid")
    packsGrid.innerHTML = ""

    this.availablePacks.forEach((pack) => {
      if (!pack.opened) {
        const packElement = document.createElement("div")
        packElement.className = "pack-card"
        packElement.innerHTML = `
                    <div class="pack-icon">🎴</div>
                    <h3>${pack.name}</h3>
                    <p>6 cartas misteriosas</p>
                    <p>¡Haz clic para abrir!</p>
                `

        packElement.addEventListener("click", () => this.openPack(pack))
        packsGrid.appendChild(packElement)
      }
    })


    if (this.availablePacks.every((pack) => pack.opened)) {
      packsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-main); font-size: 1.2em;">
                    <p>¡No hay sobres disponibles!</p>
                    <p>Genera nuevos sobres para continuar.</p>
                </div>
            `
    }
  }


  async openPack(pack) {
    this.currentOpeningPack = pack
    const modal = document.getElementById("pack-modal")
    const packAnimation = document.getElementById("pack-animation")
    const cardsReveal = document.getElementById("cards-reveal")


    modal.classList.add("active")
    packAnimation.style.display = "block"
    cardsReveal.classList.remove("active")


    await this.sleep(1500)

 
    packAnimation.style.opacity = "0"
    await this.sleep(300)
    packAnimation.style.display = "none"

    /
    this.renderPackCards(pack.cards)
    cardsReveal.style.opacity = "0"
    cardsReveal.classList.add("active")


    setTimeout(() => {
      cardsReveal.style.opacity = "1"
    }, 25)

    // Reset para próxima vez
    packAnimation.style.opacity = "1"


    this.addCardsToCollection(pack.cards)


    pack.opened = true

    // Actualizar UI
    this.renderPacks()
    this.updateUI()
  }

  //  sobre abierto con fade in
  renderPackCards(cards) {
    const cardsReveal = document.getElementById("cards-reveal")
    cardsReveal.innerHTML = ""

    cards.forEach((card, index) => {
      const cardElement = document.createElement("div")
      cardElement.className = "pokemon-card"
      cardElement.style.animationDelay = `${index * 0.1}s`

      const typesHTML = card.types.map((type) => `<span class="pokemon-type type-${type}">${type}</span>`).join("")

      cardElement.innerHTML = `
                <img src="${card.image}" alt="${card.name}" onerror="this.src='/placeholder.svg?height=120&width=120'">
                <h4>${card.name}</h4>
                <div>${typesHTML}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
                    ${card.rarity.toUpperCase()}
                </div>
            `

      cardsReveal.appendChild(cardElement)
    })
  }

  // Agregar cartas a la colección
  addCardsToCollection(cards) {
    cards.forEach((card) => {
      // Guardar cada Pokémon por su ID en localStorage
      localStorage.setItem(card.id.toString(), "true")
      this.ownedPokemon[card.id] = true
    })
  }

  // Cargar Pokémon desde localStorage
  loadOwnedPokemon() {
    const owned = {}
    // Revisar localStorage para IDs del 1 al 151
    for (let i = 1; i <= 151; i++) {
      const stored = localStorage.getItem(i.toString())
      if (stored === "true") {
        owned[i] = true
      }
    }
    return owned
  }

  
  updateUI() {
    const ownedCount = Object.keys(this.ownedPokemon).length
    document.getElementById("card-count").textContent = ownedCount
    document.getElementById("total-cards").textContent = ownedCount
    document.getElementById("unique-pokemon").textContent = ownedCount
  }

  // Configurar event listeners
  setupEventListeners() {
    // Tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab
        this.switchTab(tabName)
      })
    })

    
    document.getElementById("generate-packs").addEventListener("click", () => {
      this.generatePacks()
    })

    // close modal si cliqueo afuera
    document.getElementById("close-modal").addEventListener("click", () => {
      document.getElementById("pack-modal").classList.remove("active")
    })

    // limpiar cole
    document.getElementById("clear-collection").addEventListener("click", () => {
      if (confirm("¿Estás seguro de que quieres limpiar tu colección?")) {
       
        Object.keys(this.ownedPokemon).forEach((pokemonId) => {
          localStorage.removeItem(pokemonId.toString())
        })
        this.ownedPokemon = {}
        this.updateUI()
      }
    })

    // Cerrar modal al hacer clic fuera
    document.getElementById("pack-modal").addEventListener("click", (e) => {
      if (e.target.id === "pack-modal") {
        document.getElementById("pack-modal").classList.remove("active")
      }
    })
  }

  // Cambiar entre tabs
  switchTab(tabName) {
   
    if (tabName === "collection") {
      window.location.href = "index.html"
      return
    }

    
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

   
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}-section`).classList.add("active")
  }

  // Utilidad para pausas
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  new PokemonTCG()
})
