# Memória visual por token — CP17

## Identidade e isolamento
Cada registro é identificado por mesa, mapa lógico (digest de névoa), cena de combate canônica, token e usuário. Horários alinhados continuam compartilhando camadas conforme scene_variants; mapas independentes não compartilham memória. O usuário na chave impede que transferir um token revele automaticamente o histórico de seu antigo controlador.

A visão do jogador continua sendo a união dos tokens que controla, limitada pela máscara manual. A exploração individual registra somente as células autorizadas que aquele token enxerga. A faixa cinza adicional não vira exploração. Áreas ocultas manualmente continuam ocultas, mesmo que constem do histórico. Tokens/objetos só aparecem na visão atual, nunca na lembrança cinza.

## Migração conservadora
A tabela antiga vision_memory permanece intacta como arquivo legado. Antes, só havia uma máscara por jogador/mapa: não é possível reconstruir retrospectivamente a contribuição de cada token.

Na primeira utilização, essa máscara é copiada para os tokens então vinculados ao jogador, inclusive ocultos. exploration_migration impede repetir a cópia. Tokens criados depois não herdam o histórico antigo. Ao limpar antes da primeira visualização, a migração ocorre primeiro, preservando a memória dos outros tokens. Dados históricos sem token atual permanecem no arquivo legado, sem serem automaticamente entregues a novos tokens.

## Limpeza
POST /api/token-memory-clear exige mestre, participação na mesa, mapa disponível, token existente e revisão atual da cena. Limpa somente os registros desse token/cena/mapa, sem apagar entidades ou alterar máscara manual. A revisão da cena é incrementada e o mecanismo normal de publicação após commit notifica os clientes. Não é uma ação do histórico Desfazer de combate.

A visão atual continua sendo calculada e imediatamente pode registrar novamente as células presentes. A faixa adicional do cone também continua cinza. Se outro token do jogador lembrar da área, a união da visão ainda a mostrará cinza. Isso é esperado e explicado na confirmação.

## Concorrência
Leituras que podem gravar exploração com névoa ativa abrem BEGIN IMMEDIATE antes de ler as contribuições; POST já usa a mesma transação. Assim, limpeza e gravação de memória são serializadas e uma leitura atrasada não ressuscita histórico anterior. Mapas sem névoa não recebem esse bloqueio adicional. Avaliar custo desta região na instrumentação CP18; não remover a proteção sem controle de geração equivalente.

## Rollback e backups
Instalação cria tabelas adicionais sem excluir dados antigos. Para rollback exato, restaurar backup do banco anterior à atualização junto com o programa anterior. Executar CP16 no banco novo pode voltar a mostrar a memória legada: não usar isso como rollback funcional da limpeza.
