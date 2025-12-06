// src/config/plantillas.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📋 PLANTILLAS - Formularios para servicios personalizados
 * ═══════════════════════════════════════════════════════════════
 */

module.exports = {
    curriculum: {
        nombre: "Currículum Vitae",
        precio: 1500,
        tiempo: "24-48 horas",
        campos: [
            "📌 *DATOS PERSONALES*",
            "• Nombre completo",
            "• Fecha de nacimiento",
            "• DNI",
            "• Dirección",
            "• Teléfono",
            "• Email",
            "",
            "🎓 *EDUCACIÓN*",
            "• Título/es obtenido/s",
            "• Institución",
            "• Año de egreso",
            "",
            "💼 *EXPERIENCIA LABORAL*",
            "• Puesto",
            "• Empresa",
            "• Período (desde-hasta)",
            "• Funciones principales",
            "",
            "🔧 *HABILIDADES*",
            "• Idiomas",
            "• Programas/herramientas",
            "• Competencias",
            "",
            "📷 *FOTO* (opcional)",
            "• Foto tipo carnet"
        ],
        instrucciones: [
            "1️⃣ Enviá los datos por WhatsApp",
            "2️⃣ O traé la información en papel al local",
            "3️⃣ Elegí un diseño (te mostramos opciones)",
            "4️⃣ Revisá y aprobá el diseño",
            "5️⃣ Retirá tu CV impreso"
        ]
    },
    
    invitacion: {
        nombre: "Invitaciones Personalizadas",
        precio_desde: 500,
        tiempo: "48-72 horas",
        campos: [
            "🎉 *DATOS DEL EVENTO*",
            "• Tipo de evento (cumpleaños, boda, etc.)",
            "• Nombre del festejado/a",
            "• Edad (si aplica)",
            "• Fecha del evento",
            "• Hora",
            "• Lugar/dirección",
            "",
            "🎨 *DISEÑO*",
            "• Tema/motivo preferido",
            "• Colores",
            "• Texto adicional",
            "",
            "📦 *CANTIDAD*",
            "• Número de invitaciones",
            "",
            "📷 *FOTO* (opcional)",
            "• Foto del festejado/a"
        ],
        instrucciones: [
            "1️⃣ Enviá los datos por WhatsApp",
            "2️⃣ Elegí diseño (te mostramos modelos)",
            "3️⃣ Confirmá cantidad y detalles",
            "4️⃣ Aprobá el diseño final",
            "5️⃣ Retirá tus invitaciones"
        ]
    },
    
    tarjeta: {
        nombre: "Tarjetas Personales",
        precio_desde: 800,
        tiempo: "24-48 horas",
        campos: [
            "👤 *DATOS*",
            "• Nombre completo",
            "• Profesión/cargo",
            "• Empresa/negocio",
            "• Teléfono",
            "• Email",
            "• Dirección (opcional)",
            "• Redes sociales (opcional)",
            "",
            "🎨 *DISEÑO*",
            "• Colores corporativos",
            "• Logo (si tenés)",
            "",
            "📦 *CANTIDAD*",
            "• Número de tarjetas"
        ],
        instrucciones: [
            "1️⃣ Enviá los datos por WhatsApp",
            "2️⃣ Enviá tu logo (si tenés)",
            "3️⃣ Elegí diseño",
            "4️⃣ Confirmá cantidad",
            "5️⃣ Retirá tus tarjetas"
        ]
    }
};