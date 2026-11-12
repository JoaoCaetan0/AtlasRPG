# CP18.1 — ajuste rápido de interface

Pacote cumulativo: inclui CP18 e 114 tokens. Sem mudanças no servidor, regras, banco ou sincronização.

- Reordenação dos ícones: indicação discreta da posição antes/depois do destino, origem translúcida e animação de encaixe de 210 ms ao soltar. A animação também acompanha Alt+setas. Preferência de movimento reduzido respeitada. Persistência individual e bloqueio de clique acidental preservados; nenhum novo menu.
- Dados: removidos cabeçalho repetido, introdução e mensagem inicial. Fórmula, atalhos, vantagem/desvantagem, visibilidade e rolar continuam acessíveis. Favoritos, opções de animação e ajuda com exemplos ficam recolhidos. Resultado e animação continuam disponíveis após rolar. Fórmulas avançadas permanecem aceitas pelo motor, mesmo com a ajuda resumida.

Verificação: 44 testes JavaScript passaram; sintaxe dos dois scripts alterados validada. Navegador de testes tentou iniciar, mas falhou com socket() Operation not permitted. Não houve inspeção visual automatizada. Nenhuma alteração Python: mantidos os resultados e limites da CP18.

Instalação: fechar servidor, fazer backup de data/, mesclar atlas-local substituindo os arquivos do programa e preservar data/ e campaign/. Reiniciar e Ctrl+F5.

Próximo lote segue CP19: ficha ampla. Medições reais restantes de E e validação visual continuam pendentes.
