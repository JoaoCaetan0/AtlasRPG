# Correção V14.2 — Codificação no Windows

Causa confirmada: conditions.json é UTF-8, mas combat.fresh() usava Path.read_text() sem encoding. No Windows com padrão cp1252, a leitura falha no byte 0x9D, posição 1860. O combate não chega ao navegador; sem estado carregado, grid e tokens não funcionam. A V14 corrigiu a recuperação, mas não essa causa original.

Correção: UTF-8 explícito nas leituras de condições, navegação, catálogo de tokens, habilidades e chave do anfitrião; escrita da chave e dos relatórios de empacotamento também explícita. Os dois iniciadores Windows definem PYTHONUTF8=1 para processos filhos. Nenhum arquivo do banco é convertido, apagado ou recriado. O carregador da interface continua verificando dependências, agora identificado como V14.2.

## Instalar
Encerre o servidor. Faça backup de data/. Extraia este ZIP na pasta que contém atlas-local, mesclando e substituindo os arquivos do programa. Não crie atlas-local/atlas-local. Preserve data/ e campaign/. Abra o iniciador Windows ou Radmin dessa mesma pasta e recarregue os navegadores com Ctrl+F5. Este ZIP contém o programa e os tokens, sem repetir os mapas: é atualização da instalação existente.

## Testes
O erro original foi reproduzido decodificando o catálogo como cp1252. Regressão test_windows_encoding.py simula cp1252 como padrão de Path.read_text/write_text e exercita combate, autorização, movimentação, navegação e catálogos Unicode. Os testes de navegador verificam grade, tokens, régua, iniciativa e sincronização. A simulação cobre a causa demonstrada; não equivale a testar em um computador Windows real.
