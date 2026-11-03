# Validação V08

- 20 testes Python aprovados, nenhum ignorado; inclui exportação do PDF original.
- 6 testes JavaScript aprovados: geometria, células equivalentes, posições livres,
  numeração de lotes, limites sem mutação parcial e filtros do catálogo.
- Suíte de navegador anterior aprovada: login, token simples, recuperação após
  erro, movimento, persistência, exclusão, fichas, rolagens, mapas e administração.
- Nova suíte Chromium aprovada: busca com acentos, categorias, favoritos,
  inserção de dois tokens, desfazer, clique no mapa, Esc, arrastar e soltar,
  recarregamento com aparência preservada e edição da aparência.
- Sessão de jogador separada: não recebe token oculto nem controles de inserção;
  passa a ver o token público após sincronização.
- Interface testada em 1440 × 1000 e 390 × 844, sem transbordamento horizontal
  nos fluxos cobertos; painel móvel ajustado para ficar dentro da tela.
- Revisão visual por capturas internas; oito PNGs RGBA com transparência verificados.
- Servidor rejeita aparência desconhecida, URL externa, caminho relativo malicioso
  e valores de tipo incorreto, mantendo compatibilidade com tokens da V07.

Os testes são locais. Não houve sessão via Radmin real nem estudo de usabilidade
com participantes. A pesquisa de UI/UX documenta padrões estabelecidos e sugestões,
sem afirmar que todo o aplicativo atende às WCAG.

`package_release.py` verifica os hashes dos 509 itens do acervo e das oito artes
novas, além de testar a integridade de cada ZIP antes de disponibilizar a entrega.
