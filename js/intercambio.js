const pokemons = document.querySelector("#pokemons");
const pokemonsRival = document.querySelector("#pokemons-rival");
const URL = "https://pokeapi.co/api/v2/pokemon/";

let misCartas = []; // IDs de mis cartas
let cartasOponente = []; // IDs de las cartas del oponente (que se irán recibiendo)
let cartaSeleccionada = null;

function cargarPokemons() {
	misCartas = [];
	for (let i = 1; i <= 151; i++) {
		fetch(URL + i)
			.then((response) => response.json())
			.then((data) => {
				if (localStorage.getItem(i) === "true") {
					misCartas.push(i); // Guardar el ID de la carta
					mostrarPokemonDisponible(data);
				}
			});
	}
	console.log("Mis cartas:", misCartas);
}

function cargarPokemonsRivales() {
	for (let i = 1; i <= 151; i++) {
		fetch(URL + i)
			.then((response) => response.json())
			.then((data) => {
				if (localStorage.getItem(i) === "true") {
					mostrarPokemonRivalesDisponible(data);
				}
			});
	}
}

function mostrarPokemonDisponible(pokemon) {
	const carta = document.createElement("article");
	carta.classList.add("carta");
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
	// Limpiar el contenedor de cartas rivales
	pokemonsRival.innerHTML = "<h2>Cartas del Oponente</h2>";

	cartasIds.forEach((id) => {
		fetch(URL + id)
			.then((response) => response.json())
			.then((data) => {
				const carta = document.createElement("article");
				carta.classList.add("carta");
				carta.dataset.id = data.id;
				carta.innerHTML = `
                    <img src="${data.sprites.front_default}" alt="${
					data.name
				}" />
                    <p>#${data.id.toString().padStart(3, "0")}</p>
                    <p>${data.name}</p>  
                `;
				pokemonsRival.appendChild(carta);
			});
	});
}

function cargarCartasRivales(ids) {
	pokemonsRival.innerHTML = ""; // Limpiar contenedor
	ids.forEach((id) => {
		fetch(URL + id)
			.then((response) => response.json())
			.then((data) => {
				mostrarPokemonRivalesDisponible(data);
			});
	});
}

function seleccionarCarta(pokemonId) {
	cartaSeleccionada = pokemonId;
	console.log(`Carta seleccionada: #${pokemonId}`);
	// Opcional: Resaltar la carta seleccionada con CSS
	document.getElementById("intercambio").style.display = "block";
}

document.getElementById("conector").addEventListener("click", function () {
	// Deshabilitar el botón (opcional, si quieres evitar acción múltiple)
	this.disabled = true;
	// Ocultar el botón
	this.style.display = "none";

	cargarPokemonsRivales();

	const ably = new Ably.Realtime(
		"uqRJZg.KHwvcQ:4pn-u1lwqY4mjeUUm-A2zyX3bK7ZS1U_XwTgrHIZ_DU"
	);
	window.channel = ably.channels.get("canal-prueba");

	ably.connection.on("connected", () => {
		console.log("Conectado a Ably");

		channel.publish("jugador_conectado", {
			jugadorId: ably.auth.clientId,
			cartas: misCartas, // Enviamos el array de IDs
		});
	});

	channel.subscribe("actualizar_lista", (mensaje) => {
		if (mensaje.data.jugadorId !== ably.auth.clientId) {
			cartasOponente = mensaje.data.cartas;
			cargarCartasRivales(cartasOponente);
		}
	});

	channel.subscribe("jugador_conectado", (mensaje) => {
		if (mensaje.data.jugadorId !== ably.auth.clientId) {
			cartasOponente = mensaje.data.cartas; // Guardar las cartas del oponente
			mostrarCartasOponente(cartasOponente); // Función para mostrar
		}
	});

	// Escuchar ofertas del oponente
	channel.subscribe("oferta_carta", (mensaje) => {
		const { jugadorId, cartaId } = mensaje.data;
		const confirmacion = confirm(
			`¿Aceptas intercambiar tu carta por #${cartaId}?`
		);

		if (confirmacion) {
			channel.publish("aceptar_intercambio", {
				jugadorId: ably.auth.clientId,
				cartaId: cartaSeleccionada, // Tu carta ofrecida
			});
		} else {
			channel.publish("cancelar_intercambio", {
				jugadorId: ably.auth.clientId,
			});
		}
	});

	// Escuchar confirmación del oponente
	channel.subscribe("aceptar_intercambio", (mensaje) => {
		if (mensaje.data.jugadorId !== ably.auth.clientId) {
			alert(`¡Intercambio exitoso! Recibiste #${mensaje.data.cartaId}`);
			// Actualizar la UI (eliminar tu carta y añadir la nueva)
			actualizarMazos(mensaje.data.cartaId, cartaSeleccionada);
		}
	});
});

// Función para actualizar mazos usando listas
function actualizarMazos(cartaRecibida, cartaEntregada) {
	// Actualizar mis listas
	misCartas = misCartas.filter((id) => id !== cartaEntregada);
	misCartas.push(parseInt(cartaRecibida));

	// Actualizar localStorage
	localStorage.setItem(cartaEntregada, "false");
	localStorage.setItem(cartaRecibida, "true");

	// Actualizar UI
	pokemons.innerHTML = "";
	cargarPokemons(); // Recargar mis cartas

	// Notificar al oponente de la actualización
	channel.publish("actualizar_lista", {
		jugadorId: ably.auth.clientId,
		cartas: misCartas,
	});
}

document.addEventListener("DOMContentLoaded", () => {
	cargarPokemons();
	document.getElementById("conector").style.display = "block"; // Mostrar el botón al cargar
});
