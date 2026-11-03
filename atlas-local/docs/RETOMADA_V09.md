# Retomada V09

Pedido autorizado: ampliar o desfazer e aproveitar o trabalho disponível.

Concluído: histórico persistente de combate com até 40 ações por mesa/imagem;
desfazer/refazer para tokens, movimento/custo, condições, iniciativa, terreno e
grade. Mestre pode reverter movimento de jogador; jogador não acessa histórico.
Menu Histórico com autoria, botões e atalhos que respeitam campos de texto.

Banco migrado para esquema 6. Módulo novo: combat_history.py. Tabela
combat_history mantém snapshots e flag undone, com índice por mesa/imagem.
Nova ação exclui o ramo de refazer; no-op não o exclui. Retenção de 40 registros.
Restauração valida estado e revisão dentro da transação; falha faz rollback.

V08 recuperada a partir dos três pacotes persistentes após reinício do ambiente.
Não depender de arquivos temporários. Manter acervo de 509 itens e oito artes,
execução local/Radmin, GitHub pausado e entrega em três ZIPs normais.

Limites documentados: sem histórico retroativo; sem desfazer de arquivos/fichas/
chat; estados ainda por imagem compartilhada. Se vínculos antigos deixarem de
ser válidos (participante removido), restaurar pode ser recusado sem efeito parcial.

Validação: testes de servidor em tests/test_combat_history.py e UI em
tests/ui_history.cjs, além das suítes anteriores. Resultados em VALIDACAO_V09.md.
