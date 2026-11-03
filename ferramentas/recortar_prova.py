#!/usr/bin/env python3
"""
Recorta as questões de Matemática de uma prova do ENEM (PDF do INEP) em imagens
e gera o pacote para importar no painel do professor (Banco de questões → Importar).

Uso:
  python3 recortar_prova.py prova.pdf --ano 2023 --aplicacao REG --saida pacote-2023-REG \
      [--gabarito gabarito.pdf|gabarito.txt] [--primeira 136] [--ultima 180]

Saída (na pasta --saida):
  ENEM-2023-REG-136.webp …          uma imagem por questão (recorte fiel da prova)
  questoes.json                      dados de cada questão (código, número, texto para busca, gabarito…)
  conferencia.html                   folha de conferência com todos os recortes

Como funciona: acha os cabeçalhos "QUESTÃO N", segue a ordem de leitura da prova
(página → coluna da esquerda → coluna da direita) e recorta de um cabeçalho até o próximo.
Se a questão continua na outra coluna ou na página seguinte, os pedaços são empilhados.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import pdfplumber
from PIL import Image

RES = 150  # pontos por polegada das imagens
CABECALHO = re.compile(r'^\s*QUEST[ÃA]O\s+0*(\d{1,3})\b', re.I)


def linhas_de(page):
    try:
        return page.extract_text_lines(layout=False, strip=True)
    except Exception:
        return []


def normalizar(t):
    return re.sub(r'\d+', '#', re.sub(r'\s+', ' ', t)).strip().lower()


def textos_repetidos(pdf, todas_linhas):
    """Cabeçalho e rodapé: textos que se repetem (trocando só números) nas bordas de várias páginas."""
    from collections import Counter
    cont = Counter()
    for page, linhas in zip(pdf.pages, todas_linhas):
        vistos = set()
        for ln in linhas:
            if 'quest' in ln['text'].lower():
                continue
            if ln['bottom'] < page.height * 0.15 or ln['top'] > page.height * 0.85:
                vistos.add(normalizar(ln['text']))
        cont.update(vistos)
    minimo = max(2, len(pdf.pages) // 2)
    return {t for t, n in cont.items() if n >= minimo and t and not CABECALHO.match(t)}


def limites_conteudo(page, linhas, repetidos):
    """Faixa vertical útil da página (sem cabeçalho e rodapé) e margens laterais."""
    h, w = page.height, page.width
    topo, base = h * 0.03, h * 0.97
    for ln in linhas:
        if 'quest' in ln['text'].lower():
            continue
        cromo = normalizar(ln['text']) in repetidos or (not repetidos and (ln['bottom'] < h * 0.05 or ln['top'] > h * 0.95))
        if not cromo:
            continue
        if ln['bottom'] < h * 0.15:
            topo = max(topo, ln['bottom'] + 4)
        elif ln['top'] > h * 0.85:
            base = min(base, ln['top'] - 4)
    xs = [c['x0'] for c in page.chars] or [w * 0.05]
    xe = [c['x1'] for c in page.chars] or [w * 0.95]
    esq = max(0, min(xs) - 6)
    dir_ = min(w, max(xe) + 6)
    return topo, base, esq, dir_


def cruzam_o_meio(page):
    """Quantas palavras do miolo da página atravessam o meio (muitas = coluna única)."""
    meio, h = page.width / 2, page.height
    return sum(1 for w in page.extract_words()
               if h * 0.08 < w['top'] < h * 0.92 and w['x0'] < meio - 4 and w['x1'] > meio + 4)


def divisoria(page):
    """Linha vertical entre as colunas (x, topo, base) ou None se a página for de coluna única."""
    w, h = page.width, page.height
    cands = [l for l in list(page.lines) + list(page.rects)
             if abs(l['x1'] - l['x0']) < 3 and (l['bottom'] - l['top']) > h * 0.4 and w * 0.4 < l['x0'] < w * 0.6]
    if not cands:
        return None
    x = sum((l['x0'] + l['x1']) / 2 for l in cands) / len(cands)
    return (x, min(l['top'] for l in cands), max(l['bottom'] for l in cands))


def achar_cabecalhos(page):
    """Acha 'QUESTÃO N' palavra por palavra (o PDF junta na mesma linha o texto das duas colunas)."""
    palavras = page.extract_words(keep_blank_chars=False, use_text_flow=False)
    achados = []
    for i, w in enumerate(palavras):
        t = w['text']
        m = re.fullmatch(r'QUEST[ÃA]O\s*0*(\d{1,3})', t, re.I)
        if m:
            achados.append({'n': int(m.group(1)), 'x0': w['x0'], 'top': w['top']})
            continue
        if re.fullmatch(r'QUEST[ÃA]O', t, re.I):
            for v in palavras[i + 1:i + 4]:
                if abs(v['top'] - w['top']) < 3 and 0 < v['x0'] - w['x1'] < 30 and re.fullmatch(r'0*\d{1,3}', v['text']):
                    achados.append({'n': int(v['text']), 'x0': w['x0'], 'top': w['top']})
                    break
    return achados


def tem_conteudo(page, bbox):
    x0, t, x1, b = bbox
    if b - t < 4:
        return False
    for c in page.chars:
        if c['x0'] >= x0 - 1 and c['x1'] <= x1 + 1 and c['top'] >= t - 1 and c['bottom'] <= b + 1 and c['text'].strip():
            return True
    for obj in list(page.images) + list(page.rects) + list(page.curves) + list(page.lines):
        ox0, ot, ox1, ob = obj.get('x0', 0), obj.get('top', 0), obj.get('x1', 0), obj.get('bottom', 0)
        largura = ox1 - ox0
        if ox0 >= x0 - 1 and ox1 <= x1 + 1 and ot >= t - 1 and ob <= b + 1 and largura < (x1 - x0) * 0.98:
            return True
    return False


def tem_texto(page, bbox):
    """Há texto de questão no trecho? (ignora o logotipo "enem / Exame Nacional do Ensino Médio" do fim da prova)"""
    texto = page.crop(bbox).extract_text() or ''
    texto = re.sub(r'(?i)enem\s*\d*|exame nacional do ensino m[ée]dio|\d+', '', texto)
    return len(texto.strip()) > 3


def apertar(page, bbox):
    """Encolhe o recorte até o último conteúdo (tira o branco embaixo)."""
    x0, t, x1, b = bbox
    fundo = t
    for c in page.chars:
        if c['x0'] >= x0 - 1 and c['x1'] <= x1 + 1 and c['top'] >= t - 1 and c['bottom'] <= b + 1 and c['text'].strip():
            fundo = max(fundo, c['bottom'])
    for obj in list(page.images) + list(page.rects) + list(page.curves):
        if obj['x0'] >= x0 - 1 and obj['x1'] <= x1 + 1 and obj['top'] >= t - 1 and obj['bottom'] <= b + 1:
            fundo = max(fundo, obj['bottom'])
    return (x0, t, x1, min(b, fundo + 6))


def refinar(page, bbox, primeiro):
    """Recorte limpo: sem o cabeçalho "QUESTÃO N", sem enfeites da margem e sem branco sobrando."""
    x0, t, x1, b = bbox
    dentro = lambda o: o['x0'] >= x0 - 1 and o['x1'] <= x1 + 1 and o['top'] >= t - 1 and o['bottom'] <= b + 1
    if primeiro:
        cab = [w for w in page.extract_words() if dentro(w) and re.fullmatch(r'QUEST[ÃA]O\d*', w['text'], re.I)]
        if cab:
            t = max(t, min(w['bottom'] for w in cab) + 3)
    chars = [c for c in page.chars if dentro(c) and c['top'] >= t - 1 and c['text'].strip() and c['size'] >= 4]
    graf = [o for o in list(page.images) + list(page.rects) + list(page.curves) + list(page.lines)
            if dentro(o) and o['top'] >= t - 1
            and ((o['x1'] - o['x0']) > 15 or (o['bottom'] - o['top']) > 15)                       # nada de enfeite miúdo
            and not ((o['bottom'] - o['top']) < 3 and (o['x1'] - o['x0']) > (x1 - x0) * 0.8)]      # nem o traço de fim da questão
    objs = chars + graf
    if not objs:
        return (x0, t, x1, b)
    return (max(x0, min(o['x0'] for o in objs) - 4), max(t, min(o['top'] for o in objs) - 4),
            min(x1, max(o['x1'] for o in objs) + 4), min(b, max(o['bottom'] for o in objs) + 5))


def ler_gabarito(caminho, primeira, ultima):
    if not caminho:
        return {}
    p = Path(caminho)
    texto = p.read_text(encoding='utf-8') if p.suffix.lower() == '.txt' else subprocess.run(
        ['pdftotext', '-layout', str(p), '-'], capture_output=True, text=True, check=True).stdout
    gab = {}
    for m in re.finditer(r'\b(\d{1,3})\s*[-–:.)]?\s+([A-E]|ANULAD[OA])\b', texto, re.I):
        n = int(m.group(1))
        if primeira <= n <= ultima and n not in gab:
            gab[n] = m.group(2).upper()[0] if m.group(2).upper() in 'ABCDE' else 'X'
    return gab


def segmentos_e_cabecalhos(pdf):
    """Segmentos (página, coluna) em ordem de leitura e cabeçalhos 'QUESTÃO N' de cada página."""
    # 1. segmentos (página, coluna) em ordem de leitura e cabeçalhos das questões
    segmentos, cabecalhos = [], []
    todas_linhas = [linhas_de(pg) for pg in pdf.pages]
    repetidos = textos_repetidos(pdf, todas_linhas)
    divisores = [divisoria(pg) for pg in pdf.pages]
    com_div = [d for d in divisores if d]
    # topo e base padrão do conteúdo: os da linha divisória das páginas de duas colunas
    topo_pad = sorted(d[1] for d in com_div)[len(com_div) // 2] if com_div else None
    base_pad = sorted(d[2] for d in com_div)[len(com_div) // 2] if com_div else None
    for ip, page in enumerate(pdf.pages):
        linhas = todas_linhas[ip]
        topo, base, esq, dir_ = limites_conteudo(page, linhas, repetidos)
        div = divisores[ip]
        if div or com_div:
            # o texto pode descer um pouco além da divisória: o limite é o começo do rodapé
            fim = div[2] if div else base_pad
            abaixo = [w['top'] for w in page.extract_words() if w['top'] > fim and 0 <= w['x0'] < page.width]
            base = (min(abaixo) - 3) if abaixo else min(page.height * 0.97, fim + 14)
        if div:
            xdiv, topo = div[0], div[1]
            colunas = [(esq, xdiv - 2), (xdiv + 2, dir_)]
        elif com_div:
            # página de coluna única (questões com tabela ou figura larga)
            topo = topo_pad
            colunas = [(esq, dir_)]
            xdiv = page.width * 2
        elif cruzam_o_meio(page) >= 3:
            # prova sem linha divisória: página de coluna única
            xdiv = page.width * 2
            colunas = [(esq, dir_)]
        else:
            xdiv = page.width / 2
            colunas = [(esq, xdiv - 1), (xdiv + 1, dir_)]
        for col, (x0, x1) in enumerate(colunas):
            segmentos.append({'p': ip, 'col': col, 'x0': x0, 'x1': x1, 'top': topo, 'bottom': base})
        for c in achar_cabecalhos(page):
            if topo - 6 <= c['top'] <= base:
                c['col'] = 0 if c['x0'] < xdiv else 1
                c['p'] = ip
                c['top'] -= 3
                cabecalhos.append(c)

    ordem = {(s['p'], s['col']): i for i, s in enumerate(segmentos)}
    cabecalhos.sort(key=lambda c: (ordem[(c['p'], c['col'])], c['top']))
    # mantém só a primeira ocorrência de cada número (o caderno às vezes repete o número no sumário)
    vistos, unicos = set(), []
    for c in cabecalhos:
        if c['n'] not in vistos:
            vistos.add(c['n'])
            unicos.append(c)
    cabecalhos = unicos

    return segmentos, cabecalhos, ordem


def pedacos_das_questoes(pdf, primeira=136, ultima=180):
    """{número: [(página, (x0, topo, x1, base)), …]} com os trechos de cada questão, e os avisos."""
    segmentos, cabecalhos, ordem = segmentos_e_cabecalhos(pdf)
    saida, avisos = {}, []
    for k, c in enumerate(cabecalhos):
        if not (primeira <= c['n'] <= ultima):
            continue
        prox = cabecalhos[k + 1] if k + 1 < len(cabecalhos) else None
        i_ini = ordem[(c['p'], c['col'])]
        i_fim = ordem[(prox['p'], prox['col'])] if prox else min(i_ini + 1, len(segmentos) - 1)
        if i_fim - i_ini > 3:
            avisos.append(f'Questão {c["n"]}: a próxima questão está longe demais; recortei só 3 colunas (conferir)')
            i_fim, prox = i_ini + 2, None
        pedacos = []
        for i in range(i_ini, i_fim + 1):
            s = segmentos[i]
            t = c['top'] if i == i_ini else s['top']
            b = prox['top'] if (prox and i == i_fim) else s['bottom']
            page = pdf.pages[s['p']]
            bbox = (s['x0'], max(t, 0), s['x1'], b)
            if i > i_ini and not prox and not tem_texto(page, bbox):
                break
            if tem_conteudo(page, bbox):
                pedacos.append((s['p'], apertar(page, bbox)))
        if not pedacos:
            avisos.append(f'Questão {c["n"]}: nada para recortar')
            continue
        saida[c['n']] = pedacos
    return saida, avisos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pdf')
    ap.add_argument('--ano', type=int, required=True)
    ap.add_argument('--aplicacao', default='REG', help='REG, PPL, REA, DIG…')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--gabarito')
    ap.add_argument('--primeira', type=int, default=136)
    ap.add_argument('--ultima', type=int, default=180)
    a = ap.parse_args()

    saida = Path(a.saida)
    saida.mkdir(parents=True, exist_ok=True)
    prefixo = f'ENEM-{a.ano}-{a.aplicacao.upper()}'

    pdf = pdfplumber.open(a.pdf)
    pedacos_por_q, avisos = pedacos_das_questoes(pdf, a.primeira, a.ultima)

    gab = ler_gabarito(a.gabarito, a.primeira, a.ultima)
    paginas_png = {}
    tmp = Path(tempfile.mkdtemp())

    def imagem_pagina(ip):
        if ip not in paginas_png:
            base = tmp / f'p{ip}'
            subprocess.run(['pdftoppm', '-r', str(RES), '-f', str(ip + 1), '-l', str(ip + 1), '-png', '-singlefile', a.pdf, str(base)], check=True)
            paginas_png[ip] = Image.open(f'{base}.png').convert('RGB')
        return paginas_png[ip]

    escala = RES / 72
    questoes = []
    for n, pedacos in sorted(pedacos_por_q.items()):
        c = {'n': n}
        imgs, textos = [], []
        for k_, (ip, bb) in enumerate(pedacos):
            x0, t, x1, b = refinar(pdf.pages[ip], bb, k_ == 0)
            img = imagem_pagina(ip).crop((int(x0 * escala), int(t * escala), int(x1 * escala), int(b * escala)))
            imgs.append(img)
            textos.append(pdf.pages[ip].crop((x0, t, x1, b)).extract_text() or '')
        largura = max(i.width for i in imgs)
        final = Image.new('RGB', (largura, sum(i.height for i in imgs) + 12 * (len(imgs) - 1)), 'white')
        y = 0
        for i in imgs:
            final.paste(i, (0, y))  # pedaços alinhados à esquerda
            y += i.height + 12
        codigo = f'{prefixo}-{c["n"]}'
        arquivo = f'{codigo}.webp'
        final.save(saida / arquivo, 'WEBP', quality=82, method=6)

        texto = re.sub(r'\s+', ' ', ' '.join(textos)).strip()
        texto = CABECALHO.sub('', texto, count=1).strip()
        texto = re.sub(r'\b([A-E])\1\b', r'\1)', texto)  # marcadores das alternativas vêm duplicados no PDF
        if len(pedacos) > 1:
            avisos.append(f'Questão {c["n"]}: continua em {len(pedacos)} pedaços (conferir)')
        questoes.append({
            'codigo': codigo, 'origem': 'enem', 'ano': a.ano, 'aplicacao': a.aplicacao.upper(), 'numero_prova': c['n'],
            'imagem': arquivo, 'enunciado': texto[:6000], 'resposta': gab.get(c['n']),
            'habilidade': None, 'assunto': None, 'modulo': None, 'regua': None, 'nivel': None, 'comentario': None,
        })

    faltam = [n for n in range(a.primeira, a.ultima + 1) if n not in {q['numero_prova'] for q in questoes}]
    if faltam:
        avisos.append('Não encontrei as questões: ' + ', '.join(map(str, faltam)))
    anuladas = [q['numero_prova'] for q in questoes if q['resposta'] == 'X']
    if anuladas:
        avisos.append('Anuladas no gabarito (não serão importadas): ' + ', '.join(map(str, anuladas)))

    (saida / 'questoes.json').write_text(json.dumps({'versao': 1, 'questoes': questoes}, ensure_ascii=False, indent=1), encoding='utf-8')
    cartoes = ''.join(
        f'<figure><figcaption>{q["numero_prova"]} · gabarito {q["resposta"] or "?"}</figcaption><img src="{q["imagem"]}" loading="lazy"></figure>'
        for q in questoes)
    (saida / 'conferencia.html').write_text(
        '<!doctype html><meta charset="utf-8"><title>Conferência ' + prefixo + '</title>'
        '<style>body{font-family:sans-serif;background:#eee;margin:16px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}'
        'figure{margin:0;background:#fff;padding:8px;border:1px solid #ccc}img{width:100%}figcaption{font-weight:bold;margin-bottom:6px}</style>'
        f'<h1>{prefixo}: {len(questoes)} questões</h1><main>{cartoes}</main>', encoding='utf-8')

    print(f'{len(questoes)} questões recortadas em {saida}/')
    for av in avisos:
        print('AVISO:', av)
    return 0 if questoes else 1


if __name__ == '__main__':
    sys.exit(main())
