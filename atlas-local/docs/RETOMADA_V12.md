# Retomada V12

Névoa manual implementada. Não alterar o acervo da campanha ou as regras do livro sem fonte. GitHub continua pausado. Entrega: três ZIPs normais, sem data/, credenciais, dependências de desenvolvimento ou screenshots.

## Arquitetura
- fog.py: máscara 128×128 por mesa/digest, revisão otimista, histórico persistente de 20 etapas, imagem redigida no servidor, EXIF/transparência normalizados, cache de quatro rasterizações com lock.
- assets.py/server.py/features.py: esquema 7, endpoint /api/fog, resposta binária PNG protegida, envio com cobertura atômica e proteção de novo destino.
- combat.py: filtro de tokens, iniciativas vinculadas, terrenos, acessos e movimentos de jogador.
- web/combat/fog.mjs: ferramentas de arraste, prévia, desfazer/refazer e bloqueio de cliques durante seleção. pendingEnabled mantém o checkbox consistente durante a requisição.
- web/workspace.js: painel lateral exclusivo de mestre. web/combat.js: atualização independente, revisão monotônica e recarga da imagem do jogador.
- web/files.js: Enviar com névoa nos mapas e arquivos.
- Pillow==12.3.0 em requirements.txt. INSTALAR_DEPENDENCIAS.bat instala PDF e névoa.

## Verificação
Testes Python com ATLAS_TEST_PDF apontando para campaign/blobs/ac077d9e3b50680ec80397bf099836cbde82c005360478959f75fbe001ba082c. Testes JS geometry/token-model. Suítes de navegador ui_workspace, ui_fog, ui_assets, ui_history, ui_combat_live e ui_smoke. Executar as suítes de navegador sequencialmente (porta 8766). Consultar VALIDACAO_V12.md para os resultados desta entrega.

## Próximas etapas
Visão individual, paredes/luzes, música, automação restante de regras e vínculo ficha/token. Ver REQUISITOS_PENDENTES.md. Não prometer visão automática nesta versão. Alterar máscara não pode modificar revisão ou custo de combate. O banco exige backup antes da migração; V11 não aceita esquema 7.
