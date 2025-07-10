const pokemons = document.querySelector("#pokemons");
const pokemonsRival = document.querySelector("#pokemons-rival");
const URL = "https://pokeapi.co/api/v2/pokemon/";

let misCartas = []; // IDs de mis cartas
let cartasOponente = []; // IDs de las cartas del oponente
let cartaSeleccionada = null;
let conectado = false;
let ably = null;
let channel = null;

// Verificar si Ably está disponible
function verificarAbly() {
    if (typeof Ably === 'undefined') {
        console.error("Ably no está cargado");
        mostrarError("Error: Servicio de intercambio no disponible");
        return false;
    }
    return true;
}

function mostrarExito(mensaje) {
    const exitoDiv = document.createElement('div');
    exitoDiv.className = 'notification success';
    exitoDiv.textContent = mensaje;
    document.body.appendChild(exitoDiv);
    
    setTimeout(() => {
        exitoDiv.remove();
    }, 3000);
}

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function actualizarEstadoConexion(estado) {
    const estadoElement = document.getElementById('estado-conexion');
    if (estadoElement) {
        estadoElement.className = '';
        estadoElement.classList.add(estado);
        
        switch(estado) {
            case 'conectado':
                estadoElement.textContent = '🟢 Conectado';
                break;
            case 'conectando':
                estadoElement.textContent = '🟡 Conectando...';
                break;
            case 'desconectado':
            default:
                estadoElement.textContent = '🔴 Desconectado';
                break;
        }
    }
}

function actualizarCartaSeleccionada(pokemonId) {
    const cartaElement = document.getElementById('carta-seleccionada');
    if (cartaElement) {
        if (pokemonId) {
            cartaElement.textContent = `Carta seleccionada: #${pokemonId}`;
            cartaElement.style.display = 'block';
        } else {
            cartaElement.style.display = 'none';
        }
    }
}

function cargarPokemons() {
    misCartas = [];
    pokemons.innerHTML = '<h2>Mis Cartas Disponibles</h2><p>Cargando cartas...</p>';
    
    let cartasCargadas = 0;
    const totalCartas = 151;
    
    for (let i = 1; i <= 151; i++) {
        fetch(URL + i)
            .then((response) => response.json())
            .then((data) => {
                cartasCargadas++;
                
                // Corregir la lógica aquí también
                if (localStorage.getItem(i) === "true") {
                    misCartas.push(i);
                    mostrarPokemonDisponible(data);
                }
                
                // Verificar si terminamos de cargar todas las cartas
                if (cartasCargadas === totalCartas) {
                    finalizarCargaCartas();
                }
            })
            .catch((error) => {
                console.error(`Error cargando Pokémon ${i}:`, error);
                cartasCargadas++;
                
                // Verificar si terminamos incluso con errores
                if (cartasCargadas === totalCartas) {
                    finalizarCargaCartas();
                }
            });
    }
}

function finalizarCargaCartas() {
    // Limpiar mensaje de carga
    const mensajeCarga = pokemons.querySelector('p');
    if (mensajeCarga && mensajeCarga.textContent === 'Cargando cartas...') {
        mensajeCarga.remove();
    }
    
    console.log("Mis cartas cargadas:", misCartas);
    
    // Verificar si realmente no hay cartas después de cargar
    if (misCartas.length === 0) {
        pokemons.innerHTML += '<p style="text-align: center; color: #666; padding: 20px;">No tienes cartas disponibles para intercambiar.<br><a href="index.html" style="color: #4a90e2;">Ve a la colección</a> para obtener cartas primero.</p>';
        console.log("❌ No hay cartas disponibles para intercambio");
        
        // Verificar si hay cartas en localStorage pero no se cargaron
        let cartasEnStorage = 0;
        for (let i = 1; i <= 151; i++) {
            if (localStorage.getItem(i) === "true") {
                cartasEnStorage++;
            }
        }
        
        if (cartasEnStorage > 0) {
            console.log(`⚠️ Hay ${cartasEnStorage} cartas en localStorage pero no se cargaron desde la API`);
            mostrarError(`Error: Hay ${cartasEnStorage} cartas guardadas pero no se pudieron cargar. Verifica tu conexión a internet.`);
        }
    } else {
        console.log(`✅ ${misCartas.length} cartas cargadas correctamente`);
        mostrarExito(`${misCartas.length} cartas disponibles para intercambio`);
    }
}

function cargarPokemonsRivales() {
    pokemonsRival.innerHTML = '<h2>Buscando oponente...</h2>';
}

