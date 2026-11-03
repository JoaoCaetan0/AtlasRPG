# Versão atual: 13

Fichas vinculadas e habilidades automáticas de raça/classe. Leia docs/ATUALIZACAO_13.md. Encerre o servidor, faça backup de data/, extraia os três ZIPs na mesma pasta e execute INSTALAR_DEPENDENCIAS.bat. Esquema 8: retorno à V12 exige backup anterior.

## Histórico anterior

# Versão atual: 12

Névoa de guerra manual integrada ao mapa. Leia docs/ATUALIZACAO_12.md para instalação, uso e limites.

Faça backup de data/, extraia os três ZIPs na mesma pasta e execute INSTALAR_DEPENDENCIAS.bat antes de iniciar. Migração para esquema 7: voltar à V11 exige restaurar o backup anterior. Servidor local/LAN/Radmin; GitHub pausado.

## Histórico

# Versão atual: 11

Painéis laterais sobre o mapa: chat, dados, combate, tokens, mapas, arquivos, fichas, caderno e administração. Leia docs/ATUALIZACAO_11.md para instalar e usar; testes em docs/VALIDACAO_V11.md.

Extraia os três ZIPs na mesma pasta. Faça backup e preserve data/. GitHub pausado; servidor local/LAN/Radmin.

## Histórico anterior

# Versão atual: 05

Leia docs/ATUALIZACAO_05.md (ou ATUALIZACAO_05.md nesta pasta) para instalação, funcionalidades e limites.

GitHub pausado por solicitação do usuário. Entrega completa em três ZIPs comuns, sem montador.

# Atualização 04

Esta versão acrescenta navegação e combate compartilhado à base 03. Leia docs/ATUALIZACAO_04.md antes de atualizar. Preserve data/ e campaign/.

# Atlas local — versão 03 / LAN e Radmin VPN

## Começar
1. Extraia o ZIP completo mantendo a pasta atlas-local inteira.
2. Instale Python 3.10 ou posterior no Windows.
3. Execute INSTALAR_SUPORTE_PDF.bat uma vez para instalar a biblioteca da ficha.
4. Abra INICIAR_WINDOWS.bat para uso somente no PC, ou INICIAR_REDE_RADMIN.bat
   para selecionar explicitamente o IP da LAN/Radmin VPN.
5. Entre no endereço mostrado, crie sua conta e clique em Preparar Estigma do Caos.
   Informe o código do anfitrião mostrado no terminal. Esse código protege o
   acervo original contra cópia por jogadores e não deve ser compartilhado.
   A instalação do acervo pode levar alguns instantes. Não feche o aplicativo.
6. Abra a mesa. Gere convites em Participantes. Todos entram como jogadores.

A versão completa inclui campaign/ com mapas, documentos e a ficha. O ZIP de
checkpoint contém código e documentos de retomada, mas não o acervo volumoso.
Se usar o checkpoint, IMPORTAR_CAMPANHA.bat permite importar os arquivos originais
listados em docs/FONTES_PENDENTES.md. Não é necessário importar ambos os modos.

## Uso
- Cena: acompanha a imagem escolhida pelo mestre a cada 3 segundos.
- Mapas: versões de horário, abertura privada e envio da imagem inteira à mesa.
- Biblioteca: arquivos autorizados, pastas e títulos pessoais, envio pelo mestre
  (até 10 MiB), autorização por participante e prévia de imagens/PDF/texto/áudio.
- Personagens: escolha PDF preenchível, atribua ao jogador, edite e salve valores.
  Exporte para PDF editável. Edições em PDF baixado não retornam automaticamente.
- Caderno: notas com conflito de versão, aviso de saída e restauração de histórico.
- Conversa: chat persistente, últimos 100 registros e navegação para anteriores;
  mestre pode apagar o histórico. Atualização a cada 3 segundos.
- Participantes: convites, cargos, remoção, bloqueio e desbloqueio.

A ficha de Estigma possui 168 campos textuais. A exportação isola as aparências
visuais de cada campo para evitar que PV apareça também em PD. Outros modelos
precisam ter campos de texto AcroForm; PDFs escaneados e campos de outros tipos
não são editados por este módulo inicial.

## Conteúdo e privacidade
A campanha começa privada. Enviar à mesa compartilha a imagem inteira e a torna
pública na biblioteca dessa mesa. Retirar da cena NÃO revoga o acesso ao arquivo;
use Biblioteca > Acesso para revogar. Não há névoa de guerra nesta versão.
Os documentos não são enviados aos jogadores antes da concessão de acesso.
Arquivos HTML antigos foram preservados como texto para leitura segura e os
originais ficam no arquivo histórico do acervo, quando presente.
O caderno é visível para o jogador e os mestres; não é segredo contra o mestre.

## Dados e continuidade
Dados locais ficam em data/. Encerre o servidor antes de fazer backup:
`py -3 backup.py C:\Backups\Atlas_2026-10-22.zip`
Guarde uma cópia em outro disco. Para restaurar, servidor encerrado, preserve
uma cópia da pasta atual e extraia data/ do backup ao lado de server.py.
Nunca distribua o backup pessoal: ele contém contas, anotações e sessões.
Para atualizar, preserve data/ e campaign/ e substitua apenas os arquivos de código.
Leia docs/STATUS.md e docs/RETOMAR.md para continuar o desenvolvimento.

## Limites desta versão
Não inclui ainda combate multiplayer, grid/tokens, dados Rollem, névoa,
navegação regional clicável migrada, automações de condições, playlists musicais
compartilhadas ou integração YouTube. A fonte do atlas anterior está preservada
em legacy/. Essas funções antigas não foram perdidas, mas sua migração não terminou.
Não houve validação visual completa da interface nem teste real em Windows/Radmin.
Não há hospedagem externa. Consulte docs/REDE_RADMIN.md.

Recuperação local de senha (servidor encerrado):
`py -3 reset_password.py --user "Seu nome"`
Esse comando pede a nova senha sem exibi-la e encerra as sessões antigas.
