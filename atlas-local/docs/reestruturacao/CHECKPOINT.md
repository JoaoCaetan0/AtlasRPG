# CP20 — integridade de salvamento e medições locais

Base cumulativa CP19. Preservar data/ e campaign/. 114 tokens.

## Implementado
runSheetSave(form,work), usado pelos editores PDF/Estigma e genérico: exclusão mútua por formulário, inert durante envio, aria-busy, restauração de controles e erro sem remover rascunho. canLeave e a substituição de páginas genéricas protegem gravações em andamento. beforeunload considera gravação pendente. Preservação explícita de zero no editor genérico.

Roteiros ui_character_links, ui_smoke e ui_v16 adaptados às seções/retorno à lista. Testes unitários sheet-save cobrem duplicidade, erro e nova tentativa.

## Evidência
46 testes JS passaram. 103 Python: 101 passaram, 2 ignorados por modelo PDF de teste ausente. Benchmark com 30 prévias em dois clientes loopback: mediana 20,969 ms, P95 24,961 ms; dados em benchmarks/transport_cp20_results.json. Não representa Radmin ou renderização.
Chromium continua bloqueado por socket Operation not permitted. Nenhum teste visual/E2E atualizado foi aprovado nesta leva.

## Próxima retomada
1. Executar ui_sheet_cp19 e os roteiros completos com navegador funcional; conferir novo editor, guardar/cancelar, PDF, erros, busca e responsividade.
2. Medir E1–E3 com mapas reais e dois navegadores: imagem, decode, render, névoa, cache, reconexão e rede/Radmin. Usar AtlasPerformance já incluído, sem divulgar dados privados.
3. Conferir no livro os valores da Lótus antes de automatizar sua distribuição. Não inferir regras.

CP20 não altera regras de RPG, permissões, cache de autorização ou protocolo de sincronização. Arrombamento e furtividade continuam fora do escopo. Não declarar projeto finalizado enquanto essas verificações estiverem pendentes.
