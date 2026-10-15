// A pergunta do apelido, na primeira vez. É HTML por cima do jogo (o Phaser
// não tem campo de texto): o teclado do celular funciona e o leitor de tela
// enxerga.

import { t } from "../i18n/textos";
import { limparApelido } from "../logica/fila";

export interface RespostaDoApelido {
  apelido?: string;
}

/**
 * Mostra a caixa e espera. `tentar` recebe o apelido e devolve uma mensagem
 * de erro (a caixa continua aberta, mostrando-a) ou nada (a caixa fecha).
 * "Jogar sem salvar" fecha sem apelido.
 */
export function perguntarApelido(tentar: (apelido: string) => Promise<string | undefined>): Promise<RespostaDoApelido> {
  const caixa = document.getElementById("apelido")!;
  const titulo = caixa.querySelector<HTMLElement>("[data-titulo]")!;
  const explicacao = caixa.querySelector<HTMLElement>("[data-explicacao]")!;
  const campo = caixa.querySelector<HTMLInputElement>("input")!;
  const entrar = caixa.querySelector<HTMLButtonElement>("[data-entrar]")!;
  const pular = caixa.querySelector<HTMLButtonElement>("[data-pular]")!;
  const erro = caixa.querySelector<HTMLElement>("[data-erro]")!;

  titulo.textContent = t("apelido.titulo");
  explicacao.textContent = t("apelido.explicacao");
  campo.placeholder = t("apelido.exemplo");
  entrar.textContent = t("apelido.entrar");
  pular.textContent = t("apelido.pular");
  erro.textContent = "";
  caixa.hidden = false;
  campo.focus();

  return new Promise((resolver) => {
    const fechar = (resposta: RespostaDoApelido) => {
      caixa.hidden = true;
      entrar.onclick = null;
      pular.onclick = null;
      campo.onkeydown = null;
      resolver(resposta);
    };
    const confirmar = async () => {
      const apelido = limparApelido(campo.value);
      if (!apelido) {
        erro.textContent = t("apelido.vazio");
        return;
      }
      entrar.disabled = true;
      entrar.textContent = t("apelido.entrando");
      const falha = await tentar(apelido);
      entrar.disabled = false;
      entrar.textContent = t("apelido.entrar");
      if (falha) {
        erro.textContent = t("apelido.falhou");
        console.warn("Conta não criada:", falha);
        return;
      }
      fechar({ apelido });
    };
    entrar.onclick = () => void confirmar();
    campo.onkeydown = (evento) => {
      if (evento.key === "Enter") void confirmar();
    };
    pular.onclick = () => fechar({});
  });
}