function mostrarPokemonDisponible(pokemon) {
    const carta = document.createElement("article");
    carta.classList.add("carta");
    carta.dataset.id = pokemon.id;
    
    // Agregar clase si está seleccionada
    if (cartaSeleccionada === pokemon.id) {
        carta.classList.add("sombra");
    }
    
    carta.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
        <p>#${pokemon.id.toString().padStart(3, "0")}</p>
        <p>${pokemon.name}</p>  
    `;
    
    carta.addEventListener("click", () => seleccionarCarta(pokemon.id));
    pokemons.appendChild(carta);
}

function mostrarPokemonRivalesDisponible(pokemon) {
    const carta = document.createElement("article");
    carta.classList.add("carta");
    carta.innerHTML = `
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
        <p>#${pokemon.id.toString().padStart(3, "0")}</p>
        <p>${pokemon.name}</p>  
    `;
    pokemonsRival.appendChild(carta);
}

function mostrarCartasOponente(cartasIds) {
    pokemonsRival.innerHTML = "<h2>Cartas del Oponente</h2>";

    cartasIds.forEach((id) => {
        fetch(URL + id)
            .then((response) => response.json())
            .then((data) => {
                mostrarPokemonRivalesDisponible(data);
            })
            .catch((error) => {
                console.error(`Error cargando carta rival ${id}:`, error);
            });
    });
}

function seleccionarCarta(pokemonId) {
    // Remover selección anterior
    document.querySelectorAll('.carta').forEach(carta => {
        carta.classList.remove('sombra');
    });
    
    // Seleccionar nueva carta
    cartaSeleccionada = pokemonId;
    const cartaElement = document.querySelector(`[data-id="${pokemonId}"]`);
    if (cartaElement) {
        cartaElement.classList.add('sombra');
    }
    
    console.log(`Carta seleccionada: #${pokemonId}`);
    
    // Actualizar UI
    actualizarCartaSeleccionada(pokemonId);
    
    // Mostrar botón de intercambio solo si está conectado
    const botonIntercambio = document.getElementById("intercambio");
    if (conectado && botonIntercambio) {
        botonIntercambio.style.display = "block";
    }
    
    mostrarExito(`Carta #${pokemonId} seleccionada`);
}

// Mejorar el manejo de conexión
document.getElementById("conector").addEventListener("click", function () {
    if (!verificarAbly()) {
        return;
    }
    
    // Deshabilitar el botón y mostrar estado
    this.disabled = true;
    this.innerHTML = '<span class="loading"></span> Conectando...';
    actualizarEstadoConexion('conectando');
    
    cargarPokemonsRivales();

    try {
        // Usar una API key de prueba o temporal
        ably = new Ably.Realtime({
            key: "uqRJZg.KHwvcQ:4pn-u1lwqY4mjeUUm-A2zyX3bK7ZS1U_XwTgrHIZ_DU",
            clientId: 'player_' + Math.random().toString(36).substr(2, 9)
        });
        
        channel = ably.channels.get("canal-intercambio");

        ably.connection.on("connected", () => {
            console.log("Conectado a Ably");
            conectado = true;
            this.style.display = "none";
            actualizarEstadoConexion('conectado');
            mostrarExito("Conectado al servidor de intercambios");

            // Enviar cartas disponibles
            channel.publish("jugador_conectado", {
                jugadorId: ably.auth.clientId,
                cartas: misCartas,
            });
        });

        ably.connection.on("failed", () => {
            console.error("Error de conexión con Ably");
            mostrarError("No se pudo conectar al servidor");
            actualizarEstadoConexion('desconectado');
            this.disabled = false;
            this.textContent = "🔗 Conectar al Servidor";
        });

        ably.connection.on("disconnected", () => {
            console.log("Desconectado del servidor");
            conectado = false;
            actualizarEstadoConexion('desconectado');
        });

        // Escuchar eventos
        channel.subscribe("actualizar_lista", (mensaje) => {
            if (mensaje.data.jugadorId !== ably.auth.clientId) {
                cartasOponente = mensaje.data.cartas;
                mostrarCartasOponente(cartasOponente);
                console.log("📋 Lista de oponente actualizada:", cartasOponente);
            }
        });

        channel.subscribe("jugador_conectado", (mensaje) => {
            if (mensaje.data.jugadorId !== ably.auth.clientId) {
                cartasOponente = mensaje.data.cartas;
                mostrarCartasOponente(cartasOponente);
                mostrarExito("¡Oponente encontrado!");
                console.log("🎮 Oponente conectado con cartas:", cartasOponente);
                
                // Enviar mis cartas de vuelta para sincronización
                setTimeout(() => {
                    channel.publish("actualizar_lista", {
                        jugadorId: ably.auth.clientId,
                        cartas: misCartas,
                    });
                }, 500);
            }
        });

        // Escuchar ofertas del oponente
        channel.subscribe("oferta_carta", (mensaje) => {
            if (mensaje.data.jugadorId !== ably.auth.clientId) {
                const { cartaId } = mensaje.data;
                console.log(`📨 Oferta recibida: carta #${cartaId}`);
                
                const confirmacion = confirm(
                    `¿Aceptas intercambiar tu carta seleccionada (#${cartaSeleccionada || 'ninguna'}) por la carta #${cartaId} del oponente?`
                );

                if (confirmacion && cartaSeleccionada) {
                    console.log(`✅ Aceptando intercambio: Doy #${cartaSeleccionada}, recibo #${cartaId}`);
                    
                    channel.publish("aceptar_intercambio", {
                        jugadorId: ably.auth.clientId,
                        miCarta: cartaSeleccionada,
                        cartaOponente: cartaId,
                        timestamp: Date.now()
                    });
                    
                    // Realizar intercambio inmediatamente
                    actualizarMazos(cartaId, cartaSeleccionada);
                    
                } else {
                    console.log("❌ Intercambio rechazado");
                    channel.publish("cancelar_intercambio", {
                        jugadorId: ably.auth.clientId,
                    });
                }
            }
        });

        // Escuchar confirmación del oponente
        channel.subscribe("aceptar_intercambio", (mensaje) => {
            if (mensaje.data.jugadorId !== ably.auth.clientId) {
                console.log("🎉 Intercambio confirmado por oponente:", mensaje.data);
                
                const cartaRecibida = mensaje.data.miCarta; // La carta que el oponente me da
                const cartaEntregada = mensaje.data.cartaOponente; // La carta que yo di (debería ser mi cartaSeleccionada)
                
                mostrarExito(`¡Intercambio exitoso! Recibiste carta #${cartaRecibida}`);
                
                // Solo actualizar si no se ha hecho ya (evitar duplicados)
                if (localStorage.getItem(cartaEntregada) === "true") {
                    actualizarMazos(cartaRecibida, cartaEntregada);
                }
            }
        });

        channel.subscribe("cancelar_intercambio", (mensaje) => {
            if (mensaje.data.jugadorId !== ably.auth.clientId) {
                mostrarError("El oponente canceló el intercambio");
            }
        });

    } catch (error) {
        console.error("Error al conectar:", error);
        mostrarError("Error al conectar: " + error.message);
        actualizarEstadoConexion('desconectado');
        this.disabled = false;
        this.textContent = "🔗 Conectar al Servidor";
    }
});

