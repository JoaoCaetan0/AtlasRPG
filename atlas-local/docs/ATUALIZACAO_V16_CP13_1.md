# Atlas V16 — CP13.1

Atualização cumulativa da CP13 com 114 tokens.

- Visão inicial para cima (norte, 270° na geometria da cena). Tokens sem orientação definida passam a usar esse padrão. Orientações já configuradas e modelos salvos com direção explícita são preservados.
- A arte usa o topo como referência para acompanhar o cone: a aparência inicial fica em pé. Girar o token continua alterando sua visão e sincronizando a orientação.
- Removidos o seletor de direção e o botão Virar token do painel de névoa, além dos campos numéricos redundantes nos editores. Alterar alcance ou amplitude preserva a direção atual.
- Filtro de mapas compatível com os valores antigos Geográfico/Encontro e os atuais regional/encounter, incluindo acentos e diferenças de capitalização. Não modifica os arquivos nem reclassifica mapas desconhecidos.
- Subgrupos dos tokens passam a depender da categoria escolhida; combinações incompatíveis deixam de ser oferecidas. Modelos sem subgrupo usam sua categoria como grupo. Busca e favoritos/recentes continuam combinados por interseção; uma busca realmente sem correspondências continua vazia.
- Botão Limpar filtros na biblioteca de tokens.

## Atualizar

Feche o servidor, faça backup de data/ e mescle atlas-local na instalação. Preserve data/ e campaign/. Reinicie e pressione Ctrl+F5 nos navegadores.

## Checkpoint

Arquivos: web/files.js, web/combat/asset-library.mjs, web/combat/token-model.mjs, web/combat/renderer.mjs, web/combat/token-rotation.mjs, web/combat/token-menu.mjs, web/combat.js, combat.py e token_vision.py.

Regressões verificadas: tipos legados e atuais de mapas, todas as combinações válidas de categoria/subgrupo do catálogo de 114 tokens, modelos personalizados sem subgrupo, norte inicial, preservação de direção explícita, pixels do cone e sincronização. Os testes que usam uma cena voltada para leste agora declaram essa direção explicitamente, em vez de depender do antigo padrão.

A validação visual no navegador não está concluída neste ambiente. Conferir na mesa: combinar filtros; criar token novo com cone; girá-lo; ajustar alcance sem mudar direção; trocar mapas e verificar acesso dos jogadores.

Validação final: 95 testes Python executados, 93 aprovados e 2 ignorados (suporte PDF); 25 testes JavaScript aprovados. Checagem de sintaxe de todos os arquivos JS/MJS concluída. ZIP validado na criação.
