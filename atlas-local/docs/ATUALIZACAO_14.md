# V14 — Recuperação do mapa, combate e troca de cena

## Instalação
Encerre o servidor. Faça uma cópia da pasta `data/`. Extraia os três ZIPs na mesma pasta, mesclando `atlas-local` e substituindo os arquivos do programa. Não apague `data/`. Execute `INSTALAR_DEPENDENCIAS.bat`, inicie o servidor e recarregue os navegadores com Ctrl+F5. Não misture arquivos de versões diferentes nem mantenha o servidor antigo em execução. O esquema do banco continua em 8; nenhum dado de campanha é removido.

## Correções
- Falhas no primeiro carregamento do combate não encerram mais a sincronização. A cena tenta novamente automaticamente, com estado de reconexão visível.
- Cliques no mapa durante o carregamento não acessam mais um estado indefinido (`reading enabled`).
- Uma resposta incompleta do servidor recebe uma mensagem específica; não é aceita como estado válido. O marcador de atualização só é gravado após renderização concluída.
- Estados antigos recebem campos ausentes de grade, combate e participantes. Tamanho existente, posições, nomes e demais dados são preservados. Estruturas ilegíveis não são apagadas ou substituídas por uma cena vazia.
- “Enviar à mesa” troca imediatamente a cena e mantém a névoa já configurada, sem precisar retirar o mapa anterior ou confirmar uma segunda vez. “Enviar com névoa” cobre o destino antes de compartilhá-lo. A prévia continua privada.
- Erros de dados não tratados incluem uma referência para localização no terminal, sem expor conteúdo das fichas, credenciais ou requisições.

## Uso
Abra Combate para ativar a grade hexagonal. Em Grade e movimento, ajuste o tamanho e salve. Adicione um token simples ou escolha um modelo em Tokens. Selecione o token e clique em um hexágono de destino para mover e contabilizar o custo. A régua não consome movimento. Use a ferramenta da névoa e arraste para revelar/ocultar; conclua a seleção para voltar a mover tokens.

## Verificação e limites
Testes incluem dois navegadores, falha deliberada na primeira consulta de combate, recuperação sem atualizar a página, estados antigos, inserção/movimento, grade, régua, iniciativa, troca imediata e proteção da névoa. A sincronização dos jogadores consulta o servidor a cada segundo; não usa WebSocket. Não houve acesso ao banco instalado no computador do usuário, portanto a origem exata de todos os “Dados inválidos” nesse banco não foi confirmada. Se persistir, envie a nova referência e a linha correspondente do terminal. Teste entre computadores reais via Radmin ainda não realizado.
