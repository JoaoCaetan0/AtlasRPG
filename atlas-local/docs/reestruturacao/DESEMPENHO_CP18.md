# Diagnóstico e otimização CP18

## Uso opcional no navegador
No console de desenvolvimento, execute `AtlasPerformance.start()`, realize a troca de mapa/rotação/movimento desejada e execute `AtlasPerformance.stop()`. Consulte `AtlasPerformance.report()`.

Não transmite telemetria. Guarda no máximo 400 medidas e relata até 200 recursos recentes de mesma origem. Não inclui corpos, queries, IDs ou conteúdo do chat. A coleta inicia desligada e reinicia a cada carregamento da página. O cache e a conexão não são modificados por esse diagnóstico.

- `api:*`: tempo completo da chamada no cliente, incluindo transporte disponível e parsing; não equivale à latência remota de outro jogador.
- `map:image-ready`: tempo até onload da imagem auxiliar de dimensões, incluindo carregamento; não separa a decodificação.
- `map:draw` e `map:render`: tempo síncrono das funções; não representam pintura final/GPU.
- Recursos: duração, TTFB aproximado, bytes transferidos e corpo codificado, quando disponibilizados pelo navegador. Transferência zero isoladamente não prova cache; compare com a aba Network.
- `Server-Timing app`: execução da rota HTTP e transação, incluindo abertura/espera do banco e commit. Não inclui leitura do corpo, publicação pós-commit, envio de bytes, nem cada mensagem WebSocket.

Não há ainda instrumentação separada de todos os subpassos E1. Não somar amostras aninhadas (render pode chamar draw).

## Evidência
Execute `python benchmarks/vision_benchmark.py` na raiz. O algoritmo CP17 foi mantido apenas como referência de benchmark; não integra o servidor. `benchmarks/cp18_results.json` contém a medição desta entrega. `tests/test_vision_equivalence_cp18.py` verifica igualdade exata de máscaras, incluindo fontes fora do mapa e alcance zero.

A renderização já conserva as camadas e só troca o href do raster de jogador quando a máscara muda; mudanças de visão podem legitimamente exigir outro raster. O cache HTTP mantém reautorização. Não enviar a imagem original oculta nem retirar essa verificação para acelerar.

## Próxima execução em ambiente real
1. Dois clientes autenticados mestre/jogador; registrar sistema, navegador e rede.
2. Comparar mapa frio e reaberto; separar Network, decode/pintura pelo Performance profiler, névoa e atualização de tokens.
3. Registrar rotação antes de soltar, commit, reconexão e mudança de cena. Medir atraso mestre/jogador com relógios compatíveis ou captura conjunta, não subtrair relógios sem sincronização.
4. Investigar tempo de transação/memória e raster antes de modificar o protocolo. Validar ausência de vazamento de imagem e persistência após cada ajuste.

## Referências
- https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize
- https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing
