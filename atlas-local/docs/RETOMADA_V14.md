# Retomada V14
Base: três pacotes finais V13, SHA-256 verificado; 509 assets de campanha preservados. Correções em combat.py, server.py, web/combat.js e web/files.js. Testes novos: test_combat_recovery.py e ui_recovery.cjs. Não há migração destrutiva nem mudança de esquema.

Causa reproduzida: falha na primeira GET de combate impedia iniciar mapPoll; clique subsequente lia state.enabled indefinido; sendScene só fechava o painel, dependendo desse timer para trocar imagem. Correção inicia timer antes da primeira consulta, protege clique, valida resposta e renderiza imediatamente após envio. Compatibilidade completa campos ausentes em estados anteriores sem apagar participantes.

Banco real do usuário indisponível: não afirmar confirmação da causa original de todos os erros de validação. Referências no terminal permitem investigar casos restantes. GitHub pausado, ambiente local/LAN/Radmin, sem alteração nas regras do livro.
