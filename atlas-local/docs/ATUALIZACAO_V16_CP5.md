# Atlas V16 CP5 — dados no chat

## Entrega
- Chat reconhece `/r` e `/roll`, sem distinguir maiúsculas. Ex.: `/r 2d20kh1+3 | Investigação`.
- O separador `|` introduz a descrição. Fórmulas sem comando continuam sendo mensagens comuns.
- Visibilidade selecionável: mesa, mestres + autor ou somente autor. Mensagens comuns permanecem públicas.
- Chat e painel usam a mesma rolagem persistida. Não há novo sorteio para apresentar o resultado no outro local.
- Reenvio de uma rolagem após falha de rede reutiliza o identificador. Reutilizá-lo com fórmula, descrição ou visibilidade diferentes produz conflito.
- Chat mistura mensagens e resultados em ordem cronológica, com paginação estável mesmo com horários iguais. Atualização automática enquanto aberto.
- Erros preservam o comando; visibilidade permanece selecionada após enviar.
- Apagar mensagens preserva rolagens. Apagar histórico compartilhado no painel de dados remove essas rolagens também do chat; resultados pessoais permanecem.
- Cards mostram fórmula, quantidade sorteada, total e detalhes dos dados descartados/críticos.
- Painel mostra animação breve individual dos resultados, até 40 representações visuais. O histórico contém todos os sorteios. Respeita movimento reduzido.

## Instalação
Feche o servidor, faça backup de data/ e mescle atlas-local na instalação existente, substituindo arquivos do programa. Preserve data/ e campaign/. Reinicie e pressione Ctrl+F5. Pacote cumulativo com os mesmos 36 tokens; não inclui os mapas/documentos particulares da campanha.

## Validação
64 testes Python: 62 aprovados e 2 ignorados. Seis testes Node aprovados. Sintaxe de todos os JavaScripts verificada. Novos testes HTTP verificam privacidade, isolamento por mesa, tentativa duplicada, comando inválido sem escrita e paginação.
Não foi executada validação visual em navegador nem em Windows/Opera nesta etapa.

## Limites e próximo checkpoint
- Animação atual é uma apresentação 2D de resultados; modelos 3D por formato de dado continuam pendentes.
- Compatibilidade com o subconjunto já documentado da sintaxe Rollem V1, não com todas as funcionalidades do bot. Referência: https://rollem.rocks/docs/v1-syntax
- Cone de visão e paredes não foram modificados. Próximos lotes: modelos visuais por dado, melhorias de fórmulas/favoritos, depois visão por token conforme PROXIMA_ETAPA_VISAO_E_DADOS.md.
- Arrombamento e furtividade permanecem fora do Atlas.
- Banco continua no schema14, sem migração destrutiva.
