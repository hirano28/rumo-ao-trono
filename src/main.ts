import Phaser from "phaser";
import { Abertura } from "./cenas/Abertura";
import { Capitulos } from "./cenas/Capitulos";
import { Partida } from "./cenas/Partida";
import { Local } from "./cenas/Local";
import { Quarto } from "./cenas/Quarto";
import { Resultado } from "./cenas/Resultado";
import { Titulo } from "./cenas/Titulo";
import { ALTURA, COR, FONTES_A_CARREGAR, LARGURA } from "./ui/estilo";

async function iniciar(): Promise<void> {
  // O Phaser desenha texto em canvas: a fonte precisa estar carregada antes.
  // Sem rede, segue com as fontes de reserva.
  try {
    await Promise.race([
      Promise.all(FONTES_A_CARREGAR.map((fonte) => document.fonts.load(fonte))),
      new Promise((resolver) => setTimeout(resolver, 3000)),
    ]);
  } catch {
    // fontes de reserva
  }

  const jogo = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "jogo",
    width: LARGURA,
    height: ALTURA,
    backgroundColor: COR.noite,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Titulo, Capitulos, Abertura, Quarto, Local, Partida, Resultado],
  });
  // Para os testes de tela conferirem a cena atual.
  (window as unknown as { jogo: Phaser.Game }).jogo = jogo;
}

void iniciar();
