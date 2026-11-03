# Validação V11 — 24/10/2026

- 24 testes Python aprovados, incluindo permissões, PDF preenchível real, navegação, movimento e histórico.
- 8 testes JavaScript aprovados, incluindo geometria, colocação, percurso e custo.
- Cinco suítes Chromium aprovadas: ui_workspace.cjs, ui_assets.cjs, ui_history.cjs, ui_combat_live.cjs e ui_smoke.cjs.
- Nova suíte verifica todos os painéis, identidade dos nós SVG/imagem, zoom e seleção preservados, rascunhos de chat/dados/caderno, biblioteca de tokens, undo/redo, permissões do jogador, chat ao vivo, turno e troca de mapa com painel aberto, Escape/foco e ausência de transbordamento horizontal no celular.
- Testes anteriores adaptados à navegação por ícones; continuam verificando inserção por clique/arrastar/lote, ocultação, edição, movimentos e custos, histórico, régua, reconexão, administração de mapas/acessos e ficha/PDF.
- Inspeção visual de desktop (1440×1000) e celular (390×844). Evidências são internas e não fazem parte da entrega.
- Corrigida uma corrida no carregamento dos painéis: o conteúdo fica temporariamente não interativo até a leitura inicial terminar, evitando substituir texto digitado antes da resposta do servidor.

Limites: testes usam contextos separados do navegador no mesmo ambiente, com usuários distintos. Teste real em PCs do usuário via Radmin continua pendente. Não se trata de auditoria completa de acessibilidade; nomes acessíveis, foco e redução de movimento foram implementados, mas não há certificação WCAG.

package_release.py verifica os hashes de 509 assets da campanha e oito artes de tokens, CRC de cada ZIP e ausência de arquivos duplicados/omitidos. O relatório VERIFICACAO.json acompanha a pasta de entrega.
