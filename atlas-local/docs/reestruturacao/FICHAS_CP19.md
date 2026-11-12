# Projeto e continuidade da ficha

## Inventário encontrado
characters.js: editor PDF com definições dinâmicas; grupos Identidade, Atributos, Recursos e defesa, Perícias, Poderes e magias, Inventário e Descrição/anotações; assistente de cálculo e habilidades de origem quando compatível. Dados por FormData, revisão otimista, cálculo debounced e exportação PDF após salvar.
system-profiles.js: editor genérico a partir de profile.fields/group/type/formula, com overrides. Permissões e cálculos continuam no servidor.
workspace.js: painel único, slots dedicados, minimização e preservação do editor ao alternar temporariamente com ferramentas. Estado de rascunho global e confirmação ao abandonar outra página genérica.

## Implementação
mountSheetWorkspace(form), compartilhado pelos dois editores, move os próprios nós para ferramentas/navegação, páginas e ações. Nenhum campo é clonado, renomeado ou desabilitado para ocultar uma seção. Busca não marca a ficha como alterada e não dispara cálculo. Invalid abre a página do campo antes do foco nativo.
CSS usa a presença de .sheet-workspace no workspace-content visível para ampliar somente a ficha; não depende de classe global que poderia ficar presa ao trocar de painel.

## Referências de organização
- Diretório separado da ficha e preservação de dados de atores: https://foundryvtt.com/article/actors/
- Edição de ficha durante a cena: https://foundryvtt.com/article/player-orientation/
- Referência consultada para navegação acessível: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
A implementação usa nav com botões nativos e aria-pressed; não anuncia roles de tabs sem implementar seu contrato de teclado. Tab/Enter/Espaço funcionam nativamente.

## Validação pendente
Executar ATLAS_BROWSER=/usr/bin/chromium node tests/ui_sheet_cp19.cjs em ambiente funcional. Testar também ficha real longa, zoom 200%, cálculos de raça/classe, preservação de habilidades manuais, PDF, salvar com conflito, falha de rede e minimizar/reabrir. Roteiros antigos ui_smoke/ui_character_links/ui_v16 incluem seletores anteriores a esta reorganização e precisam de atualização antes de serem usados como aprovação de ponta a ponta.
Não preencher distribuição de classe/Lótus ainda não conferida no livro. O pedido recebido termina em F2.

## Revisão CP20
Os três roteiros legados citados acima tiveram seus seletores de seções e retorno à lista atualizados. A execução em navegador real ainda está pendente. Salvamento agora usa runSheetSave, bloqueando envio duplicado e edição durante a requisição sem descartar campos em caso de falha.
