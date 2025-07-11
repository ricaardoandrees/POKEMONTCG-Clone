POKEMON TCG-CLONE
Integrantes: Ricardo Mejia, Samuel Di Cosmo, Leonardo Lezama
Este proyecto es una aplicación web que simula la experiencia de coleccionar, abrir sobres e intercambiar cartas de Pokémon, inspirada en el juego Pokémon TCG y realizado por estudiantes del 4to semestre de Ingeniería Informatica
     
  Funcionalidades:
    1.  Colección: Permite visualizar y obtener informacion detallada acerca de tu colección pokemon.
    2.  Sobres: Simula la apertura de sobres de cartas, donde obtendrás cartas de Pokémon aleatorios.
    3.  Intercambio: Proporciona un sistema para intercambiar cartas con otros usuarios en tiempo real.
    
    
  ¿Cómo usarla o visualizarla?
    
    Para visualizar la aplicación, simplemente abre el archivo index.html en tu navegador web preferido. No se requiere ninguna configuración adicional de servidor, ya
      que es una aplicación de cliente.
    
    Tecnologías y Herramientas
    
    *   HTML5: Para crear la estructura y contenido de las páginas web utilizadas.
    *   CSS3: Para el diseño y la presentación visual de las paginas
    *   JavaScript: Para la lógica interactiva del lado del cliente, la gestión de datos y la comunicación con APIs externas.
   
    Arquitectura 
   
   La aplicación sigue una arquitectura de Cliente-Servidor, teniendo componentes "CSS" donde se guardan estilos fundamentales del proyecto y "JS" donde se almacena la lógica del programa.   

    Librerías Utilizadas
   
    *   PokeAPI: Utilizada para obtener los datos de los Pokémon (nombres, imágenes, tipos, etc)
    *   Ably: Utilizada en intercambio.js para la comunicación en tiempo real, permitiendo el intercambio de cartas entre usuarios.