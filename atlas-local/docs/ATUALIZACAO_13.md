# V13 — Fichas vinculadas e habilidades de origem

## Atualizar
Encerre o servidor, faça backup de `data/` e extraia os três ZIPs na mesma pasta, mesclando `atlas-local` e preservando seus dados. Execute `INSTALAR_DEPENDENCIAS.bat`: a nova dependência ReportLab gera o anexo de habilidades. Reinicie e recarregue os navegadores. O banco passa ao esquema 8; voltar à V12 exige restaurar também o backup anterior. O funcionamento continua local/LAN/Radmin.

## Vincular ficha e token
1. Crie a ficha e atribua seu jogador responsável em Personagens.
2. No painel Combate, adicione um token ou abra Tokens e condições → Editar selecionado.
3. Em **Ficha vinculada**, escolha o personagem e salve.
4. Selecione o token no mapa. O resumo abaixo mostra PV atual/máximo, PD atual/máximo e Defesa natural. **Abrir ficha** abre o editor lateral, preservando o mapa.

O nome do token acompanha o campo nome da ficha, ou o nome de cadastro se vazio. Seu controlador é o responsável pela ficha; os mestres também podem movimentá-lo. Nome e controlador ficam bloqueados no formulário do token enquanto vinculado. A iniciativa vinculada acompanha o nome do personagem.

PV/PD e defesa são consultados na ficha e retornados apenas aos mestres e ao responsável. Outros jogadores veem apenas o token permitido, sem identificador ou dados da ficha. Névoa e visibilidade continuam valendo. Salvar recursos na ficha atualiza o resumo automaticamente, sem recarregar. Rascunhos de ficha não são substituídos por atualizações remotas: conflitos são avisados ao salvar.

**Sem vínculo** libera a edição independente do token, sem apagar a ficha. Desfazer/refazer vínculo ou movimento não restaura recursos, nome ou conteúdo antigos da ficha. Uma ficha pode ter tokens em vários mapas; todos consultam os mesmos recursos. Posição, movimento usado e condições continuam próprios de cada token. Transporte entre mapas e sincronização de condições ficha/token ainda não estão incluídos.

## Habilidades automáticas
Na ficha compatível com Estigma, escolha raça e classe em Identidade. **Habilidades de origem** atualiza imediatamente nomes, custos, descrições completas e referências ao livro. Salve para persistir a seleção.

O catálogo contém 82 habilidades: 36 raciais (quatro por raça) e 46 de classe (quatro por classe, exceto Engenheiro, com duas). Fonte: livro salvo no projeto, consultado em 23/10/2026. Engenheiro contém Autômato e Gambiarra; não foram inventados outros poderes. Alternativas como Caça avançada, Golpe Letal e Lança de Raios permanecem na descrição de sua habilidade principal. A lista completa está em HABILIDADES_V13.md.

Trocar raça/classe substitui apenas a lista automática. Campos manuais de poderes, magias e anotações permanecem intactos. Reabrir ou salvar repetidamente não duplica entradas. Fichas existentes com seleções reconhecidas também recebem a lista.

**Salvar e abrir PDF** preserva os 168 campos editáveis do modelo Estigma e acrescenta um anexo com as habilidades. O anexo é texto de referência, não novos campos editáveis; cada exportação usa a seleção salva. As fontes acompanham o sistema e funcionam offline.

Incluir uma descrição não executa seu efeito: não gasta PD/PH, escolhe heranças, concede equipamentos, aplica condições ou ativa bônus condicionais. Os controles de cálculo existentes continuam disponíveis. Escolhas e efeitos seguem o livro e a decisão do mestre.

## Limites
Só mestres configuram vínculos; jogadores abrem/editam suas próprias fichas. Vínculos entre mesas são recusados. O resumo mostra Defesa natural, não total. Teste real entre computadores LAN/Radmin continua pendente. GitHub permanece pausado.
