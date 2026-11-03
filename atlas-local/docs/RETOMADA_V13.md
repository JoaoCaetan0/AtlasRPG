# Retomada V13

Implementados vínculo ficha/token e 82 habilidades automáticas. Não alterar acervo nem inventar regras. GitHub pausado. Entrega em três ZIPs normais, mais checkpoint leve; excluir data/, credenciais, dependências de desenvolvimento e screenshots.

## Código
- token_characters.py: character_id no token, identidade canônica da ficha, recursos privados separados do estado de combate. Resumos somente após filtro por névoa/visibilidade.
- combat.py: vínculo validado por mesa; controlador resolvido antes do movimento. combat_history.py normaliza identidade atual no estado esperado, evitando conflitos quando a ficha muda.
- web/combat.js: seletor no editor, nome/controlador bloqueados no vínculo, resumo privado e abertura lateral. web/characters.js: seção automática preserva os campos manuais e respeita rascunhos ao abrir pelo token.
- abilities.py e docs/HABILIDADES.json: textos transcritos com IDs, páginas e linhas da fonte. Sentidos aguçados pertence a Silvano, apesar da ordem de extração. Engenheiro tem duas habilidades.
- rules.py retorna catálogo; characters.py retorna lista derivada e exporta anexo PDF.
- ReportLab 4.4.9, fontes DejaVu em docs/fonts com licença. Anexo com fontes incorporadas; 168 campos originais mantidos. Esquema 8, backup antes da migração.

## Testes
ATLAS_TEST_PDF: campaign/blobs/ac077d9e3b50680ec80397bf099836cbde82c005360478959f75fbe001ba082c. unittest discover; Node geometry/token-model; sete suítes Chromium em série (porta 8766): ui_character_links, ui_workspace, ui_assets, ui_history, ui_combat_live, ui_fog, ui_smoke. Ver VALIDACAO_V13.md.

## Continuidade
Transporte do grupo, sincronização de condições e efeitos automáticos das habilidades pendentes. Recursos editados na ficha. LAN/Radmin real ainda requer validação no ambiente do usuário. O checkpoint Atlas_V13_Progresso foi salvo antes da validação final; preferir checkpoint final e ZIPs V13 quando disponíveis.
