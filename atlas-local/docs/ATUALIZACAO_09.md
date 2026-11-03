# Atlas V09 — desfazer e refazer no combate

## Instalação

Feche o servidor e faça backup de `data/`. Extraia os três ZIPs comuns na mesma
pasta, mesclando `atlas-local`. O diretório `data/` não faz parte dos pacotes.
Ao iniciar, o banco passa automaticamente do esquema 5 para o 6, adicionando a
tabela de histórico. Versões anteriores recusam esse banco: para voltar à V08,
restaure o backup anterior. Recarregue o navegador após atualizar.

## Como usar

Na barra do mapa, o mestre abre **Histórico ▾** e escolhe **Desfazer** ou
**Refazer**. O menu informa a ação disponível e quem a realizou. São mantidas
até 40 ações por imagem de combate, inclusive depois de recarregar a página ou
reiniciar o servidor.

Atalhos com o foco na área do mapa:

- Ctrl+Z: desfazer.
- Ctrl+Shift+Z ou Ctrl+Y: refazer.
- Command substitui Ctrl em teclados compatíveis.

Os atalhos não interceptam edição de texto nem formulários abertos. A operação
mostra um retorno de sucesso na cena; botões sem ação disponível ficam desativados.

## Ações cobertas

- Inserção simples ou em lote e remoção de tokens.
- Edição de nome, aparência, controlador, cor, visibilidade e movimento disponível.
- Movimento de tokens: restaura posição e movimento gasto.
- Condições de tokens e participantes, inclusive estados secretos.
- Participantes e ordem da iniciativa, turno ativo e rodada.
- Grade, terreno e regras de movimento; ativação/desativação do combate.
- Edição das definições de condições dentro do combate.

O estado completo da operação é restaurado junto. Por exemplo, desfazer uma
remoção recupera o token e os vínculos de iniciativa alterados por essa remoção.
As ações anteriores à instalação da V09 não são reconstruídas retroativamente.

## Colaboração e limites

O histórico é compartilhado e cronológico, não uma lista privada de cada mestre.
Só mestres podem desfazer/refazer. Movimentos de jogadores também são registrados;
o mestre recebe confirmação ao reverter uma ação de outro participante.
Jogadores não recebem os metadados nem os estados secretos do histórico.

Uma nova alteração após desfazer descarta a sequência que poderia ser refeita.
Salvar sem mudar o estado não consome histórico nem descarta essa sequência.
Outra pessoa alterar a cena antes da confirmação causa conflito de revisão;
o servidor recusa a ação e a interface atualiza a cena, sem sobrescrever dados.

Restaurações continuam sujeitas às permissões e validações atuais. Se um token
antigo pertencia a alguém removido da mesa, por exemplo, sua restauração pode
ser recusada. A recusa não avança o histórico nem altera parcialmente a cena.

O recurso abrange somente combate. Não desfaz navegação/troca de mapa, arquivos,
chat, fichas ou configurações administrativas gerais. Dois cadastros usando a
mesma imagem continuam compartilhando combate e histórico; separar esses estados
permanece pendente. A imagem de cada mapa mantém seu histórico ao trocar de cena.

## Implementação e verificação

`combat_history.py` concentra retenção, identificação de ações, metadados e
restauração. Gravação de estado, histórico e cursor usa a mesma transação SQLite.
Os endpoints de desfazer/refazer exigem mestre, acesso ao arquivo e revisão atual.
Os snapshots não são enviados ao navegador como uma lista de estados antigos.

Os testes e instruções de retomada estão em `VALIDACAO_V09.md` e `RETOMADA_V09.md`.
