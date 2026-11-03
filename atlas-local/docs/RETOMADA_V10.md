# Retomada V10

Leia ATUALIZACAO_10.md e VALIDACAO_V10.md. Versão pronta para entrega em três ZIPs; GitHub permanece pausado. Preservar campaign/ e dados locais. Banco segue no esquema 6.

Arquivos alterados: web/combat.js (ativação, iniciativa, régua, movimento em linha e polling resiliente), web/combat/geometry.mjs (percurso e custo), web/combat/renderer.mjs (contraste), web/app.js (clonagem JSON, GET sem cache/timeout), web/admin.js (clonagem), server.py (cache estático), web/style.css. Testes em tests/ui_combat_live.cjs e geometry.test.mjs; fixture aceita host opcional.

Testar UI em série: todos usam porta 8766. ATLAS_BROWSER aponta para Chromium; Playwright é dependência de desenvolvimento, não necessária para o usuário. ATLAS_UI_OUTPUT recebe evidências locais. Fixture requer os arquivos de campaign/.

Não há teste real entre computadores Radmin. Os testes usam contextos independentes do Chromium; um caso remove structuredClone para simular disponibilidade de APIs em HTTP LAN. Não afirmar que o problema exato do navegador do usuário foi reproduzido.

Pendências gerais em REQUISITOS_PENDENTES.md. Não reimplementar recursos prontos. Entregar três ZIPs comuns com todos os assets, sem data/. package_release.py valida hashes dos 509 assets e das oito artes de tokens antes de empacotar.
