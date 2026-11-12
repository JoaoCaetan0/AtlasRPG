# Atlas V16 CP7 — visão por token

## Como usar
1. Abra **Visão e névoa**. Em **Configurar alcance e cone**, ative a visão por token; escolha alcance e abertura. O padrão é 10 unidades da grade e 160 graus; 360 cria visão circular.
2. Ative a névoa manual. Libere as áreas que os jogadores podem explorar (ou use Revelar tudo, mantendo a névoa ativa). O cone será a segunda limitação sobre essas áreas.
3. Atribua o token ao jogador ou vincule à ficha dele. Na edição do token, a seção Visão permite substituir alcance e abertura; campos vazios usam os padrões da cena.
4. Jogador seleciona seu token e usa Visão e névoa > Direção > Virar token. Há oito direções rápidas; o mestre pode definir graus exatos no editor. Girar não consome movimento.
5. O mestre pode abrir **Prévia da imagem do jogador**. Esta prévia mostra somente a imagem filtrada, sem sobreposição de tokens e sem alterar a cena.

## Comportamento
- Atualiza após movimento confirmado ou rotação e pelo polling existente. Não precisa recarregar a página.
- Vários tokens controlados somam suas áreas de visão. Tokens ocultos não concedem visão. Sem token atribuído, a imagem fica coberta.
- Névoa desligada libera a imagem inteira. Áreas ocultas manualmente prevalecem sobre o cone.
- Há uma pequena região circular junto ao corpo do token, limitada pelo alcance, para manter sua origem visível. A malha de 128 × 128 células produz bordas em degraus; células de fronteira são ocultadas conservadoramente.
- O movimento pode explorar locais ainda fora do cone, desde que liberados pelo mestre na névoa manual e permitidos pelas regras de movimento/terreno existentes.
- A imagem enviada pelo servidor não contém os pixels ocultos. Tokens, iniciativas vinculadas, desenhos, terreno e acessos também respeitam o filtro. A própria posição do token controlado é preservada quando está em área manualmente liberada.
- Imagens idênticas e versões de horário vinculadas não contornam a máscara. Se houver múltiplos combates independentes na mesma imagem exata, suas restrições são intersectadas por segurança; prefira imagens distintas para cenas independentes.
- Configuração e rotação entram no estado versionado e no histórico de combate. Configurações são por cena; novos mapas começam com visão individual desligada.

## Instalação
Feche o servidor, faça backup de data/, mescle atlas-local substituindo os arquivos de programa e preservando data/ e campaign/. Reinicie e pressione Ctrl+F5. Pacote cumulativo com 36 tokens; mapas/documentos da campanha dependem da instalação existente. Sem migração destrutiva; schema14 preservado.

## Validação
Suíte completa: 70 testes Python executados, 68 aprovados, 2 ignorados. Depois foi acrescentado e aprovado mais um teste de substituição individual, união de visão e desfazer (os cinco testes de visão passaram juntos). Dez testes JavaScript aprovados e sintaxe dos módulos JS/MJS verificada.
Testes verificam pixels, restrição por dono, cópias da imagem, rotação, movimento, névoa desligada, ausência de token, conflito de revisão, prévia autorizada e configurações inválidas.
Não houve validação visual em Opera/Windows nem teste de carga com vários jogadores nesta etapa.

## Próximo checkpoint
- Validar a interação e desempenho em uma mesa real, especialmente mapas grandes e muitos tokens.
- Prévia completa com tokens, indicação gráfica da direção e manipulação do cone no mapa.
- Paredes, portas, fontes de luz e memória de exploração seguem pendentes; não há colisão do cone com paredes nesta versão.
- Arrombamento e furtividade permanecem fora do Atlas.
