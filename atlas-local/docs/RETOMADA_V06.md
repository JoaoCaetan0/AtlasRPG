# Retomada após V06

A entrega final está nos três Atlas_Estigma_V06_Parte_N.zip. Extraia todos na mesma
pasta. Leia ATUALIZACAO_06.md e REQUISITOS_PENDENTES.md antes de continuar.
O checkpoint 01 é anterior ao editor visual e às correções finais: prefira a entrega.

Novos módulos: dice.py, admin.py, web/session.js, web/admin.js.
Schema SQLite 5: dice_rolls, table_settings, map_revisions, scene_context.
Fontes da criação continuam em rules.py e LIVRO_FONTE_CANVA.txt.
Não adivinhar a correspondência visual dos atributos nas Lótus.

Validação final: 19 testes Python, exportação PDF real e smoke test Chromium.
UI: cenários em tests/ui_smoke.cjs e fixture isolada em tests/ui_fixture.py.
Não incluir os bancos de teste, navegador, node_modules ou capturas no pacote.

Gerar entrega com package_release.py: somente lista positiva de código/docs/
web/tests/legacy/campaign, verifica hashes de acervo e ZIPs antes de concluir.
Preservar o banco real data/. GitHub segue pausado. Distribuir sempre todos os
mapas e arquivos da campanha junto ao sistema. Não usar .zip.001 nem montadores.
Persistir checkpoints intermediários ao completar partes testáveis, sem esperar
um aviso de saldo de créditos (esse saldo não é visível para o agente).
