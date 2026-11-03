# Conexão por LAN / Radmin VPN

Decisão do usuário: a próxima versão usa rede local ou rede virtual privada;
não haverá túnel público, hospedagem ou abertura de portas do roteador.

## Anfitrião (Windows)
1. Conecte o Radmin VPN e crie uma rede privada com senha própria.
2. Convide os jogadores para essa rede. Eles também precisam do Radmin VPN
   para acesso remoto por essa modalidade. Em uma LAN física, basta acesso à LAN.
3. Abra INICIAR_REDE_RADMIN.bat. Informe o IPv4 exibido pelo Radmin ao lado do
   seu computador. Para LAN física, informe o IPv4 do adaptador local.
4. Abra o endereço exibido, por exemplo http://26.12.34.56:8765.
   Esse IP é apenas um exemplo; use o seu. Compartilhe o link real com o grupo.
5. Crie sua conta, prepare Estigma do Caos e gere os convites na mesa.
6. Encerre com Ctrl+C. O banco e os arquivos permanecem em data/.

O servidor ouve apenas o IP escolhido. 0.0.0.0 é recusado. Ao escolher a VPN,
use o endereço VPN também no navegador do próprio anfitrião. Não exige Radmin
Server/Viewer de controle remoto: este fluxo usa Radmin VPN e navegador.

## Firewall e conexão
Se a conexão for bloqueada, permita o processo Python/porta TCP 8765 apenas
na interface local/VPN e, preferencialmente, nos IPs dos participantes.
Não desative o firewall. Não encaminhe essa porta no roteador.
A rede privada reduz exposição pública, mas não substitui contas e permissões.
A aplicação usa HTTP nesta versão; para conexão remota use o túnel privado da
VPN. HTTPS próprio fica para etapa posterior. Não publicar diretamente.
Radmin VPN precisa estar conectado, e o PC anfitrião precisa ficar ligado.
Não há configuração automática do Radmin nem alteração automática de firewall.

Referência oficial consultada: https://www.radmin-vpn.com/br/help/

## Validação realizada
Testados bind explícito, bloqueio de bind universal, validação Host/Origin,
login e autorização via HTTP local. Não foi testado Radmin real nem firewall
Windows neste ambiente. O teste entre dois computadores Windows é necessário
antes de considerar a conectividade remota validada.
