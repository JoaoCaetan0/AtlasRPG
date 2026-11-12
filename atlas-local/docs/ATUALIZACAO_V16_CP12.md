# Atlas V16 CP12 — WebSocket no servidor local

## Instalar
1. Feche o servidor e faça backup de toda a pasta `data/`.
2. Mescle `atlas-local` na instalação, preservando `data/` e `campaign/`.
3. Execute `ATUALIZAR_DEPENDENCIAS.bat` uma vez com acesso à internet. A biblioteca nova é `websockets==16.0`; requer Python 3.10 ou superior. Alternativa: `py -3 -m pip install -r requirements.txt`.
4. Inicie pelo mesmo atalho local/Radmin e peça Ctrl+F5 a todos os participantes.
5. Confira `Sincronizado · WebSocket` na cena. Se aparecer SSE, o Atlas está usando o transporte alternativo: verifique se a instalação das dependências terminou e reinicie.

## Entrega
O canal WebSocket usa o mesmo IP e porta do servidor HTTP. Não precisa de hospedagem, nova porta ou servidor adicional. O endereço público da mesa continua igual.
Prévia de rotação, confirmação da direção, movimento, alterações de combate/histórico, troca de cena, chat, rolagem e preparação de mapa usam o canal duplex quando disponível. Avisos de alterações e prévias filtradas também chegam por ele. Leitura do estado e transferências de imagens/arquivos continuam por HTTP; nem toda operação administrativa foi migrada.
O cliente limita o envio das prévias a 20 amostras por segundo, mantém somente a amostra pendente mais recente e respeita o acúmulo de bytes na conexão. Cada comando tem confirmação independente. Alterações persistentes usam as mesmas rotas, verificações e transações do HTTP. Uma queda não dispara reenvio automático de comandos cujo resultado ficou incerto: confira o resultado antes de repetir uma rolagem ou mensagem.
Há reconexão com intervalo progressivo. Durante falhas do WebSocket, SSE/HTTP continuam atendendo à mesa. Uma nova conexão recebe os contadores atuais e recupera o estado através das APIs filtradas.
A checagem de visibilidade das prévias usa um cache curto, vinculado ao estado salvo e invalidado pelos contadores de alteração da mesa. Ela evita recalcular fichas, barras e histórico a cada giro. Tokens ocultos não são enviados ao jogador. As imagens continuam respeitando a névoa e as permissões.

## Proteções
- Cookie de sessão e participação na mesa verificados na conexão e em cada comando.
- Origin obrigatório e correspondente ao endereço do Atlas; mensagens presas à mesa da conexão.
- Revalidação da sessão/perfil a cada segundo no fluxo de saída.
- Protocolo WebSocket implementado pela biblioteca, incluindo validação de quadros, fragmentação e ping/pong.
- Limite de mensagem de 64 KiB, limite de frequência, envio com timeout e confirmação por identificador.
- Deduplicação dos últimos 128 identificadores na mesma conexão; não representa garantia de execução única após reconectar.

## Testes
89 testes Python executados: 87 aprovados e 2 ignorados por ausência do PDF de referência. 17 testes JavaScript aprovados. Sintaxe Python/JavaScript conferida.
Testes novos verificam conexão real WebSocket, rotação antes da soltura, salvamento final, filtros de tokens ocultos, sessão revogada, Origin, isolamento de mesas, mensagens binárias/grandes, deduplicação, limites de fila e alternativa SSE.
Em 20 entregas de prévia entre duas conexões locais: mediana de 21,1 ms e máximo de 88,7 ms. A suíte registrou outra entrega em 25,7 ms. Não são medições no Radmin, comparação controlada com CP11, teste de carga com muitas contas ou garantia de latência.
A tentativa de teste visual com Chromium foi bloqueada pelo ambiente (`socket() failed: Operation not permitted`). Conferir na mesa, com duas contas: rotação durante o gesto, giro final, mudança de mapa, chat e rolagens; simular uma desconexão e confirmar a recuperação sem ações duplicadas.

## Limites e continuidade
O cone e a imagem protegida da névoa continuam sendo atualizados na confirmação do giro. Esta versão não implementa iluminação contínua ou paredes. As otimizações de imagem e preparação da CP11 permanecem. Próximas etapas: atualização parcial da névoa, benchmark de carga/rede e conclusão da validação visual.
Pacote cumulativo, incluindo todos os 114 tokens e alterações anteriores. Mapas privados, documentos do usuário e banco de dados não estão neste ZIP.

## Referência técnica
API Sans-I/O da biblioteca websockets 16.0: https://websockets.readthedocs.io/en/16.0/reference/sansio/server.html
