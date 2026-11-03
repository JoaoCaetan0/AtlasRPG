# Validação V09

- 24 testes Python aprovados, nenhum ignorado, incluindo exportação da ficha real.
- 6 testes JavaScript de geometria e catálogo aprovados.
- As duas suítes anteriores de navegador (geral e assets) aprovadas.
- Nova suíte de navegador aprovada: desfazer remoção e edição, refazer, persistência
  após recarregar, movimento no mapa e devolução do custo, atalhos preservados em
  campos de texto e fora da aba do mapa; verificação de largura móvel.
- Revisão visual do menu Histórico em desktop e celular realizada com capturas internas.

Os quatro testes novos do servidor verificam sequência completa de estados,
movimento de jogador, metadados privados, permissões, revisão desatualizada,
persistência em novas conexões, novo ramo de ações, no-op, limite de 40 registros,
isolamento entre imagens, divergência do estado e rollback de restauração inválida
quando um participante foi removido.

A suíte maior inicialmente atingiu o limitador de cadastros compartilhado entre
os servidores temporários dos testes. O estado desse limitador foi isolado nos
novos testes; a proteção do servidor de produção não foi reduzida.

Não foi feita uma sessão entre computadores via Radmin. O recurso é restrito
ao combate e não possui histórico retroativo das ações de versões anteriores.

Pacotes: verificação de integridade dos ZIPs e dos hashes do acervo e das oito artes
pelo script package_release.py. Nenhum banco de teste ou dado pessoal é incluído.
