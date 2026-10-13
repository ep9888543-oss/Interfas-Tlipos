// Ejecuta las instrucciones generadas por el parser y obtiene el resultado.

const OPERACIONES = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => {
    if (b === 0) throw new Error("División entre cero.");
    return a / b;
  },
  minus: (a) => -a,
};

export function evaluar(instrucciones, valores) {
  const temporales = [];
  let destino = null;
  let valor;

  const valorDe = (operando) => {
    if (operando.ref !== undefined) return temporales[operando.ref];
    const numero = Number(operando.nombre);
    return Number.isNaN(numero) ? valores[operando.nombre] : numero;
  };

  instrucciones.forEach((instruccion, i) => {
    if (instruccion.op === "=") {
      destino = instruccion.destino;
      valor = valorDe(instruccion.a1);
      return;
    }

    const a = valorDe(instruccion.a1);
    const b = instruccion.a2 ? valorDe(instruccion.a2) : undefined;
    temporales[i] = OPERACIONES[instruccion.op](a, b);
    valor = temporales[i];
  });

  return { destino, valor };
}