// Manejar el botón de intercambio
document.getElementById("intercambio").addEventListener("click", function () {
    if (!conectado) {
        mostrarError("No estás conectado al servidor");
        return;
    }
    
    if (!cartaSeleccionada) {
        mostrarError("Selecciona una carta primero");
        return;
    }
    
    if (cartasOponente.length === 0) {
        mostrarError("No hay oponente conectado");
        return;
    }

    console.log(`📤 Enviando oferta: carta #${cartaSeleccionada}`);
    
    // Enviar oferta
    channel.publish("oferta_carta", {
        jugadorId: ably.auth.clientId,
        cartaId: cartaSeleccionada,
        timestamp: Date.now()
    });
    
    mostrarExito(`Oferta enviada: Carta #${cartaSeleccionada}`);
    this.style.display = "none"; // Ocultar hasta nueva selección
});

// Función para actualizar mazos
function actualizarMazos(cartaRecibida, cartaEntregada) {
    // Actualizar localStorage
    localStorage.setItem(cartaEntregada, "false");
    localStorage.setItem(cartaRecibida, "true");

    // Actualizar listas locales
    misCartas = misCartas.filter((id) => id !== cartaEntregada);
    misCartas.push(parseInt(cartaRecibida));

    // Actualizar UI
    cargarPokemons();
    cartaSeleccionada = null;
    document.getElementById("intercambio").style.display = "none";

    // Notificar al oponente
    if (channel) {
        channel.publish("actualizar_lista", {
            jugadorId: ably.auth.clientId,
            cartas: misCartas,
        });
    }
}

// Inicializar cuando carga la página
document.addEventListener("DOMContentLoaded", () => {
    // Primero verificar si hay cartas en localStorage
    let cartasEnStorage = 0;
    for (let i = 1; i <= 151; i++) {
        if (localStorage.getItem(i) === "true") {
            cartasEnStorage++;
        }
    }
    
    console.log(`📦 Cartas encontradas en localStorage: ${cartasEnStorage}`);
    
    if (cartasEnStorage === 0) {
        // Si no hay cartas, inicializar algunas para testing
        console.log("⚠️ No hay cartas en localStorage, inicializando cartas de prueba...");
        const cartasPrueba = [1, 4, 7, 25, 150, 6, 9, 131];
        
        cartasPrueba.forEach(id => {
            localStorage.setItem(id, "true");
        });
        
        localStorage.setItem('initialized', 'true');
        mostrarExito(`Se inicializaron ${cartasPrueba.length} cartas de prueba`);
    }
    
    // Cargar cartas
    cargarPokemons();
    actualizarEstadoConexion('desconectado');
    document.getElementById("conector").style.display = "block";
    document.getElementById("intercambio").style.display = "none";
    
    console.log("Sistema de intercambio cargado");
});