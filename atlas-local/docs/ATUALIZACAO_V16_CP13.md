# Atlas V16 — CP13

Atualização cumulativa baseada na CP12.2, incluindo WebSocket e os 114 tokens.

## O que mudou

- **Zoom:** gire a rodinha sobre o mapa. O ponto sob o cursor é mantido, respeitando os limites da imagem. Faixa de 25% a 400% do enquadramento. Os botões +, − e Ver mapa inteiro continuam disponíveis; pressionar a rodinha e arrastar continua navegando pelo mapa. A câmera é individual.
- **Tokens:** clique breve seleciona; outro token troca a seleção; clique repetido, clique vazio e Esc desselecionam. Arraste imediatamente para mover, com o mesmo custo de movimento e validação de terreno/névoa. Segure parado por aproximadamente 0,3 segundo e aponte para girar. Soltar confirma e libera a seleção após a rotação. Shift + clique no destino preserva a alternativa de movimento por cliques. Esc cancela o gesto em andamento.
- **Personagens:** cards compactos com retrato ao lado do nome. Arraste o card para o mapa ou use ＋ para inserir no centro visível. A inserção respeita encaixe hexagonal e procura uma posição livre próxima. Jogadores inserem apenas suas próprias fichas, em área visível, sem duplicar o mesmo personagem na cena. Mestres podem inserir cópias.
- **Imagem do personagem:** clique no retrato para escolher um token básico ou criar um retrato com imagem pelo recortador. Mestres também escolhem entre os retratos personalizados da mesa. A imagem é salva como padrão para novas inserções; não substitui automaticamente tokens já colocados. Cada jogador pode carregar a imagem apenas para sua própria ficha, sem ganhar acesso ao upload geral da mesa.
- **Tokens salvos:** botão direito → Salvar token. Novo acesso na lateral direita, exclusivo dos mestres, com busca, arrastar, inserir com ＋ e excluir modelo. Salva nome, aparência, cor, movimento e visão. Novas cópias começam vivas e sem condições, dano, vínculo de jogador ou movimento gasto. Modelos idênticos não se duplicam. Limite de 500 por mesa, separado dos 30 recentes.
- **Dados:** seção de histórico, paginação, exclusão e consulta periódica removidas do painel. Fórmulas, favoritos, visibilidade, animação e resultado atual permanecem. Os registros existentes no servidor não são apagados.

## Instalação

1. Feche o servidor e faça backup de `data/`.
2. Mescle a pasta `atlas-local` na instalação existente, substituindo os arquivos do programa.
3. Preserve `data/` e `campaign/`; este pacote não inclui mapas/documentos particulares.
4. Reinicie o Atlas e pressione Ctrl+F5 em todos os navegadores.

A inicialização cria a tabela de modelos salvos e acrescenta o campo de retrato às fichas existentes sem apagar os dados. As inserções de personagens participam do histórico de desfazer/refazer. Não há nova dependência além das da CP12.

## Referências de interação

- Roll20, Journal: personagem da lista lateral arrastado para o tabuleiro, com token padrão — https://wiki.roll20.net/Journal
- Roll20, Tabletop Overview: arrastar recursos para a cena — https://help.roll20.net/hc/en-us/articles/360039734913-Tabletop-Overview
- Foundry, Tokens e Game Controls: controle de tokens e separação entre navegação e manipulação — https://foundryvtt.com/article/tokens/ e https://foundryvtt.com/article/controls/

Aplicação no Atlas: retratos compactos, ação contextual para guardar modelos, zoom local e gestos distintos para movimento e rotação. O gesto de segurar para girar é uma adaptação ao pedido do projeto, não uma reprodução exata dos atalhos dessas plataformas.

## Checkpoint e validação

Código principal: `saved_tokens.py`, `characters.py`, `custom_tokens.py`, `combat.py`, `web/characters.js`, `web/combat.js`, `web/combat/camera.mjs`, `web/combat/token-rotation.mjs`, `web/combat/token-menu.mjs`, `web/session.js` e `web/workspace.js`.

Testes novos: zoom/limites/limpeza de eventos; clique sem captura; arrastar versus segurar para girar; autorização de fichas e modelos; inserção/duplicação/névoa/desfazer; upload restrito de retrato.

A validação visual interativa não foi concluída: Chromium encerrou ao iniciar por `socket() failed: Operation not permitted`. Nenhuma captura visual desta versão é apresentada como validada. Validar no Windows/Opera: zoom sob o cursor, troca rápida de seleção, arrasto com custo, rotação seguida de clique em outro token, arrasto do card com a lateral aberta, troca de retrato, salvar/reusar modelo e painel de dados sem histórico.

Resultado final: 94 testes Python executados, 92 aprovados e 2 ignorados por suporte PDF indisponível; 22 testes JavaScript aprovados. Todos os arquivos JavaScript passaram na checagem de sintaxe. ZIP verificado com `testzip()`.
