# Atlas V07 — tokens e organização do código

Extraia os três ZIPs comuns na mesma pasta, mesclando `atlas-local`.
Antes de atualizar uma instalação existente, feche o servidor e faça backup de
`data/`. Os pacotes não incluem nem substituem esse diretório. Abra novamente o
servidor e recarregue o navegador (Ctrl+F5 se ele mantiver a interface anterior).
O esquema SQLite permanece na versão 5, igual à V06.

## Tokens

- Botão **＋ Token** na barra principal do mapa, disponível para mestres.
- Criar um token na exploração ativa o combate ao salvar, com aviso no formulário.
- Posicionamento em célula livre próxima da área visível, sem sobreposição inicial.
- Formulário mantém os dados e mostra o erro localmente quando o servidor rejeita
  o salvamento. O botão sinaliza o envio em andamento e impede duplo clique.
- A ação Salvar acompanha a rolagem do formulário; campo de cor mais utilizável.
- Editar, atribuir controlador, ocultar, mover e remover continuam disponíveis
  em Combate → Tokens e condições.

## Diagnóstico e limites

Na V06 recuperada, a criação funcionou com o combate ativado. Foi confirmado
que criar durante a exploração salvava um token invisível até ativar o combate;
o botão também ficava dentro de uma seção recolhida. A V07 resolve esse fluxo.
Não foi possível confirmar uma falha universal de criação na V06 ou reproduzir
exatamente o ambiente em que o problema foi observado.

## Organização e desempenho

Telas de arquivos, participantes, fichas e navegação agora têm arquivos próprios.
A geometria hexagonal e a renderização são módulos independentes. Os arquivos
da interface foram formatados para facilitar leitura e manutenção.
Imagem e grade deixam de ser reconstruídas a cada interação com um token.
O acervo, as fichas e as permissões foram preservados. Veja `ARQUITETURA.md`.

O teste automatizado verifica que imagem e grade permanecem os mesmos elementos
depois de editar e mover tokens. Isso comprova a eliminação desse retrabalho,
mas não representa uma medição de velocidade em seu computador ou rede VPN.
