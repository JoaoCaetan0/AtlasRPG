# Correção V14.1 — Carregamento da interface

Este pacote contém o programa completo atualizado, sem repetir os mapas da V14 e sem incluir data/. É uma atualização sobre a instalação existente, não uma nova campanha.

1. Encerre a janela do servidor Atlas.
2. Faça backup de data/.
3. Extraia este ZIP na pasta que contém atlas-local, aceitando substituir os arquivos. Verifique que não criou atlas-local/atlas-local por engano: server.py e a pasta web devem estar no mesmo atlas-local em que já existe data/.
4. Abra INICIAR_WINDOWS.bat ou INICIAR_REDE_RADMIN.bat dessa pasta. Recarregue a página com Ctrl+F5.

A inicialização carrega os scripts na ordem, repete uma vez falhas de download e verifica as funções esperadas antes de iniciar. URLs versionadas evitam reutilizar scripts de uma versão anterior. Falhas persistentes identificam o arquivo e oferecem recarregar. Não há alteração do banco nem dos mapas.

A mensagem renderWorkspace is not defined significa que a função de montagem da interface não estava disponível. O arquivo existe na V14 original e a ordem era correta; sem o console/rede da instalação afetada, não é possível afirmar se houve arquivo ausente, servidor antigo, falha de rede ou falha de execução. Esta entrega restaura o conjunto do programa e trata a inicialização incompleta.
