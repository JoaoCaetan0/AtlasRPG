# Atlas V10 — combate visível e sincronização automática

## Instalação
1. Encerre o servidor e faça backup de `data/` (use o script de backup do projeto).
2. Extraia os TRÊS ZIPs na mesma pasta, mesclando `atlas-local` e substituindo os arquivos do programa. Não renomeie nem concatene os ZIPs.
3. Preserve sua pasta `data/`. Os pacotes não incluem contas, senhas nem dados de mesas em uso.
4. Reinicie usando o inicializador local/LAN/Radmin habitual. Na primeira abertura após a atualização, todos devem recarregar a página uma vez para carregar o programa novo.

O banco permanece no esquema 6 da V09. Atualizações vindas da V08 ou anteriores devem manter um backup anterior à migração; voltar para essas versões exige restaurar esse backup.

## Como usar
- **Entrar em combate** ativa o combate e exibe o grid hexagonal no mesmo clique. Fechar o painel não encerra o combate; use a caixa “Combate ativo neste mapa” para encerrar.
- **Grade e movimento**, no painel: ajuste o raio dos hexágonos (15–100), distância por célula, unidade e limite de movimento; clique em **Salvar grade**. O tamanho é relativo à imagem, não uma medida física do monitor. Alterar o tamanho reposiciona os tokens conforme suas coordenadas hexagonais.
- **Assets ▾**: escolha um modelo, use “Posicionar no mapa” e clique no local, ou “Inserir agora”. **Token simples** abre o editor. Ambos ativam o combate e a grade. As novas peças encaixam em células livres.
- No editor, escolha **Controlado por** para permitir que um jogador mova seu token. A lista de participantes é consultada ao abrir o editor.
- Selecione o token e clique no destino: o percurso segue uma linha de hexágonos adjacentes e debita a distância de cada célula com seus multiplicadores de terreno. O servidor valida todo o percurso antes de mover. Limite de 200 células por ação.
- **Régua**: clique na origem e no destino. Mostra distância, número de hexágonos, custo do terreno e bloqueios; não movimenta nem gasta recursos. Disponível também aos jogadores.
- **Iniciativa** abre diretamente a ordem dos turnos, com adicionar, ordenar, editar, reorganizar e próximo turno.
- **Histórico ▾** mantém desfazer/refazer das últimas 40 ações do combate, incluindo o custo do movimento.

## Sincronização
A tela de mapa e combate consulta o servidor a cada segundo. Tokens, condições, turno, grid e troca de cena são aplicados automaticamente, sem F5. O indicador informa “Sincronizado” ou “Reconectando…”. Falhas temporárias são tentadas novamente; consultas travadas têm limite de 15 segundos.

O foco no editor de grade e uma janela de dados aberta não suspendem mais a sincronização. Formulários de edição de combate detectam alterações concorrentes e pedem para reabrir antes de sobrescrever outra ação. Ao trocar de cena, a janela da cena anterior é fechada. Botões de histórico e permissões continuam sendo validados pelo servidor.

É sincronização por consultas periódicas, não WebSocket: há normalmente cerca de um segundo de atraso, mais a latência da rede. Abas suspensas pelo navegador ou computadores em suspensão só retomam quando voltam a executar. O servidor do anfitrião precisa continuar aberto.

## Compatibilidade e limites
- A clonagem de estados JSON deixou de depender de `structuredClone`, que pode não estar disponível no acesso HTTP por IP da LAN/VPN. O mesmo ajuste cobre os editores administrativos.
- Arquivos do programa agora enviam `Cache-Control: no-store`, reduzindo mistura de versões antigas e novas no navegador.
- Falha ao carregar o catálogo de miniaturas não bloqueia os tokens simples nem o combate.
- A régua e o movimento seguem uma linha direta, sem desvio automático de obstáculos. Para contornar, mova em etapas.
- A régua é local; não transmite a linha para outros jogadores. A alteração persistida do combate é compartilhada.
- Mantidos: condições, iniciativa manual, ocultação de tokens, custos, terrenos e histórico. Não há vínculo automático de ficha a token ou névoa de guerra nesta versão.

## Evidências e cautela
O botão anterior apenas abria o painel; não ativava o combate. A atualização periódica anterior era suspensa por foco na grade e por janelas abertas. Esses comportamentos foram reproduzidos a partir do código e cobertos pelos novos testes. Não tivemos acesso ao navegador ou ao banco do usuário para atribuir uma causa única à falha de inserção relatada.
