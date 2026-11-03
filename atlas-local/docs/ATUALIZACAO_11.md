# Atlas V11 — painéis laterais sobre o mapa

## O que mudou

A mesa agora tem uma barra de ícones à direita. Os ícones abrem painéis sobre o mapa, que permanece ativo e sincronizado. Não é mais necessário trocar de página para conversar, rolar dados ou gerenciar o combate.

Painéis disponíveis: Conversa, Dados, Combate e iniciativa, Tokens, Desfazer/refazer, Mapas, Biblioteca, Personagens, Caderno, Participantes e Administração. Tokens, Histórico e Administração são apresentados apenas aos mestres. As permissões do servidor permanecem as mesmas.

- Clique no ícone para expandir. Clique novamente, no ×, no ícone Mapa ou pressione Esc para recolher.
- Os ícones mostram seus nomes ao passar o mouse e possuem nomes acessíveis para leitores de tela. O foco volta ao ícone ao recolher o painel.
- Um painel aparece por vez, sem reduzir a largura do mapa ou recriar sua imagem. Zoom, seleção do token e posição de rolagem do mapa permanecem ao alternar os painéis.
- O painel Combate ativa o combate no primeiro acesso e reúne iniciativa, tokens simples, condições, grade e movimento. Fechar o painel não encerra o combate.
- Tokens abre os oito modelos existentes. “Posicionar no mapa” recolhe o painel para permitir o clique no local. Inserção em lote e arrastar continuam disponíveis.
- Chat e Dados mantêm seu conteúdo e seus campos enquanto a mesa estiver aberta. As mensagens enviadas e as rolagens continuam salvas no servidor. Rascunhos não enviados não sobrevivem ao recarregamento da página.
- Recolher o Caderno ou uma ficha mantém o editor e seu rascunho. Ao trocar de seção com alterações não salvas, o sistema pede confirmação antes de descartar. Salvar continua necessário.
- Chat tem atalhos “Anteriores” e “Ao vivo”. Consultar mensagens antigas não suspende a atualização do mapa.
- Pré-visualizações de imagens/PDFs e formulários pontuais continuam em janelas sobre a mesa.
- No celular, o painel cabe na largura disponível e tem rolagem própria; recolha-o para recuperar a área do mapa. A barra de ícones também pode ser rolada em telas baixas.

## Sincronização preservada

Mapa/combate têm um ciclo independente de atualização automática. Abrir chat, dados, biblioteca, fichas ou administração não o cancela. A troca de mapa pelo mestre também chega enquanto o jogador está com um painel aberto. O chat possui seu próprio ciclo de atualização e os dados mantêm o componente de rolagem existente.

Não há WebSocket nesta versão: o mapa e o chat usam consultas periódicas de aproximadamente um segundo; dados mantêm a atualização periódica anterior. O servidor do anfitrião precisa continuar aberto. Não foram adicionados fog of war ou controle de músicas.

## Como atualizar

1. Encerre o servidor e faça backup de `data/`.
2. Extraia os TRÊS ZIPs na mesma pasta, mesclando `atlas-local` e substituindo os arquivos do programa.
3. Preserve `data/`. Os pacotes não contêm contas, senhas ou mesas em uso.
4. Reinicie o servidor pelo inicializador habitual. Todos devem recarregar a página uma vez para carregar a V11.

Mantido o esquema 6 do banco da V09/V10. Os arquivos da campanha e as artes de tokens foram preservados. GitHub continua pausado.

## Referência de organização

A estrutura adapta a divisão entre mesa e barra lateral descrita no Roll20, com painéis por função. Não replica todas as funcionalidades da plataforma nem usa suas marcas ou artes.

- Sidebar: https://help.roll20.net/hc/en-us/articles/360039675073-The-Sidebar
- Journal (personagens/documentos e permissões): https://help.roll20.net/hc/en-us/articles/360039675133-Journal
- Imagens na mesa: https://help.roll20.net/hc/en-us/articles/360039178654-Importing-and-Manipulating-Images

Detalhes de testes em VALIDACAO_V11.md.
