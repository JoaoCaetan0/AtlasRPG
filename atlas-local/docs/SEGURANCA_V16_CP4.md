# Revisão inicial de segurança e integridade — V16 CP4

Estado: endurecimento da versão local/VPN. Não é certificação nem liberação para publicação na internet. Esquema do banco permanece 14. Arrombamento e furtividade estão fora do Atlas por decisão do usuário.

## Correções aplicadas

1. Organização de arquivos: a exceção de mestre permitia gravar uma organização própria referenciando arquivo de outra mesa, caso o ID fosse conhecido. Agora a pertença e autorização são verificadas antes da gravação. Não foi demonstrado vazamento do conteúdo por essa falha.
2. Uploads HTTP: imagens PNG/JPEG/WebP precisam decodificar, corresponder à extensão, ser estáticas e ter até 32 milhões de pixels. Mantido limite de 10 MiB por upload. Nomes com caminhos, controles e dois-pontos são recusados. Texto exige UTF-8. PDF e áudio recebem somente checagens iniciais de assinatura; isso NÃO é sanitização nem antivírus. Imports locais legados não foram reescritos.
3. HTTP/JSON: rejeita Host/Origin duplicados, Content-Length ambíguo, Transfer-Encoding, JSON com chaves duplicadas, números não finitos ou aninhamento excessivo. Tempo máximo de inatividade na conexão de 15 segundos; não é proteção completa contra conexão lenta ou negação de serviço.
4. Login: limitação de tentativas é verificada antes de adquirir a transação de escrita. Até 30 tentativas por IP/minuto e tabela em memória limitada a 4096 IPs ativos. Login bem-sucedido substitui a sessão apresentada pelo navegador e limpa sessões expiradas. Outros dispositivos continuam conectados. Reiniciar o processo reinicia o limitador.
5. Respostas: Referrer-Policy no-referrer e identificação HTTP sem versão Python. Preservados nosniff, autorização por mesa, cookies HttpOnly/SameSite e sandbox dos arquivos.

## Verificação de dados

Com o servidor encerrado, execute na pasta atlas-local:

    python audit_data.py

Para outra instalação:

    python audit_data.py --data "C:\Atlas\atlas-local\data"

A ferramenta abre o banco em modo somente leitura, confere integrity_check e foreign_key_check, tamanho e SHA-256 dos arquivos e vínculos de cena/mapas entre mesas. Informa arquivos sem referência como aviso. Não apaga, repara ou regrava nada. Saída JSON no terminal; código 0 sem erros, 1 quando há erro. Encerre o servidor para evitar mudanças concorrentes entre a leitura do banco e dos arquivos. O diagnóstico não substitui backup e teste de restauração.

## Pendências antes de ficar online

- Substituir o adaptador http.server por servidor/framework de produção, mantendo regras de negócio e testes; TLS obrigatório e cookies Secure no modo HTTPS, origem pública explícita e proxies confiáveis.
- Limites globais de conexões, requisições, CPU, memória, uploads e armazenamento por conta/mesa. Registro público hoje é aberto; definir convites/cadastro e recuperação de conta.
- Limitação de tentativas persistente, proteção por conta além de IP, revogação de todas as sessões e revisão de autenticação. Não confiar cegamente em X-Forwarded-For.
- Auditoria de dependências e atualizações; parsers de documentos em isolamento; política de anexos, varredura quando apropriada e armazenamento privado.
- Política CSP da aplicação, revisão completa de XSS e autorização em cada rota/objeto; o sandbox dos anexos não substitui essas medidas.
- Migrações transacionais versionadas, backup consistente de banco e blobs, ensaio de restauração, logs de segurança sem senhas/cookies e monitoramento.
- Testes adversariais de múltiplas mesas/usuários, concorrência e carga. SQLite não foi declarado inadequado: medir a carga antes de decidir uma migração de banco.

## Referências consultadas

- OWASP File Upload: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Python http.server (não recomendado para produção): https://docs.python.org/3/library/http.server.html
- SQLite integrity_check/foreign_key_check: https://sqlite.org/pragma.html

Esta revisão cobre os pontos descritos. Não afirma ausência de outras vulnerabilidades. O banco real do usuário não foi fornecido nem auditado; os testes usam dados temporários.
