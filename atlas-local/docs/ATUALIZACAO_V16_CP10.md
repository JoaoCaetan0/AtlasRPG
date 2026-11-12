# Atlas V16 CP10 — resposta da mesa, visão e conversa

## Entregue
- Rotação livre: arraste o token com o botão esquerdo (ou segure por 180 ms antes de apontar), aponte uma direção e solte. A arte acompanha o ponteiro imediatamente; direção e cone são confirmados no servidor ao soltar. Jogadores só giram seus tokens. Clique breve continua selecionando. Escape cancela. Nome, barras e condições não giram. A configuração numérica de direção continua disponível.
- Atualizações por SSE: uma conexão autenticada por mesa/aba avisa os clientes após as alterações serem confirmadas. Os avisos contêm somente contadores; o conteúdo continua nas APIs com filtros de acesso. Reconexão automática e consulta de recuperação quando a conexão cai. Sem publicar portas ou serviços externos.
- Consulta de cena e combate em paralelo. Alterações locais e movimentos recebem prévia imediata, com correção pelo servidor em caso de recusa.
- A imagem com névoa só é atualizada quando a cobertura efetiva muda, em vez de a cada mudança de iniciativa, PV ou outras informações.
- Raster protegido da névoa em WebP sem perdas, até 2048 px no maior lado, com cache de imagem e máscaras. O arquivo original não é alterado. Banco em WAL para reduzir disputa entre leitura e escrita. O servidor local ainda depende da velocidade do PC e da rede; não há garantia de latência na rede Radmin do usuário.
- Visão atual em cores; faixa cinza adicional configurável na cena e individualmente por token; memória de exploração privada por jogador e mapa. A memória conserva apenas áreas efetivamente vistas durante a consulta da visão. Áreas nunca vistas permanecem ocultas. A cobertura manual é o limite: ocultar uma área manualmente também esconde sua memória.
- As áreas cinzas exibem somente o fundo do mapa. Tokens, desenhos e acessos continuam filtrados pela visão atual. Sem névoa, mapa livre. Esta entrega não inclui colisão com paredes ou fontes luminosas.
- Chat: Enter envia, Shift+Enter quebra linha; composição por IME respeitada. Botão circular amarelo com seta, mensagens próprias alinhadas à direita, contador de novidades na aba e botão para ir às mensagens novas. Opções e comandos em um menu recolhido. Um único painel de rolagem da conversa, sem rolagem externa do painel.
- Dados: formulário e histórico com rolagens independentes. Chegada de resultados preserva os cards já abertos e a posição de leitura.

## Como ativar a visão cinza
Ative a névoa, libere a região explorável e, em Visão por token, ative a limitação aos tokens controlados. Configure alcance, abertura, faixa cinza e memória de exploração. Atribua um token ao jogador. O mestre conserva sua visão integral; use a prévia do jogador para conferir.
A faixa cinza é uma zona de baixa visibilidade uniforme, não um sistema físico de iluminação nem uma transição contínua de opacidade.

## Instalação
Atualização cumulativa sobre CP9/anteriores, incluindo os 114 tokens. Encerre o servidor, faça backup de toda a pasta data/ e mescle atlas-local, preservando data/ e campaign/. Reinicie e use Ctrl+F5. Novas estruturas de memória são criadas automaticamente. Faça backups somente com o servidor encerrado; preserve eventuais arquivos SQLite auxiliares da pasta data/.

## Validação e continuidade
Resultado: 79 testes Python executados (77 aprovados; 2 pulados por ausência do PDF real da ficha), 14 testes Node aprovados, sintaxe de todos os módulos Python e JavaScript verificada. Teste de entrega de aviso SSE após alteração passou abaixo do limite de 2 segundos no ambiente de teste; isso não é uma medição na rede dos jogadores.
Testes de servidor verificam eventos após commit, permissão de acesso, memória cinza, faixa adicional, ocultação de objetos e prioridade da cobertura manual. Arte e catálogo permanecem os da CP9.
Validação visual interativa em navegador indisponível neste ambiente. Conferir no navegador da mesa: clique breve versus rotação, Enter/Shift+Enter, badge de mensagens, uma única rolagem no chat e histórico dos dados com rolagem própria. Validar com duas contas a latência real no PC e Radmin.
