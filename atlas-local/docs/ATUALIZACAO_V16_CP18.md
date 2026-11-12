# Atlas V16 CP18 — ajustes validados e primeira otimização de visão

Atualização cumulativa da CP17; inclui 114 tokens. Requer a instalação existente com seus mapas e documentos. Feche o servidor, faça backup de data/, mescle atlas-local substituindo o programa e preserve data/ e campaign/. Reinicie e use Ctrl+F5.

## Mudanças solicitadas
- Removido o botão/menu adicional de organizar ou mover menus. Arraste direto e Alt+setas continuam funcionando com a preferência individual já salva.
- Removida da apresentação visual a faixa verde persistente do mapa. Movimentar, girar e selecionar não geram mais essa faixa. Erros continuam usando o feedback de erro. O cancelamento de posicionamento permanece na barra de ferramentas; a régua mantém seu resultado textual.
- Retratos dos personagens: removido o padding herdado dos botões; caixa fixa de 62px, imagem centralizada sem distorção. Não modifica as imagens carregadas.

## Desempenho
O cálculo da visão passa a examinar somente as células dentro dos limites de cada círculo, preservando o teste dos quatro cantos, cones e máscara manual. Cache, autorização, memória por token e serialização com limpeza permanecem.

Microbenchmark local, mediana de 12 execuções com cache de cálculo limpo:

| Fontes de visão | CP17 | CP18 |
|---|---:|---:|
| 1 | 20,152 ms | 1,525 ms |
| 4 | 41,477 ms | 4,411 ms |
| 12 | 100,106 ms | 10,059 ms |

O ganho mede somente a função sight nesta máquina e nesses cenários. Não representa a latência total da rede, velocidade de troca de mapas ou ganho universal. Referência e resultados reproduzíveis em benchmarks/. A comparação cobre também 50 cenários determinísticos adicionais com máscaras parciais, cones, orientações, proporções e alcances diferentes.

Incluído diagnóstico opcional, sem novos menus: consulte reestruturacao/DESEMPENHO_CP18.md.

## Verificação e limites
Resultados finais e ponto de retomada em reestruturacao/CHECKPOINT.md. O navegador Chromium não iniciou neste ambiente: socket() Operation not permitted. Não houve validação visual automatizada desta leva. O usuário validou as demais mudanças anteriores.

A etapa E continua parcial: ainda é necessário medir o fluxo completo em navegador funcional, rede local/Radmin, múltiplos jogadores, reconexão e mapas frios/quentes. A reformulação ampla das fichas (CP19/F) não faz parte desta entrega.
