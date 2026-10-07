// Nombre con el que se guarda en el navegador el tema elegido ("light" o "dark").
export const THEME_KEY = "unmate-theme";

// Script mínimo que layout.tsx pone en el <head>: aplica el tema guardado
// antes de pintar la página, para que no haya un parpadeo del otro tema.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
