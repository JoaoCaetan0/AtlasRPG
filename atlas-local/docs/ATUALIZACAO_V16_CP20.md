# CP20 — revisão de integridade das fichas e medição local

Atualização cumulativa da CP19, incluindo os 114 tokens.

## Correções
- Salvar e Salvar/abrir PDF compartilham um bloqueio de envio por ficha. Repetir o clique durante uma gravação não inicia uma segunda requisição.
- Os campos ficam temporariamente indisponíveis durante o envio, impedindo que uma resposta antiga substitua texto digitado nesse intervalo.
- Falhas mostram o erro, liberam a ficha e preservam o rascunho para uma nova tentativa.
- Voltar à lista/mesas ou substituir a página genérica aguarda o fim do salvamento. Minimizar e consultar chat/dados continuam disponíveis.
- Aviso nativo ao sair/recarregar considera também gravação em andamento. O navegador pode limitar esse aviso; ele não substitui a confirmação de gravação.
- Valores numéricos zero do editor configurável não são convertidos em campo vazio pela interface.
- Atualizados os seletores e expectativas de retorno à lista nos roteiros antigos de fichas.

## Medições
Benchmark reproduzível em benchmarks/transport_latency.py, com banco temporário, mapa sintético pequeno, névoa ativa, mestre e jogador autenticados no mesmo computador:

| Medida | Amostras | Mediana | P95 |
|---|---:|---:|---:|
| Envio, confirmação e entrega da prévia de rotação | 30 | 20,969 ms | 24,961 ms |
| Conectar, receber estado inicial e fechar conexão | 5 | 3,005 ms | 3,329 ms |

Payload JSON das prévias: 133–135 bytes (sem contar envelopes e overhead do protocolo). Máximo observado da prévia: 53,202 ms. Estes números não medem renderização, Radmin ou mapas grandes e não demonstram aceleração desta versão frente à anterior. Nenhuma alteração de transporte foi feita sem evidência de gargalo.

## Verificação
- JavaScript: 46 testes passaram, incluindo concorrência e recuperação do salvamento.
- Python: 103 testes executados, 101 passaram e 2 foram ignorados (testes dependentes de modelo PDF real). O teste de desconexão registrou BrokenPipe no servidor, sem falha da suíte.
- Sintaxe dos scripts e roteiros alterados validada.
- Teste visual da CP19 tentado novamente: Chromium não iniciou, com socket Operation not permitted. Os roteiros atualizados ainda precisam ser executados em navegador funcional.

## Instalação
Feche o servidor e faça backup de data/. Mescle atlas-local, substituindo os arquivos do programa e preservando data/ e campaign/. Reinicie e pressione Ctrl+F5. Não há migração de banco nesta leva.
