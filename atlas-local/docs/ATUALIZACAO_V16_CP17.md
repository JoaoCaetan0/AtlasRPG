# Atlas V16 CP17 — memória visual

## Instalar
Feche o servidor e faça backup da instalação, especialmente data/. Mescle atlas-local substituindo arquivos do programa; preserve data/ e campaign/. Reinicie e use Ctrl+F5. A criação das novas tabelas ocorre automaticamente. Pacote cumulativo com 114 tokens, dependente dos mapas/documentos da instalação existente.

## Usar
Mestre: botão direito no token → Visão → Limpar memória visual. Confirme para remover somente a exploração daquele token naquele mapa. A visão atual, a faixa cinza adicional e o histórico dos demais tokens continuam funcionando. Se outro token seu lembrar de uma área, ela poderá continuar cinza.

A exploração antiga era compartilhada por jogador. Para evitar perda de histórico, será preservada nos tokens existentes na primeira migração; a partir daí a exploração é individual. Tokens novos não herdam essa memória. Horários de um mapa que já compartilhavam camadas continuam compartilhando o histórico.

## Validação
102 testes Python: 100 passaram e 2 foram pulados por PDFs privados ausentes. 42 testes JavaScript passaram. Sintaxe JS/MJS e integridade integral do ZIP verificadas.
Chromium não iniciou (socket Operation not permitted); inspeção visual e teste na rede real dos jogadores continuam pendentes. Não há alegação de melhora de latência nesta versão.

## Continuidade
Checkpoint e plano em docs/reestruturacao/. Detalhes da migração, concorrência e rollback em MEMORIA_VISUAL_CP17.md. Para voltar exatamente ao estado anterior, restaure o backup do banco e o programa anterior juntos.
Próxima leva: medições e otimização de desempenho. Depois: ficha ampla.
