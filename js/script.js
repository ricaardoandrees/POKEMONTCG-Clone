/*abrir dialog (información extendida del pókemon)*/
/*const dialog = document.getElementById("card-dialog");
const openDialog = document.getElementById("openDialog");

openDialog.addEventListener("click", () => {
	dialog.showModal();
});*/

/*cargar los pokemon desde la API*/

const pokemons = document.querySelector("#pokemons");
const URL = "https://pokeapi.co/api/v2/pokemon/";

for (let i = 1; i <= 151; i++) {
	fetch(URL + i)
		.then((response) => response.json())
		.then((data) => {
			if (localStorage.getItem(i) === "false") {
				mostrarPokemonNoEncontrado(data);
			} else {
				mostrarPokemonEncontrado(data);
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
		<p>${data.id}</p>
		<div class="card-types">
			${data.types.map((type) => `<p>${type.type.name}</p>`).join("")}
		</div>
		<p>${data.abilities.map((ability) => ability.ability.name).join("<br>")}</p>
	`;
	pokemons.append(article);
}

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
