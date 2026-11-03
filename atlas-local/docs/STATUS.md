# Atual: V13

Vínculo ficha/token, recursos privados ao responsável/mestre, 82 habilidades e anexo PDF. Ver ATUALIZACAO_13.md e VALIDACAO_V13.md.

# Atual: V12

Névoa manual com raster protegido no servidor, revelação por retângulos, 20 etapas de desfazer/refazer e sincronização. Ver ATUALIZACAO_12.md e VALIDACAO_V12.md.

# Versão atual: 11

Interface lateral concluída; mapa persistente e sincronização independente dos painéis. Consulte ATUALIZACAO_11.md, RETOMADA_V11.md e VALIDACAO_V11.md. Banco no esquema 6.

## Registros anteriores

# Versão atual: 10

Consulte ATUALIZACAO_10.md, RETOMADA_V10.md e VALIDACAO_V10.md.
Combate e sincronização revisados. Banco no esquema 6.

## Registro anterior

# Versão atual: 09

Consulte ATUALIZACAO_09.md, RETOMADA_V09.md e VALIDACAO_V09.md.
Histórico persistente de combate implementado. Banco no esquema 6.

---

## Registros históricos (não representam o estado atual)

# Versão atual: 06

Consulte docs/ATUALIZACAO_06.md (ou ATUALIZACAO_06.md nesta pasta) e RETOMADA_V06.md.

Dados, administração e editor visual de acessos implementados.
19 testes Python e teste de navegador aprovados. Pendências em REQUISITOS_PENDENTES.md.

## Histórico anterior

# Versão atual: 05

Leia docs/ATUALIZACAO_05.md (ou ATUALIZACAO_05.md nesta pasta) para instalação, funcionalidades e limites.

GitHub pausado por solicitação do usuário. Entrega completa em três ZIPs comuns, sem montador.

# Estado atual — versão 04

Consulte ATUALIZACAO_04.md para mudanças, instalação, testes e limitações.
Navegação e combate foram integrados ao servidor; o painel administrativo completo permanece em migração.

---

Histórico da versão 03:

# Estado — versão 03 / LAN e Radmin VPN

## Entrega implementada
- Base 02 restaurada após limpeza automática; checkpoint 03_Base persistido
  antes de continuar. Não depender de arquivos temporários para retomar.
- Servidor em loopback ou IPv4 explícito de LAN/Radmin, com inicializador Windows.
  Recusa 0.0.0.0, valida Host/Origin e limita tentativas de autenticação.
- Importação real de 477 arquivos dos quatro pacotes, 298 vínculos por versão
  dos 82 mapas; zero caminho de imagem referenciado pendente.
- Acervo portátil com 509 arquivos (inclui 32 conversões HTML para texto),
  manifest e blobs deduplicados. Arquivo histórico preserva fontes ignoradas.
- Botão Preparar Estigma do Caos exige código local do anfitrião, mostrado
  somente no terminal, e cria mesa vinculada à conta real. Jogadores não podem
  clonar o acervo secreto pela API. A importação é repetível.
- Arquivos com controle de acesso no servidor, por mesa e por participante;
  upload pelo mestre, pastas/títulos independentes por jogador e supervisão.
- Cenas compartilhadas com polling de 3 segundos, preparo privado do mestre.
- Chat persistente, histórico paginado, exclusão pelo mestre.
- Histórico/restauração de notas e aviso ao sair com alterações não salvas.
- Fichas individuais a partir de PDF AcroForm textual, edição por atribuição,
  controle de versão e PDF exportado editável. Modelo Estigma: 168 campos.
- Correção de aparência de PDF: modelo reutiliza AP entre PV/PD; exportação
  regenera todas as AP isoladamente. Sem modificar o original.
- Backup local completo e recuperação de senha pelo anfitrião no terminal.
- Interface separada em HTML/CSS/JS, abas por função e arquivos pré-visualizados
  dentro de diálogo. Código não depende de ferramentas de build.

## Verificações
- Testes HTTP de três contas: isolamento de mesas, grants de arquivo, revogação,
  biblioteca pessoal, controle da cena/chat, cargos, bloqueio e reentrada.
- Teste com processo realmente reiniciado preserva sessão, mesa e nota.
- Importação dos pacotes reais conferida, sem referências de mapas ausentes.
- Ficha exportada reaberta: 168 campos, valores corretos nos campos e widgets,
  168 appearances únicas. Página 1 renderizada/revisada para PV/PD independentes.
- JavaScript validado com node --check.
- Navegador gráfico indisponível: tentativa de instalar Chromium falhou no
  download. Não afirmar que interface visual ou fluxos de navegador foram testados.
- Windows/Radmin real não disponíveis: conexão entre computadores ainda pendente.

## Como executar testes completos
`ATLAS_TEST_PDF=/caminho/Estigma_do_Caos_Ficha_Editavel_corrigida.pdf python3 -m unittest discover -s tests -v`
Sem ATLAS_TEST_PDF o teste específico da ficha real é pulado. Instalar requirements.

## Limites funcionais conhecidos
- Não há combate/grid/tokens/dados Rollem/névoa na interface nova ainda.
- A navegação regional por hotspots e condições do atlas antigo não foram migradas.
- Áudio local só tem prévia; fila e sincronização musical/YouTube não implementadas.
- PDF baixado não sincroniza edições de volta; usar o editor dos campos no sistema.
- Só campos textuais AcroForm; imagens escaneadas, botões e escolhas não suportados.
- Cena compartilha imagem inteira e torna o arquivo público para a mesa. Retirar
  cena não revoga acesso à biblioteca. Arquivos baixados não são recuperáveis.
- Chat mostra 100 mensagens por página; sem mensagens privadas e busca ainda.
- Organização de acervo não replica todos os detalhes do projeto original; os
  documentos da aventura foram nomeados pelo índice original e mantidos privados.
- HTTP em LAN/VPN. Não usar em exposição pública. Sem HTTPS/túnel público.
- Persistência de arquivo é por hash. Importação abortada pode deixar blobs órfãos
  inacessíveis, sem publicar registros parciais. Limpeza automatizada pendente.
- Mudanças de cargo exigem reabrir a mesa para atualizar botões; o servidor aplica
  as permissões imediatamente em cada requisição.

## Próximos passos
1. Testar interface em navegador disponível e em dois Windows/Radmin. Corrigir
   eventuais falhas antes de declarar a versão pronta para sessões reais.
2. Migrar navegação regional, estados por mapa e combate do legacy/ preservado.
3. Implementar névoa com entrega protegida, não só uma camada visual.
4. Rollem V1 com corpus de compatibilidade, resultados autoritativos e dados 3D.
5. Melhorar editor de ficha (seções por página, recursos e condições vinculados).
6. Áudio: somente recursos funcionais validados; manter integração YouTube fora
   do caminho crítico. Prioridade a arquivo local autorizado e fila.
7. Encontros/sessões, arquivamento/transferência de mesa, personalização de sistema.

## Arquivos de retomada
- RETOMAR.md: escopo autorizado e protocolo.
- IMPORTACAO_REAL.json: fontes e caminhos conferidos.
- REDE_RADMIN.md: modo de rede escolhido pelo usuário.
- README.md: instruções do usuário.
- campaign/manifest.json: inventário do acervo; não inclui contas.
- legacy/ABRIR_CATALOGO_V2.html: fonte antiga intacta.
Salvar código em checkpoint leve e conjunto completo com acervo. Excluir data/,
exports, cookies e contas de teste de todos os pacotes distribuídos.
