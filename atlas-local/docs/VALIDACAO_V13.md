# Validação V13 — 25/10/2026

- 36 testes Python aprovados com PDF real da campanha, sem pular o teste do modelo.
- 8 testes JavaScript aprovados: geometria hexagonal, caminhos, custos e catálogo.
- Sete suítes Chromium aprovadas: ui_character_links, ui_workspace, ui_assets, ui_history, ui_combat_live, ui_fog e ui_smoke.
- Vínculo testado pela interface com responsável, recursos sincronizados entre jogador/mestre, seleção de habilidades, preservação manual, PDF, celular, desvincular/desfazer e persistência.
- Servidor: vínculo inexistente/malformado/de outra mesa recusado; autorização de movimento acompanha a ficha; troca de responsável, névoa, privacidade e undo/redo após mudança de nome/recursos verificados.
- Catálogo: 82 IDs únicos, descrições conferidas contra as linhas da fonte, nove raças e doze classes. Sentidos aguçados atribuído a Silvano; variantes mantidas dentro das habilidades principais.
- PDF: 168 campos mantidos e textos integrais no anexo. Golem/Engenheiro renderizados para inspeção, inclusive o texto longo de Autômato. Fontes incorporadas, cabeçalhos e paginação revisados. Interface revisada em desktop e celular; capturas apenas internas.
- O empacotador verifica hashes dos 509 registros de assets e oito imagens de tokens, CRC dos ZIPs e arquivos únicos entre as partes.

Não constitui auditoria completa de segurança. LAN/Radmin real entre computadores continua pendente. Transporte entre cenas, sincronização de condições e execução dos efeitos das habilidades não são incluídos nesta versão.
