// src/scripts/mapa.ts
// Permiso para cargar el mapa de Google (instala cookies de terceros, así que
// solo se carga cuando la persona lo pide). Lo usan Ubication.astro (dar el
// permiso) y RevocarMapa.astro (retirarlo, en la política de cookies).
// Si cambias la clave o la forma de guardarla, actualiza también la política
// de cookies, que la nombra.
//
// El permiso es la mera existencia de la clave en localStorage: el valor da
// igual. Todo va en try/catch porque el almacenamiento puede estar bloqueado
// (modo privado, ajustes del navegador); entonces no hay permiso guardado.

const CLAVE = "deleic-mapa";

export function permisoMapa(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== null;
  } catch {
    return false;
  }
}

export function darPermisoMapa(): void {
  try {
    localStorage.setItem(CLAVE, "1");
  } catch {
    // Sin almacenamiento el mapa se carga igual, solo que no se recuerda
  }
}

export function retirarPermisoMapa(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento no había nada guardado que retirar
  }
}
