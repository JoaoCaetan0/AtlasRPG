# Versão 04 — navegação e combate em rede

## Instalação sobre a versão 03
1. Encerre o servidor (Ctrl+C).
2. Faça uma cópia da pasta atlas-local inteira, especialmente data/.
3. Extraia o ZIP da atualização no diretório que contém atlas-local, aceitando substituir os arquivos de código.
4. Preserve as pastas data/ e campaign/ existentes. O ZIP não contém nem substitui essas pastas.
5. Abra INICIAR_REDE_RADMIN.bat e atualize a página do navegador (Ctrl+F5).

O pacote também é um checkpoint completo do código, mas não repete o acervo de imagens da versão 03. Para uma instalação nova, monte primeiro o pacote completo 03.

## Como usar
- Mapas → Abrir: os acessos recuperados ficam sobre a imagem; clicar abre o destino. Destinos múltiplos mostram opções. O mestre pode editar áreas normalizadas e destinos.
- Disponibilizar mapa aos jogadores libera o registro e TODAS as suas variações. A imagem continua inteira; isso não é névoa de guerra.
- Envie uma imagem à mesa e abra Combate. Cada imagem possui seu próprio estado de combate.
- Crie tokens, escolha seu controlador, cor e orçamento de movimento. Selecione o token e clique em um hexágono vizinho. O movimento é cobrado no servidor; não aceita saltos ou orçamento excedido quando a limitação está habilitada.
- Grade e terreno permite configurar tamanho, distância, unidade, visibilidade e pintar hexágonos normais, difíceis ×2, muito difíceis ×3 ou bloqueados.
- Iniciativa aceita participantes com ou sem token, nomes, valores, ordem manual (setas), ordenação decrescente, turno ativo, ocultação e remoção. Próximo turno reinicia o movimento do token correspondente; ao fechar a volta, incrementa a rodada.
- Condições podem ser aplicadas ao token ou participante, ocultadas dos jogadores, ter estágios e receber cor/ícone/descrição personalizados. Condições em participantes ligados a tokens são compartilhadas com o token.
- Jogadores movem apenas os próprios tokens visíveis. Inimigos ocultos, entradas ligadas a tokens ocultos e condições secretas são filtrados no servidor.
- Atualização entre clientes a cada 3 segundos. Alterações concorrentes são recusadas por revisão, evitando sobrescrever silenciosamente o estado de outro mestre.

## Recuperação conferida
O HTML antigo inclui de fato navegação, combate e administração. Foram reaproveitados o conjunto de acessos de 28 mapas e as 28 condições com descrições, ícones, cores e referências de página existentes. Não houve nova conferência no Canva; as regras são as do catálogo recuperado.
Alterações pessoais que estavam somente no localStorage do navegador antigo não estão automaticamente no arquivo salvo. Não apagar o navegador antigo antes de exportá-las.

## Limites conhecidos
- O editor administrativo completo antigo ainda não foi migrado. Há edição de acessos, parâmetros de grade e condições por cena.
- Grid atual com hexágonos de ponta para cima. Movimento por cliques adjacentes, sem arrastar tokens, traçar caminhos longos ou calcular rotas automáticas.
- Trocar o tamanho da grade reposiciona tokens a partir de suas coordenadas axiais; calibre antes de colocar tokens. Variantes manhã/tarde/noite têm combates separados.
- Não impede sobreposição de tokens nem impõe automaticamente a vez do jogador; mestre coordena a ordem. Condições são marcadores e regras consultáveis, sem aplicar modificadores automaticamente.
- Até 200 tokens, 200 participantes e 200 condições por cena; estado limitado a 60 KB. O catálogo padrão já ocupa parte desse limite.
- Névoa, Rollem, dados 3D, música sincronizada e importação completa de cenas/perfis antigos ainda pendentes.
- Sem teste visual automatizado de navegador ou conexão real entre computadores Windows/Radmin nesta entrega.

## Verificação
Novo teste HTTP com mestre/jogador/visitante verifica controle de token, orçamento, terreno bloqueado, movimentos não adjacentes, conflitos de revisão, persistência, condições/inimigos secretos e acessos para mapas ocultos. Testes existentes de contas, arquivos, rede e reinício foram reexecutados. Teste de exportação PDF requer o modelo original e não foi repetido nesta etapa.
