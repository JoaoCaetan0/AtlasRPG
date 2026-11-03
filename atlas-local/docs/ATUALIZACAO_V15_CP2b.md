# Atlas V15 — Checkpoint 02b
## Instalação
Encerre o Atlas e faça backup completo, principalmente data/. Extraia e mescle atlas-local na instalação substituindo os arquivos do programa. Preserve data/ e campaign/. Reinicie o servidor e use Ctrl+F5 nos navegadores.
O banco passa automaticamente do esquema 8 para 9. Para voltar a uma versão antiga, restaure também o backup anterior do banco.

## Como usar
Abra um mapa cadastrado que tenha mais de uma versão. Na barra da cena, use Horário.
Na primeira troca, compare as imagens e confirme que possuem a mesma planta e enquadramento. As próximas trocas entre versões vinculadas são diretas.
Tokens, movimento gasto, grade, iniciativa, condições, terreno, histórico de combate e névoa permanecem compartilhados. A mudança aparece automaticamente para jogadores conectados.
A câmera reenquadra a nova imagem; os botões +/− permanecem disponíveis.

## Proteções e limites
Proporções diferentes são bloqueadas. A igualdade de proporções não comprova alinhamento: confira visualmente antes de vincular.
Se o destino já tiver combate ou névoa independentes, nada é sobrescrito: abra essa versão pelo catálogo para acessar seu estado. Mesclagem de estados independentes ainda não está disponível.
Imagens usadas por mais de um mapa não podem ser vinculadas até que o cadastro use imagens exclusivas.
A vinculação é persistente; edição e desvinculação dessas camadas não estão incluídas nesta etapa.
Nenhum mapa ou dado pessoal acompanha este ZIP; ele contém o programa completo e os checkpoints.

## Próximas etapas
Condições pesquisáveis e ícones, token Morto, desenhos, fichas e lótus. Melhorias de dados permanecem adiadas.

## Validação concluída
44 testes Python aprovados (2 ignorados por ausência dos arquivos reais da campanha/ficha). Testes Chromium de troca de horário mestre/jogador e regressão da câmera/catálogo aprovados.
