# Atlas V15 CP4a
## Instalação
Encerre o servidor e faça backup completo, especialmente data/. Mescle atlas-local com a instalação, substituindo o programa e preservando data/, campaign/, imagens, fontes e PDFs. Reinicie e pressione Ctrl+F5 em todos os navegadores. Banco atualizado para esquema 11; retorno a versões antigas exige backup antigo.
## Visual
Atalhos laterais com identidade de etiqueta, bordas bronze, destaque ativo e expansão discreta. Cards e painéis da direita usam o mesmo padrão visual das condições.
## Desenhos
Mestre: ícone Desenhos na lateral. Escolha caneta, linha, seta, retângulo, elipse ou triângulo, cor e espessura. Arraste no mapa; Esc ou Concluir encerra a ferramenta. Privado é o padrão; desmarque Somente mestres antes de desenhar para compartilhar.
Desenhos são salvos na cena, acompanham horários vinculados e podem ser excluídos pela lista. Desfazer/refazer usa o Histórico de combate. Não é necessário ativar o combate para desenhar.
Jogadores recebem apenas desenhos compartilhados fora da névoa. Se qualquer parte do retângulo envolvente com margem de segurança está coberta, o desenho inteiro fica oculto. Isso é proposital para não transmitir coordenadas de áreas ocultas.
Limites: até 100 desenhos, 200 pontos por traço e limite geral de estado da cena. Escolher outra ferramenta/concluir impede movimento de token enquanto desenha.
## Próximos passos
Mover/redimensionar, preenchimento/opacidade, marca-texto, polígono e permissão para jogadores desenharem ainda pendentes. Depois: ficha e lótus. Este checkpoint não conclui o módulo inteiro de desenhos.
## Testes
Suíte Python de 47 testes (2 ignorados por arquivos reais ausentes); navegador mestre/jogador para desenho, atualização e desfazer; regressão de condições e iniciativa. Windows/Radmin real depende da validação do usuário.
