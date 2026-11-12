# Auditoria do menu Combate — CP16

Inspeção de web/combat.js, workspace.js, combat-panels.mjs e token-menu.mjs.

| Recurso | Local atual | Decisão |
|---|---|---|
| Ativar/desativar combate e ligar grid ao ativar | combat-mode no menu Combate | Manter: controla state.enabled, grid, movimento e ferramentas |
| Criação de token simples | quick-token no menu Combate, apenas mestre | Manter: fluxo independente da biblioteca de imagens |
| Seleção e controles de tokens | Condições para mestre; Combate para jogador | Manter: não remover acesso do jogador sem destino equivalente |
| Iniciativa, ordenação, turnos, rodadas | Painel Iniciativa e janela flutuante | Já separado; preservar |
| Grid, escala, limite de movimento e terreno | Painel Grid, mestre | Já separado; preservar |
| Condições | Painel Condições | Já separado; preservar |
| Histórico de combate | Painel Histórico, acesso em Combate e atalhos | Preservar: undo/redo e estado persistido |
| PV/PD, visão, vínculo, morte e exclusão | Contexto do token | Já disponível; CP16 amplia PV/PD para controlador autorizado |

O menu independente ainda possui funções efetivas. Removê-lo agora exigiria migrar controles e revisar handlers/IDs e permissões. Pela condição C2, permanece nesta versão; nenhuma função removida. Não foi criada outra navegação de combate.
