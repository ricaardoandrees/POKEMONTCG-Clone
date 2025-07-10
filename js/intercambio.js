// Variables globales
const pokemons = document.querySelector("#pokemons");
const pokemonsRival = document.querySelector("#pokemons-rival");
const URL = "https://pokeapi.co/api/v2/pokemon/";

let misCartas = [];
let cartasOponente = [];
let cartaSeleccionada = null;
let conectado = false;
let ably = null;
let channel = null;
let oponenteConectado = false;

// ========== FUNCIONES DE UTILIDAD ==========

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function mostrarExito(mensaje) {
    const exitoDiv = document.createElement('div');
    exitoDiv.className = 'notification success';
    exitoDiv.textContent = mensaje;
    document.body.appendChild(exitoDiv);
    setTimeout(() => exitoDiv.remove(), 3000);
}

function actualizarEstadoConexion(estado) {
    const estadoElement = document.getElementById('estado-conexion');
    if (estadoElement) {
        estadoElement.className = '';
        estadoElement.classList.add(estado);
        switch(estado) {
            case 'conectado': estadoElement.textContent = '🟢 Conectado'; break;
            case 'conectando': estadoElement.textContent = '🟡 Conectando...'; break;
            default: estadoElement.textContent = '🔴 Desconectado'; break;
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

function actualizarBotones() {
    const botonConectar = document.getElementById("conector");
    const botonBuscar = document.getElementById("buscar-oponente");
    const botonDesconectar = document.getElementById("desconectar");
    const botonIntercambio = document.getElementById("intercambio");
    
    if (conectado) {
        if (botonConectar) botonConectar.style.display = "none";
        if (botonDesconectar) botonDesconectar.style.display = "inline-block";
        
        if (oponenteConectado) {
            if (botonBuscar) botonBuscar.style.display = "none";
            if (cartaSeleccionada && botonIntercambio) {
                botonIntercambio.style.display = "inline-block";
            } else if (botonIntercambio) {
                botonIntercambio.style.display = "none";
            }
        } else {
            if (botonBuscar) botonBuscar.style.display = "inline-block";
            if (botonIntercambio) botonIntercambio.style.display = "none";
        }
    } else {
        if (botonConectar) {
            botonConectar.style.display = "inline-block";
            botonConectar.disabled = false;
            botonConectar.textContent = "🔗 Conectar al Servidor";
        }
        if (botonBuscar) botonBuscar.style.display = "none";
        if (botonDesconectar) botonDesconectar.style.display = "none";
        if (botonIntercambio) botonIntercambio.style.display = "none";
    }
}

// ========== FUNCIONES DE POKÉMON ==========

function cargarPokemons() {
    misCartas = [];
    pokemons.innerHTML = '<h2>Mis Cartas Disponibles</h2>';
    
    for (let i = 1; i <= 151; i++) {
        fetch(URL + i)
            .then((response) => response.json())
            .then((data) => {
                if (localStorage.getItem(i) === "true") {
                    misCartas.push(i);
                    mostrarPokemonDisponible(data);
                }
            })
            .catch((error) => console.error(`Error cargando Pokémon ${i}:`, error));
    }
}

function mostrarPokemonDisponible(pokemon) {
    const carta = document.createElement("article");
    carta.classList.add("carta");
    carta.dataset.id = pokemon.id;
    
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
    oponenteConectado = true;
    actualizarBotones();

    cartasIds.forEach((id) => {
        fetch(URL + id)
            .then((response) => response.json())
            .then((data) => mostrarPokemonRivalesDisponible(data))
            .catch((error) => console.error(`Error cargando carta rival ${id}:`, error));
    });
}

function seleccionarCarta(pokemonId) {
    document.querySelectorAll('.carta').forEach(carta => carta.classList.remove('sombra'));
    
    cartaSeleccionada = pokemonId;
    const cartaElement = document.querySelector(`[data-id="${pokemonId}"]`);
    if (cartaElement) cartaElement.classList.add('sombra');
    
    actualizarCartaSeleccionada(pokemonId);
    actualizarBotones();
    mostrarExito(`Carta #${pokemonId} seleccionada`);
}

// ========== FUNCIONES DE CONEXIÓN ==========

function buscarOponente() {
    if (!conectado || !channel) {
        mostrarError("No estás conectado al servidor");
        return;
    }
    
    console.log("🔍 Buscando oponente...");
    pokemonsRival.innerHTML = '<h2>🔍 Buscando oponente...</h2>';
    oponenteConectado = false;
    cartasOponente = [];
    
    channel.publish("jugador_conectado", {
        jugadorId: ably.auth.clientId,
        cartas: misCartas,
        timestamp: Date.now()
    });
    
    actualizarBotones();
    mostrarExito("Buscando oponente...");
    
    setTimeout(() => {
        if (!oponenteConectado) {
            pokemonsRival.innerHTML = '<h2>❌ No se encontró oponente</h2>';
        }
    }, 5000);
}

function desconectar() {
    console.log("🚪 Desconectando...");
    
    // ENVIAR NOTIFICACIÓN AL OPONENTE ANTES DE DESCONECTAR
    if (channel && ably && conectado) {
        channel.publish("jugador_desconectado", {
            jugadorId: ably.auth.clientId,
            timestamp: Date.now()
        });
        console.log("📡 Notificación de desconexión enviada");
    }
    
    // ESPERAR UN MOMENTO Y LUEGO DESCONECTAR
    setTimeout(() => {
        // Cerrar Ably
        if (ably) {
            ably.connection.close();
            ably = null;
        }
        
        // Resetear estado
        conectado = false;
        oponenteConectado = false;
        cartasOponente = [];
        cartaSeleccionada = null;
        channel = null;
        
        // Limpiar UI
        actualizarEstadoConexion('desconectado');
        actualizarCartaSeleccionada(null);
        pokemonsRival.innerHTML = '<h2>Desconectado</h2>';
        
        document.querySelectorAll('.carta').forEach(carta => carta.classList.remove('sombra'));
        actualizarBotones();
        
        mostrarExito("Desconectado del servidor");
        console.log("✅ Desconectado completamente");
    }, 300);
}

function actualizarMazos(cartaRecibida, cartaEntregada) {
    localStorage.setItem(cartaEntregada, "false");
    localStorage.setItem(cartaRecibida, "true");
    
    misCartas = misCartas.filter((id) => id !== cartaEntregada);
    misCartas.push(parseInt(cartaRecibida));

    cargarPokemons();
    cartaSeleccionada = null;
    actualizarCartaSeleccionada(null);
    actualizarBotones();

    if (channel) {
        setTimeout(() => {
            channel.publish("actualizar_lista", {
                jugadorId: ably.auth.clientId,
                cartas: misCartas,
            });
        }, 500);
    }
}

// ========== CONFIGURACIÓN DE EVENTOS ==========

function configurarEventosAbly() {
    // Conexión establecida
    ably.connection.on("connected", () => {
        console.log("Conectado a Ably");
        conectado = true;
        actualizarEstadoConexion('conectado');
        actualizarBotones();
        mostrarExito("Conectado al servidor");
    });

    // Error de conexión
    ably.connection.on("failed", () => {
        console.error("Error de conexión");
        mostrarError("No se pudo conectar");
        actualizarEstadoConexion('desconectado');
        actualizarBotones();
    });

    // Desconexión inesperada
    ably.connection.on("disconnected", () => {
        console.log("Desconectado inesperadamente");
        conectado = false;
        oponenteConectado = false;
        actualizarEstadoConexion('desconectado');
        actualizarBotones();
    });
}

function configurarEventosCanal() {
    // Jugador conectado
    channel.subscribe("jugador_conectado", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            console.log("🎮 Oponente encontrado:", mensaje.data.jugadorId);
            cartasOponente = mensaje.data.cartas;
            mostrarCartasOponente(cartasOponente);
            mostrarExito("¡Oponente encontrado!");
            
            // Responder con mis cartas
            setTimeout(() => {
                channel.publish("actualizar_lista", {
                    jugadorId: ably.auth.clientId,
                    cartas: misCartas,
                });
            }, 500);
        }
    });

    // Lista actualizada
    channel.subscribe("actualizar_lista", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            cartasOponente = mensaje.data.cartas;
            mostrarCartasOponente(cartasOponente);
        }
    });

    // Jugador desconectado
    channel.subscribe("jugador_desconectado", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            console.log("🔌 Oponente desconectado:", mensaje.data.jugadorId);
            
            oponenteConectado = false;
            cartasOponente = [];
            
            pokemonsRival.innerHTML = '<h2>🔌 Oponente desconectado</h2><p style="text-align: center; color: #666;">El otro jugador se desconectó.</p>';
            
            if (cartaSeleccionada) {
                document.querySelectorAll('.carta').forEach(carta => carta.classList.remove('sombra'));
                cartaSeleccionada = null;
                actualizarCartaSeleccionada(null);
            }
            
            actualizarBotones();
            mostrarError("El oponente se desconectó");
        }
    });

    // Oferta de carta
    channel.subscribe("oferta_carta", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            const { cartaId } = mensaje.data;
            const confirmacion = confirm(
                `¿Aceptas intercambiar tu carta (#${cartaSeleccionada || 'ninguna'}) por la carta #${cartaId}?`
            );

            if (confirmacion && cartaSeleccionada) {
                channel.publish("aceptar_intercambio", {
                    jugadorId: ably.auth.clientId,
                    miCarta: cartaSeleccionada,
                    cartaOponente: cartaId
                });
                actualizarMazos(cartaId, cartaSeleccionada);
            } else {
                channel.publish("cancelar_intercambio", {
                    jugadorId: ably.auth.clientId,
                });
            }
        }
    });

    // Intercambio aceptado
    channel.subscribe("aceptar_intercambio", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            const cartaRecibida = mensaje.data.miCarta;
            const cartaEntregada = mensaje.data.cartaOponente;
            mostrarExito(`¡Intercambio exitoso! Recibiste carta #${cartaRecibida}`);
            if (localStorage.getItem(cartaEntregada) === "true") {
                actualizarMazos(cartaRecibida, cartaEntregada);
            }
        }
    });

    // Intercambio cancelado
    channel.subscribe("cancelar_intercambio", (mensaje) => {
        if (mensaje.data.jugadorId !== ably.auth.clientId) {
            mostrarError("El oponente rechazó el intercambio");
        }
    });
}

