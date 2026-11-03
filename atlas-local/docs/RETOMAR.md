# Versão atual: 06

Consulte docs/ATUALIZACAO_06.md (ou ATUALIZACAO_06.md nesta pasta) e RETOMADA_V06.md.

Dados, administração e editor visual de acessos implementados.
19 testes Python e teste de navegador aprovados. Pendências em REQUISITOS_PENDENTES.md.

## Histórico anterior

# Versão atual: 05

Leia docs/ATUALIZACAO_05.md (ou ATUALIZACAO_05.md nesta pasta) para instalação, funcionalidades e limites.

GitHub pausado por solicitação do usuário. Entrega completa em três ZIPs comuns, sem montador.

# Retomada do Atlas

Leia este arquivo antes de continuar. Não dependa da memória da conversa.

## Objetivo aprovado
Servidor local sob demanda, contas, mesas com proprietário/mestres/jogadores,
convites revogáveis, fichas PDF por personagem, chat e dados Rollem V1,
mapas compartilhados, névoa manual, iniciativa, condições, movimento,
cadernos por jogador supervisionados pelos mestres e configuração de sistemas.
Preservar Estigma do Caos e seus materiais. Interface em português.

## Música — escopo reduzido
Implementar somente recursos comprovados. Fila local e áudio autorizado são
alternativas. Integração YouTube e transmissão do áudio do mestre dependem de
prova técnica; não prometer Premium para todos nem ausência de interrupções.
Nenhuma credencial Google deve entrar em pacotes ou repositórios.

## Arquitetura inicial
Python 3.10+, biblioteca padrão, SQLite, interface web sem build.
Servidor ligado apenas enquanto o processo estiver aberto. Banco e arquivos
locais. Acesso externo por túnel HTTPS é uma etapa própria, não configurada
automaticamente. Primeira versão de desenvolvimento usa loopback.

## Entregas e sequência
1. Base funcional: autenticação, mesas, convites, caderno e persistência.
2. Inventário completo, migração dos mapas e configuração Estigma.
3. Cenas e arquivos com autorização, fichas individuais.
4. Chat, rolagens compatíveis e reconexão.
5. Combate compartilhado, névoa e revisão visual.
6. Música validada, túnel, empacotamento Windows e teste remoto.

## Protocolo de continuidade
Atualizar STATUS.md a cada entrega; manter decisões e pendências concretas.
Executar testes relevantes. Fazer commit local por marco e salvar ZIP de
checkpoint com código, documentação, testes e fonte legada. Excluir banco
de usuários, sessões, credenciais e caches. Checkpoints devem ser persistidos
fora do diretório temporário. Não apagar fontes anteriores.

## Critérios de conclusão
Não anunciar a plataforma pronta antes de testar dois usuários, isolamento
entre mesas, revogação, recuperação após reinício, migração de arquivos,
permissões de documentos e funcionamento remoto. HTML legado não é seguro
para publicação direta e não deve ser servido aos jogadores.

## Atualização vinculante de 22/10
Usuário escolheu LAN/Radmin VPN para a próxima versão. Substitui a proposta de
usar túnel público. Ver REDE_RADMIN.md e STATUS.md versão 03. O pacote completo
agora contém campaign/ com acervo, mas checkpoints leves excluem os blobs.
