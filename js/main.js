import { generarCodigo, extraerVariables } from "./parser.js";
import { evaluar } from "./evaluador.js";

const $ = (id) => document.getElementById(id);

const campoExpresion = $("expresion");
const contenedorVariables = $("variables");
const alerta = $("alerta");
const seccionResultados = $("resultados");
const valorResultado = $("valor-resultado");
const cuerpoCuadruplos = $("cuerpo-cuadruplos");
const cuerpoTriplos = $("cuerpo-triplos");

// ---------- Alertas ----------
let temporizador;

function mostrarAlerta(texto, tipo = "error") {
  alerta.textContent = texto;
  alerta.className = `alerta ${tipo}`;
  alerta.hidden = false;
  clearTimeout(temporizador);
  if (tipo === "exito") temporizador = setTimeout(ocultarAlerta, 3000);
}

function ocultarAlerta() {
  alerta.hidden = true;
}

// ---------- Variables ----------
function actualizarVariables() {
  const guardados = {};
  contenedorVariables.querySelectorAll("input").forEach((input) => {
    guardados[input.dataset.variable] = input.value;
  });

  contenedorVariables.innerHTML = "";
  extraerVariables(campoExpresion.value).forEach((nombre) => {
    const etiqueta = document.createElement("label");
    etiqueta.className = "variable";
    etiqueta.textContent = `${nombre} =`;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.dataset.variable = nombre;
    input.value = guardados[nombre] ?? 1;

    etiqueta.appendChild(input);
    contenedorVariables.appendChild(etiqueta);
  });
}

function leerValores() {
  const valores = {};
  contenedorVariables.querySelectorAll("input").forEach((input) => {
    if (input.value === "") throw new Error(`Falta el valor de "${input.dataset.variable}".`);
    valores[input.dataset.variable] = Number(input.value);
  });
  return valores;
}

// ---------- Tablas ----------
const celda = (contenido, clase = "") => `<td class="${clase}">${contenido}</td>`;
const esReferencia = (texto) => /^t\d+$/.test(texto) || /^\(\d+\)$/.test(texto);
const claseDe = (texto) => (esReferencia(texto) ? "ref" : "");

const comoCuadruplo = (operando) =>
  operando.ref !== undefined ? `t${operando.ref + 1}` : operando.nombre;

const comoTriplo = (operando) =>
  operando.ref !== undefined ? `(${operando.ref})` : operando.nombre;

function filaCuadruplo(instruccion, i) {
  if (instruccion.op === "=") {
    const origen = comoCuadruplo(instruccion.a1);
    return `<tr>${celda(i)}${celda("=", "op")}${celda(origen, claseDe(origen))}${celda("-")}${celda(instruccion.destino)}</tr>`;
  }

  const arg1 = comoCuadruplo(instruccion.a1);
  const arg2 = instruccion.a2 ? comoCuadruplo(instruccion.a2) : "-";
  return `<tr>${celda(i)}${celda(instruccion.op, "op")}${celda(arg1, claseDe(arg1))}${celda(arg2, claseDe(arg2))}${celda(`t${i + 1}`, "ref")}</tr>`;
}

function filaTriplo(instruccion, i) {
  if (instruccion.op === "=") {
    const origen = comoTriplo(instruccion.a1);
    return `<tr>${celda(i)}${celda("=", "op")}${celda(instruccion.destino)}${celda(origen, claseDe(origen))}</tr>`;
  }

  const arg1 = comoTriplo(instruccion.a1);
  const arg2 = instruccion.a2 ? comoTriplo(instruccion.a2) : "-";
  return `<tr>${celda(i)}${celda(instruccion.op, "op")}${celda(arg1, claseDe(arg1))}${celda(arg2, claseDe(arg2))}</tr>`;
}

// ---------- Acciones ----------
function calcular() {
  ocultarAlerta();
  seccionResultados.hidden = true;

  try {
    const instrucciones = generarCodigo(campoExpresion.value);
    const { destino, valor } = evaluar(instrucciones, leerValores());

    cuerpoCuadruplos.innerHTML = instrucciones.map(filaCuadruplo).join("");
    cuerpoTriplos.innerHTML = instrucciones.map(filaTriplo).join("");
    valorResultado.innerHTML = `${destino ?? "Resultado"} = <b>${Number(valor.toFixed(6))}</b>`;

    seccionResultados.hidden = false;
    mostrarAlerta("Operación calculada correctamente.", "exito");
  } catch (error) {
    mostrarAlerta(error.message);
  }
}

function limpiar() {
  campoExpresion.value = "";
  actualizarVariables();
  ocultarAlerta();
  seccionResultados.hidden = true;
  campoExpresion.focus();
}

// ---------- Eventos ----------
$("btn-calcular").addEventListener("click", calcular);
$("btn-limpiar").addEventListener("click", limpiar);
campoExpresion.addEventListener("input", actualizarVariables);
campoExpresion.addEventListener("keydown", (e) => {
  if (e.key === "Enter") calcular();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    campoExpresion.value = chip.textContent;
    actualizarVariables();
    calcular();
  });
});

actualizarVariables();