# V12 — Névoa de guerra manual

## Atualizar
1. Encerre o servidor e faça uma cópia de segurança da pasta `data/`.
2. Extraia os três ZIPs na mesma pasta, mesclando `atlas-local` e preservando `data/`.
3. Execute `INSTALAR_DEPENDENCIAS.bat` uma vez. Essa instalação requer internet; o funcionamento continua local/LAN/Radmin.
4. Inicie o servidor normalmente e recarregue os navegadores de mestre e jogadores.

Esta versão migra o banco para o esquema 7. Para voltar à V11, restaure também o backup anterior do banco.

## Usar no mapa
- Antes de mostrar um mapa novo, escolha **Enviar com névoa** nos mapas ou arquivos. A cobertura é aplicada antes de liberar a imagem.
- Abra o ícone de névoa na barra lateral do mestre. A primeira ativação começa com tudo coberto.
- Clique em **Revelar área** ou **Ocultar área** e arraste um retângulo no mapa. Recolha o painel se precisar de espaço.
- **Concluir seleção** ou Esc encerra a ferramenta. Essa seleção não movimenta tokens nem consome movimento.
- **Ver a cobertura como jogador** mostra a cobertura opaca. É uma prévia da máscara, não uma mudança de cargo ou permissões.
- Há 20 etapas persistentes de desfazer/refazer, separadas do histórico de combate.
- Em **Mapa inteiro**, é possível cobrir ou revelar tudo, com confirmação.
- Desativar libera a imagem inteira. Reativar restaura a máscara anterior. Desfazer a ativação também desativa a proteção.

Todos os jogadores compartilham a mesma máscara. As alterações chegam automaticamente, normalmente no próximo ciclo de sincronização, mais o tempo de processamento e rede. A névoa funciona com ou sem o combate ativo.

## Proteção e navegação
O servidor entrega ao jogador uma nova imagem PNG sem os pixels ocultos ou metadados EXIF. O arquivo original do mestre é preservado. Cópias idênticas da imagem na mesma mesa compartilham a proteção.

Tokens, iniciativas vinculadas a tokens e terrenos ocultos são filtrados pelo centro da célula/token. Movimentos de jogadores são recusados quando atravessam células não reveladas. Acessos no mapa são filtrados pelo centro do botão; havendo várias variantes protegidas, precisam estar revelados em todas elas.

Ao navegar de um mapa protegido para uma imagem ainda sem configuração, o destino começa coberto. Se já tiver configuração, ela é preservada, inclusive se estiver desativada. O envio normal preserva a configuração existente, mas não ativa névoa automaticamente em imagens novas.

## Limites desta primeira versão
- Revelação manual por retângulos em uma malha de 128 × 128 áreas, independente do grid hexagonal.
- Sem visão individual, luzes, paredes ou revelação automática pelo movimento.
- Configuração por conteúdo da imagem e mesa. Manhã/noite com imagens diferentes precisam de configuração própria.
- PNG, JPEG e WebP válidos de até 40 megapixels; a imagem protegida é estática. Erros de processamento não liberam o original.
- A névoa não apaga algo já visto, baixado ou capturado pelos jogadores. Use **Enviar com névoa** antes da primeira exposição.
- Títulos, documentos, mensagens e iniciativas sem vínculo com tokens não são protegidos pela máscara. Use as permissões de arquivos e visibilidade correspondentes.
- O teste entre PCs reais na rede LAN/Radmin ainda precisa ser feito no ambiente do usuário.
