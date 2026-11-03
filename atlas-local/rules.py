"""Regras de criação transcritas do ebook DAHX3QrgRoo, páginas 13–50.
Sem eval, sem arredondamento ou limite de atributos inventado.
"""
import math
import abilities
RACES={'Humano':(4,4),'Elfo':(2,6),'Qareen':(0,8),'Golem':(8,0),'Anão':(6,2),'Tritão':(3,5),'Draconato':(5,3),'Silvano':(1,7),'Orc':(7,1)}
CLASSES={'Atirador':[22,23,20],'Bárbaro':[16,12,23],'Bardo':[5,18,25],'Bruxo':[18,7,27],'Cavaleiro':[16,9,27],'Clérigo':[24,18,5],'Engenheiro':[8,14,3],'Espadachim':[16,23,27],'Guerreiro':[16,9,4],'Ladino':[15,10,7],'Mago':[18,21,27],'Paladino':[24,16,9]}
POWERS={'musculatura':('Bárbaro','Musculatura Saudável: +2 × FOR em PV'),'voto':('Paladino','Voto Sagrado ativo: +CAR em Defesa'),'aura':('Mago','Aura mística: +INT em Negação de Dano')}
EXTRAS={'pv':'Ajuste de PV','pd':'Ajuste de PD','def':'Ajuste de Defesa natural','pp':'Ajuste de PP iniciais','slots':'Ajuste de slots de magia','inventory':'Ajuste de capacidade','nd':'Ajuste de Negação de Dano'}
RACE_SKILLS={'Elfo':[22],'Qareen':[18,21],'Golem':[9],'Anão':[8],'Draconato':[9,12],'Silvano':[23,10],'Orc':[27,16,12]}
CHOICES={'Elfo':[19,5],'Anão':[5,21,19],'Tritão':[16,11,22]}
def catalog():return {'abilities':abilities.catalog(),'races':list(RACES),'classes':list(CLASSES),'powers':POWERS,'extras':EXTRAS,'skillChoices':CHOICES,'source':'Estigma do Caos — ebook Canva DAHX3QrgRoo, pp. 13–50; consultado em 23/10/2026.'}
def number(v):
 try:n=float(v or 0)
 except (TypeError,ValueError):raise ValueError('Informe números nos atributos, perícias e ajustes.')
 if not math.isfinite(n) or abs(n)>10000:raise ValueError('Valor numérico fora do limite de 10.000.')
 return n

def calculate(fields,build):
 if not isinstance(build,dict) or type(build.get('auto',False))!=bool:raise ValueError('Configuração de cálculo inválida.')
 race=fields.get('raca');cls=fields.get('classe')
 if race not in RACES or cls not in CLASSES:raise ValueError('Escolha raça e classe de Estigma para calcular.')
 a={k:number(fields.get('atributo_'+k)) for k in ['CON','DES','FOR','CAR','INT']};con,des,for_,car,int_=[a[k] for k in ['CON','DES','FOR','CAR','INT']]
 extras=build.get('extras',{});powers=build.get('powers',[])
 if not isinstance(extras,dict) or not isinstance(powers,list) or any(p not in POWERS for p in powers):raise ValueError('Ajustes ou habilidades inválidos.')
 x={k:number(extras.get(k)) for k in EXTRAS};rpv,rpd=RACES[race]
 cpv=2*for_ if cls=='Bárbaro' and 'musculatura' in powers else 0
 cdef=car if cls=='Paladino' and 'voto' in powers else 0
 rdef=des if race=='Tritão' else con if race=='Draconato' else 0
 rpp=3*(max(0,int_)+max(0,car)) if race=='Humano' else 0
 pv=1+rpv+cpv+4*con+max(0,for_)+max(0,des)+x['pv']
 pd=1+rpd+2*con+3*(max(0,car)+max(0,int_))+x['pd']
 defense=10+2*des+rdef+cdef+x['def']
 pp=2+2*sum(max(0,a[k]) for k in ['INT','FOR','CAR','DES'])+rpp+x['pp']
 myst=number(fields.get('skill_18_nivel'));ath=number(fields.get('skill_04_nivel'))
 slots=math.floor(myst/2)+{'Bruxo':2,'Bardo':1,'Clérigo':2,'Espadachim':1,'Mago':2,'Paladino':1}.get(cls,0)+x['slots']
 inventory=2+for_+con+ath+(for_+con if race=='Draconato' else 0)+x['inventory']
 nd=(con if race=='Golem' else 0)+(int_ if cls=='Mago' and 'aura' in powers else 0)+x['nd']
 skills={}
 for n in CLASSES[cls]+RACE_SKILLS.get(race,[]):
  k='skill_%02d_nivel'%n;skills[k]=str(int(skills.get(k,0))+1)
 choice=build.get('race_skill','')
 if choice:
  if str(choice) not in [str(n) for n in CHOICES.get(race,[])]:raise ValueError('Escolha de perícia racial incompatível.')
  k='skill_%02d_nivel'%int(choice);skills[k]=str(int(skills.get(k,0))+(2 if race=='Tritão' else 1))
 fmt=lambda n:format(n,'.10g')
 return {'fields':{'pv_maximo':fmt(pv),'pd_maximo':fmt(pd),'def_natural':fmt(defense)},'stats':{'PV máximo':pv,'PD máximo':pd,'Defesa natural':defense,'Defesa total':defense+sum(number(fields.get(k)) for k in ['def_armadura','def_escudo','def_mod']),'PP iniciais':pp,'Sanidade máxima (metade de PD)':pd/2,'Slots de magia (regra geral)':slots,'Slots de inventário':inventory,'Negação de Dano (sem equipamento)':nd},'formulas':{'PV':f'1 + raça {rpv} + classe {cpv} + CON×4 + max(FOR,0) + max(DES,0) + ajuste {x["pv"]}','PD':f'1 + raça {rpd} + CON×2 + (max(CAR,0)+max(INT,0))×3 + ajuste {x["pd"]}','Defesa natural':f'10 + DES×2 + raça {rdef} + classe {cdef} + ajuste {x["def"]}','PP iniciais':'2 + (max(INT,0)+max(FOR,0)+max(CAR,0)+max(DES,0))×2 + bônus racial + ajuste'},'warnings':(['PV/PD resultaram em zero ou menos. Revise a distribuição com o mestre.'] if pv<=0 or pd<=0 else [])+(['Aluno Exemplar do Mago: confirme com o mestre se substitui ou soma a regra geral de slots; use o ajuste de slots.'] if cls=='Mago' else []),'skills':skills}
