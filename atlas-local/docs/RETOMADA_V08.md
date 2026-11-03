# Retomada V08

Pedido: menu drop-down com assets para o mestre colocar no mapa, tokens básicos
coloridos sem realismo e pesquisa de padrões reconhecidos de UI/UX.

Implementado: oito PNGs com transparência; catálogo; seletor com busca,
categorias/favoritos/recentes; inserção em lote; posicionamento por clique,
inserção imediata e arrastar/soltar; cancelamento; desfazer última inserção;
armadilha inicialmente oculta; seleção de aparência no editor existente.

Backend: appearance opcional validada contra IDs do catálogo. Tokens sem esse
campo continuam válidos. Não aceitar URLs livres. Filtragem de tokens ocultos
continua no servidor. Nenhuma migração de esquema.

Módulos: web/combat/asset-library.mjs, token-model.mjs e token_assets.py.
Artes e catálogo: web/tokens/. Prompts, referências e instruções em docs/.

Preservar os 509 itens anteriores, os dados em data/, a execução local/Radmin,
GitHub pausado e entrega em três ZIPs normais. As novas artes ficam no pacote
do sistema, sem reescrever o manifesto do acervo de campanha.

Limitações: sem upload de novos modelos pelo seletor; sem estatísticas oficiais
de monstros; sem efeitos automáticos de armadilhas; favoritos locais ao navegador;
desfazer somente a última inserção na revisão ainda inalterada.

Validação detalhada em VALIDACAO_V08.md. Pesquisa distingue padrões reconhecidos
de validação efetiva com usuários; testes automatizados não são testes de usabilidade.
