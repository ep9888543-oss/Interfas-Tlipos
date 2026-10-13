// Convierte una expresión en instrucciones de código intermedio.

const OPERADORES = "+-*/()=";

export function tokenizar(texto) {
  const tokens = [];
  let i = 0;

  while (i < texto.length) {
    const caracter = texto[i];

    if (/\s/.test(caracter)) {
      i++;
    } else if (/[A-Za-z_]/.test(caracter)) {
      const fin = buscarFin(texto, i, /\w/);
      tokens.push({ tipo: "id", valor: texto.slice(i, fin) });
      i = fin;
    } else if (/[0-9.]/.test(caracter)) {
      const fin = buscarFin(texto, i, /[0-9.]/);
      const valor = texto.slice(i, fin);
      if (Number.isNaN(Number(valor))) throw new Error(`Número no válido: "${valor}"`);
      tokens.push({ tipo: "num", valor });
      i = fin;
    } else if (OPERADORES.includes(caracter)) {
      tokens.push({ tipo: "op", valor: caracter });
      i++;
    } else {
      throw new Error(`Carácter no válido: "${caracter}"`);
    }
  }

  return tokens;
}

function buscarFin(texto, inicio, patron) {
  let fin = inicio;
  while (fin < texto.length && patron.test(texto[fin])) fin++;
  return fin;
}

const esAsignacion = (tokens) =>
  tokens.length > 1 && tokens[0].tipo === "id" && tokens[1].valor === "=";

// Variables que necesitan un valor (las del lado derecho de la expresión)
export function extraerVariables(texto) {
  try {
    const tokens = tokenizar(texto);
    const inicio = esAsignacion(tokens) ? 2 : 0;
    const ids = tokens.slice(inicio).filter((t) => t.tipo === "id").map((t) => t.valor);
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

// Analizador descendente recursivo: respeta precedencia y paréntesis.
// Devuelve una lista de instrucciones { op, a1, a2 } (y { op: "=", a1, destino }).
export function generarCodigo(texto) {
  const tokens = tokenizar(texto);
  if (tokens.length === 0) throw new Error("Escribe una expresión.");

  const instrucciones = [];
  let pos = 0;
  let destino = null;

  if (esAsignacion(tokens)) {
    destino = tokens[0].valor;
    pos = 2;
  }

  const mirar = () => tokens[pos];
  const tomar = () => tokens[pos++];
  const esOperador = (token, lista) => token?.tipo === "op" && lista.includes(token.valor);

  const emitir = (op, a1, a2) => {
    instrucciones.push({ op, a1, a2 });
    return { ref: instrucciones.length - 1 };
  };

  // expresion := termino (('+' | '-') termino)*
  const expresion = () => {
    let izquierda = termino();
    while (esOperador(mirar(), ["+", "-"])) {
      const op = tomar().valor;
      izquierda = emitir(op, izquierda, termino());
    }
    return izquierda;
  };

  // termino := factor (('*' | '/') factor)*
  const termino = () => {
    let izquierda = factor();
    while (esOperador(mirar(), ["*", "/"])) {
      const op = tomar().valor;
      izquierda = emitir(op, izquierda, factor());
    }
    return izquierda;
  };

  // factor := id | número | '(' expresion ')' | '-' factor
  const factor = () => {
    const token = tomar();
    if (!token) throw new Error("La expresión está incompleta.");

    if (token.tipo === "id" || token.tipo === "num") return { nombre: token.valor };

    if (token.valor === "(") {
      const interna = expresion();
      if (!esOperador(tomar(), [")"])) throw new Error("Falta cerrar un paréntesis.");
      return interna;
    }

    if (token.valor === "-") return emitir("minus", factor(), null);
    if (token.valor === "+") return factor();

    throw new Error(`No se esperaba "${token.valor}".`);
  };

  const resultado = expresion();
  if (pos < tokens.length) throw new Error(`No se esperaba "${tokens[pos].valor}".`);

  if (destino) {
    instrucciones.push({ op: "=", a1: resultado, destino });
  } else if (instrucciones.length === 0) {
    throw new Error("No hay operaciones para generar.");
  }

  return instrucciones;
}