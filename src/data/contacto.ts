// src/data/contacto.ts
// Datos del negocio en un solo sitio: footer, ubicación y schema.org los leen de aquí

// Reservas por WhatsApp (formato internacional, sin "+")
export const WHATSAPP = "34647716971";

export const whatsapp = (
  mensaje = "Hola, me gustaría reservar una cita en Deleic.",
) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

export const TELEFONO ={ visible: "987 027 906", href: "tel:+34987027906" };

export const EMAIL = "deleic@outlook.es";

// Titular del sitio web (Aviso legal y Política de privacidad).
// Datos tomados de los textos legales de la web anterior (WordPress, ago. 2025).
// El domicilio es el que declara la titular, distinto del centro (DIRECCION):
// confirmar con ella que sigue vigente.
export const TITULAR = {
  nombre: "Leila Carreira López",
  nombreComercial: "Deleic",
  nif: "33557579G",
  domicilio: "C/ Gran Vía de San Marcos 33, bajo izq. int., 24001 León",
  // Nº de autorización de centro sanitario (Junta de Castilla y León), si el
  // centro la tiene por ofrecer medicina estética. Se muestra en el Aviso legal
  // solo cuando está rellenado. No inventar: pedirlo a la titular.
  registroSanitario: "",
};

export const DIRECCION = {
  calle: "Calle Roa de la Vega 18, bajo",
  cp: "24001",
  ciudad: "León",
  maps: "https://maps.app.goo.gl/8PsN3qRNrA8dv4Mv7",
};

export const HORARIO = {
  invierno: [
    { dias: "Lunes – Viernes", horas: "10:00 – 20:00" },
    { dias: "Sábado", horas: "10:00 – 14:00" },
    { dias: "Domingo", horas: null },
  ],
  periodoVerano: "15 jun – 15 sep",
  verano: [
    { dias: "Lunes – Viernes", horas: "10:00 – 19:00" },
    { dias: "Sábado", horas: null },
    { dias: "Domingo", horas: null },
  ],
};
