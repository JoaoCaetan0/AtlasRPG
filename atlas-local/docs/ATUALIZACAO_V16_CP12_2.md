# Atlas CP12.2 — texto dos tokens e arrasto do mapa

- Nomes e demais textos da área do mapa deixam de ser selecionáveis pelo navegador. Campos de edição, chat e menus continuam permitindo seleção de texto normalmente.
- O início da rotação do token bloqueia a seleção nativa e mantém o foco no mapa para permitir Escape.
- Segure o botão do meio (pressione a rodinha) e arraste para deslocar o mapa ampliado. O cursor muda para uma mão fechada. O gesto é interceptado antes das ferramentas de combate, régua e desenho.
- Soltar o botão, cancelar o ponteiro, trocar de cena ou perder o foco encerra o arrasto. A navegação altera apenas a sua câmera, sem mover tokens ou a tela dos outros jogadores.
- O deslocamento respeita os limites roláveis do mapa. Quando a imagem está totalmente enquadrada, não há área excedente para deslocar. Use os botões de zoom para ampliar.

Validação: 20 testes JavaScript aprovados, incluindo arrasto horizontal/vertical, liberação ao perder foco, preservação dos cliques esquerdo/direito, bloqueio de seleção e os testes anteriores de rotação. Não houve alteração no servidor nesta correção. Validação visual interativa continua pendente devido ao bloqueio de execução do Chromium já registrado na CP12.

Instalação: encerre o servidor, faça backup e mescle `atlas-local`, preservando `data/` e `campaign/`. Reinicie e pressione Ctrl+F5 em todos os navegadores. Esta versão inclui CP12.1, WebSocket e os 114 tokens. Se ainda não instalou as dependências da CP12, execute `ATUALIZAR_DEPENDENCIAS.bat`.
