"""Configuração explícita de rede local/VPN. Nenhuma abertura automática de portas."""
import ipaddress,os

def bind_address(value=None):
 value=value or os.environ.get('ATLAS_BIND','127.0.0.1')
 ip=ipaddress.ip_address(value)
 if ip.version!=4 or ip.is_unspecified or ip.is_multicast or str(ip)=='255.255.255.255':raise ValueError('Escolha um IPv4 específico do computador.')
 if not (ip.is_private or ip.is_loopback or ip in ipaddress.ip_network('26.0.0.0/8')):raise ValueError('Use o IPv4 da rede local ou do Radmin VPN.')
 return str(ip)

def valid_request(headers,address):
 host,port=address;allowed={f'{host}:{port}'}
 if host=='127.0.0.1':allowed.add(f'localhost:{port}')
 authority=headers.get('Host','')
 return authority in allowed and (not headers.get('Origin') or headers['Origin']=='http://'+authority)
