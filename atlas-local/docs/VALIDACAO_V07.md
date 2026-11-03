# Validação V07

- 19 testes Python aprovados, incluindo o PDF original de 168 campos; nenhum ignorado.
- 3 testes de geometria aprovados: conversão de coordenadas, equivalência das células da grade antiga e posicionamento de 200 tokens sem sobreposição.
- Chromium real: criação diretamente na exploração; combate ativado ao salvar; dois tokens sem sobreposição; rejeição HTTP 409 com formulário preservado e nova tentativa bem-sucedida; edição; movimento de um hexágono com custo 1,5; persistência após recarregamento; remoção; criação no viewport de celular.
- Confirmada identidade dos elementos da imagem e da grade após criar, editar e mover tokens: essas camadas não foram reconstruídas.
- Regressões de login, dados, administração, novo mapa, desenho de acesso e ficha com cálculo e salvamento aprovadas.
- Sem erros JavaScript não tratados observados no teste visual. Sem transbordamento horizontal nos fluxos móveis testados.
- Revisão visual do mapa de combate realizada em captura de tela interna.

Limites: Chromium em ambiente de teste local; não foi realizada uma sessão com jogadores via Radmin nem benchmark no computador do usuário. A V06 permitiu criação com combate ativo; não se atribui a esta atualização a correção de um erro universal não reproduzido.

Os três ZIPs são gerados por package_release.py: os hashes de todos os blobs do manifesto e a integridade de cada ZIP são verificados antes da entrega.
