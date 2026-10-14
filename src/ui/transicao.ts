// Troca de cena com escurecimento, à prova de clique duplo: a cena que já
// está saindo ignora o segundo pedido.

import Phaser from "phaser";

const saindo = new WeakSet<Phaser.Scene>();

export function trocarDeCena(cena: Phaser.Scene, destino: string, dados?: object, ms = 500): void {
  if (saindo.has(cena)) return;
  saindo.add(cena);
  cena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => saindo.delete(cena));
  cena.cameras.main.fadeOut(ms, 0, 0, 0);
  cena.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => cena.scene.start(destino, dados));
}
