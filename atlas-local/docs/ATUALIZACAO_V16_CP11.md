# Atlas V16 CP11 — rotação ao vivo e preparação de mapas

## O que foi entregue
- Prévias de rotação durante o gesto, sem esperar soltar o mouse. O cliente envia até 20 amostras por segundo, mantém uma única requisição em andamento e substitui amostras pendentes pela mais recente. Os destinatários suavizam o giro pelo menor arco, atualizando somente a arte do token. Ao soltar, a direção final é salva pelo fluxo normal, com histórico e sincronização. Cancelar restaura a direção; prévias abandonadas expiram visualmente em cerca de 2 segundos.
- Reaproveitamento da conexão SSE autenticada para entrega das prévias. Esta versão NÃO migra para WebSocket: usa POSTs pequenos para envio e SSE para distribuição. As prévias não gravam direção nem entradas no histórico; a checagem de visão pode atualizar a memória de exploração existente.
- Prévias filtradas no servidor por mapa atual, acesso e visibilidade de cada destinatário. Jogadores só controlam os próprios tokens. A direção do cone e o raster protegido da névoa continuam sendo confirmados ao soltar; não há recálculo contínuo de iluminação nesta versão.
- Botão **Preparar mapa** nos cards do catálogo, usando a versão/horário selecionado. Solicita carregamento e decodificação em segundo plano sem trocar a cena. Exibe contagem de participantes que confirmaram a preparação, incluindo o mestre. A contagem não é presença online nem lista de prontidão individual.
- A preparação não concede acesso. Somente participantes que já tenham acesso à imagem recebem a solicitação. A névoa vigente continua aplicada. Para mapas privados, configure o acesso antes; não libere imagens secretas só para acelerar a troca.
- Cache privado de imagens com ETag e revalidação obrigatória. O servidor verifica permissão e a imagem protegida atual antes de responder 304. Mapas inalterados podem ser reutilizados sem retransmitir todos os bytes; revogação de acesso e mudanças de névoa são reavaliadas.
- Versão de exibição WebP sem perdas limitada a 2048 pixels no maior lado para cena, preparação e miniaturas do catálogo. Os arquivos originais são preservados. Esta versão não faz refinamento progressivo para resolução original ao ampliar.
- Catálogo de tokens, modelos personalizados e identificação da cena carregados em paralelo. A imagem do mapa deixa de usar um timestamp aleatório nas mudanças de névoa.

## Como usar
1. Encerre o servidor e faça backup de toda a pasta `data/`.
2. Mescle a pasta `atlas-local` deste pacote na instalação, substituindo o código. Preserve `data/` e `campaign/`.
3. Reinicie e peça a todos para usar Ctrl+F5.
4. Gire um token segurando e arrastando com o botão esquerdo. Os demais devem ver a arte girando antes da soltura. Solte para confirmar a direção e atualizar a visão.
5. No catálogo de mapas, selecione o horário e clique em **Preparar mapa**. Espere as confirmações e use **Mostrar aos jogadores** normalmente.

## Verificação e limitações
A suíte de regressão e os testes adicionais cobrem entrega de prévia antes do salvamento, ausência de gravação da prévia, permissões, exclusão de tokens ocultos, cache condicional, revogação, preparação privada e raster de exibição protegido. Os testes JavaScript verificam geometria, catálogo e os gestos de rotação. O resultado da rodada está em `VALIDACAO_CP11.txt`.
O teste visual automatizado foi tentado com Chromium, mas o ambiente bloqueou a criação de socket do navegador (`Operation not permitted`). O roteiro opcional `tests/browser_cp11.py` fica disponível para repetição em ambiente com Chromium e Playwright. Não foi medido o atraso real no Radmin, nem garantido um percentil de latência para múltiplos jogadores.

## Continuidade
Esta entrega é cumulativa sobre CP10, com os 114 tokens. Não inclui as pastas privadas de mapas/documentos e banco do usuário.
Próximas otimizações ainda não implementadas: transporte WebSocket bidirecional, atualização parcial do raster por blocos, refinamento progressivo de resolução, pré-carregamento automático de destinos, status individual de prontidão e benchmark de carga com várias contas e latência simulada. A troca ainda reconstrói a área de combate; os painéis gerais da mesa continuam no workspace.