// ========== EVENT LISTENERS DE BOTONES ==========

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar cartas si no existen
    let cartasEnStorage = 0;
    for (let i = 1; i <= 151; i++) {
        if (localStorage.getItem(i) === "true") cartasEnStorage++;
    }
    
    if (cartasEnStorage === 0) {
        const cartasPrueba = [1, 4, 7, 25, 150, 6, 9, 131];
        cartasPrueba.forEach(id => localStorage.setItem(id, "true"));
        localStorage.setItem('initialized', 'true');
        mostrarExito(`${cartasPrueba.length} cartas de prueba inicializadas`);
    }
    
    cargarPokemons();
    actualizarEstadoConexion('desconectado');
    actualizarBotones();
    
    // Botón conectar
    document.getElementById("conector").addEventListener("click", function () {
        if (typeof Ably === 'undefined') {
            mostrarError("Ably no disponible");
            return;
        }
        
        this.disabled = true;
        this.textContent = "Conectando...";
        actualizarEstadoConexion('conectando');

        try {
            ably = new Ably.Realtime({
                key: "uqRJZg.KHwvcQ:4pn-u1lwqY4mjeUUm-A2zyX3bK7ZS1U_XwTgrHIZ_DU",
                clientId: 'player_' + Math.random().toString(36).substr(2, 9)
            });
            
            channel = ably.channels.get("canal-intercambio");
            
            configurarEventosAbly();
            configurarEventosCanal();
            
        } catch (error) {
            console.error("Error conectando:", error);
            mostrarError("Error de conexión");
            actualizarEstadoConexion('desconectado');
            this.disabled = false;
            this.textContent = "🔗 Conectar al Servidor";
        }
    });

    // Botón buscar oponente
    const botonBuscar = document.getElementById("buscar-oponente");
    if (botonBuscar) {
        botonBuscar.onclick = buscarOponente;
    }

    // Botón desconectar
    const botonDesconectar = document.getElementById("desconectar");
    if (botonDesconectar) {
        botonDesconectar.onclick = desconectar;
    }

    // Botón intercambio
    document.getElementById("intercambio").addEventListener("click", function () {
        if (!conectado || !cartaSeleccionada || !oponenteConectado) {
            mostrarError("Verifica: conexión, carta seleccionada y oponente");
            return;
        }

        channel.publish("oferta_carta", {
            jugadorId: ably.auth.clientId,
            cartaId: cartaSeleccionada
        });
        
        mostrarExito(`Oferta enviada: Carta #${cartaSeleccionada}`);
        this.style.display = "none";
    });
    
    console.log("Sistema de intercambio cargado");
});

// Funciones globales para debug
window.buscarOponente = buscarOponente;
window.desconectar = desconectar;
window.actualizarBotones = actualizarBotones;