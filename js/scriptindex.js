
/*cargar los pokemon desde la API*/

const pokemons = document.querySelector("#pokemons");
const URL = "https://pokeapi.co/api/v2/pokemon/";
const datosPokemons = [];



const inputBuscador = document.querySelector(".buscador");
//Filtrar tipos
const tipoItems = document.querySelectorAll(".pokemon-type");

for (let i = 0; i <= 151; i++) {
	fetch(URL + i)
		.then((response) => response.json())
		.then((data) => {
			datosPokemons.push(data);

			
			if (datosPokemons.length === 151) {
				datosPokemons
					.sort((a, b) => a.id - b.id)
					.forEach((poke) => {
						if (localStorage.getItem(poke.id) === "true") {
							mostrarPokemonEncontrado(poke);
						} else {
							mostrarPokemonNoEncontrado(poke);
						}
					});
			}
		});
}

function mostrarPokemonNoEncontrado(data) {
	const article = document.createElement("article");
	article.classList.add("cardNoFound");
	article.innerHTML = `
		<h2 id="id">#${data.id}</h2>
		<p id="???">???</p>
	`;
	pokemons.append(article);
}

function mostrarPokemonEncontrado(data) {
    const article = document.createElement("article");
    article.classList.add("cardFound");
    article.innerHTML = `
        <h2>${data.name}</h2>
        <img
            src="${data.sprites.other["official-artwork"].front_default}"
            alt="Card ${data.id}"
            class="imagen-card"
        />
        <p>#${data.id}</p>
        <div class="card-types">
            ${data.types.map((type) => `<p>${type.type.name}</p>`).join("")}
        </div>
    `;
    
  
    article.addEventListener("click", () => {
       ModalPokemon(data);
    });
    
    pokemons.append(article);
}

function ModalPokemon(pokemon) {
    const dialog = document.getElementById("card-dialog");

    //inserta el nombre y el id de la carta seleccionada
    document.getElementById("dialog-name").textContent =
        pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    document.getElementById("dialog-id").textContent =
        `#${pokemon.id.toString().padStart(3, '0')}`;

    //carga la imagen
    const dialogImage = document.getElementById("dialog-image");
    dialogImage.src = pokemon.sprites.other["official-artwork"].front_default;
    dialogImage.alt = pokemon.name;

    // muestra los tipos
    const dialogTypes = document.getElementById("dialog-types");
    dialogTypes.innerHTML = '';
    pokemon.types.forEach(type => {
        const typeElement = document.createElement("p");
        typeElement.textContent = type.type.name;
		typeElement.classList.add("modal-type");
        dialogTypes.appendChild(typeElement);
    });

    // stats
    const dialogStats = document.getElementById("dialog-stats");
    dialogStats.innerHTML = '';
    pokemon.stats.forEach(stat => {
        const statElement = document.createElement("div");
        statElement.innerHTML = `
            <span>${stat.stat.name}:</span>
            <span>${stat.base_stat}</span>
        `;
        dialogStats.appendChild(statElement);
    });

    //habs
    const dialogAbilities = document.getElementById("dialog-abilities");
    dialogAbilities.innerHTML = '';
    pokemon.abilities.forEach(ability => {
        const abilityElement = document.createElement("p");
        abilityElement.textContent = ability.ability.name.replace(/-/g, ' ');
        dialogAbilities.appendChild(abilityElement);
    });

   
    dialog.showModal();

    
    const closeButton = dialog.querySelector(".close-button");
    closeButton.addEventListener("click", () => {
        dialog.close();
    });

    
    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) {
            dialog.close();
        }
    });
}


//buscar por nombre
inputBuscador.addEventListener("input", (e) => {
	const textousuario = e.target.value.toLowerCase();
	const tipos = document.querySelectorAll(".cardFound");

	tipos.forEach((carta) => {
		const nombre = carta.querySelector("h2").textContent.toLowerCase();
		if (nombre.includes(textousuario)) {
			carta.style.display = "block";
		} else {
			carta.style.display = "none";
		}
		
	});
});

//filtrar tipos

tipoItems.forEach((item) => {
	item.addEventListener("click", () => {
		const tipoSeleccionado = item.textContent.toLowerCase();

		const tarjetas = document.querySelectorAll(".cardFound");

		tipoItems.forEach((el) => el.classList.remove("activo"));

		// Añade clase activo al seleccionado
		item.classList.add("activo");



		tarjetas.forEach((carta) => {
			const tipos = Array.from(carta.querySelectorAll(".card-types p"))
				.map((t) => t.textContent.toLowerCase());

			if (
				tipoSeleccionado === "all" ||
				tipos.includes(tipoSeleccionado) ||
				tipoSeleccionado === "???"
			) {
				carta.style.display = "block";
			} else {
				carta.style.display = "none";
			}
		});
	});
});


/*<article id="pokemon" class="card">
		<h2 id="id">#001</h2>
		<p id="???">???</p>
	</article> 
*/

/*<article class="cardFound">
	<h2>bulbasaur</h2>
	<img
	src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
	alt="Card 1"
	class="imagen-card"
	/>
	<p>1</p>
	<div class="card-types">
		<p>tipo</p>
		<p>tipo</p>
	</div>
	<p>ataque.</p>
</article>*/
