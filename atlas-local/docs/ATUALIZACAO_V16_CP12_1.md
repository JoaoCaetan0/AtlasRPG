# CP12.1 — diagnóstico de acervo ausente

Correção cumulativa sobre CP12, mantendo WebSocket e os 114 tokens.
O endpoint de preparação do Estigma agora retorna uma mensagem clara quando `campaign/manifest.json` não está presente, sem criar uma mesa incompleta. O teste de regressão confirmou a resposta e a preservação das mesas existentes.

## Resolver a falta do acervo
- Se a mesa já existe, abra-a na lista de mesas. Preparar Estigma é a instalação do acervo, não o botão para iniciar uma mesa existente.
- Se você possui a instalação anterior, restaure a pasta `campaign` inteira ao lado de `server.py`. Ela deve incluir `manifest.json` e `blobs/`. Copiar apenas o manifesto não recupera os arquivos.
- Se está usando uma instalação nova sem esse acervo, crie uma mesa e importe seus mapas/documentos pela Biblioteca. O instalador especializado `import_campaign.py` depende dos ZIPs originais com os nomes esperados por ele.

A correção esclarece o problema, mas não recria mapas/documentos ausentes. Este ZIP contém código e tokens, não os dados privados da campanha.

## Instalar
Encerre o servidor, faça backup de `data/` e substitua o código preservando `data/` e `campaign/`. Para instalação da CP12 pela primeira vez, execute `ATUALIZAR_DEPENDENCIAS.bat`. Reinicie e use Ctrl+F5.
Detalhes do WebSocket: `ATUALIZACAO_V16_CP12.md`.
