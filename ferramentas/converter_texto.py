#!/usr/bin/env python3
"""
Converte as questões de uma prova do ENEM (PDF do INEP) para TEXTO + FIGURAS, no formato do caderno do site.

Uso:
  python3 converter_texto.py prova.pdf --ano 2025 --aplicacao REG --pacote pasta-do-pacote [--ajustes ajustes.py]

Lê o questoes.json do pacote (gerado por recortar_prova.py e já classificado) e acrescenta em cada questão:
  enunciado     texto com marcação simples: parágrafos, [[fig:N]] e $$…$$ para fórmulas
  alternativas  {"A": "...", ...} (texto, ou [[fig:N]] quando a alternativa é uma figura)
  figuras       ["ENEM-2025-REG-147-f1.webp", ...] recortes das figuras, tabelas e gráficos
  formato       "texto" (o recorte original continua em "imagem", para o botão "Ver na prova")

O arquivo de --ajustes (opcional) tem um dicionário AJUSTES = {número: {"enunciado": ..., "alternativas": {...}}}
com as correções feitas à mão depois da conferência; o que estiver lá substitui o que foi extraído.
Também gera revisao.html, com o recorte original ao lado do texto convertido.
"""
import argparse
import html
import importlib.util
import json
import re
import statistics
import subprocess
import sys
import tempfile
from pathlib import Path

import pdfplumber
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from recortar_prova import pedacos_das_questoes  # noqa: E402

RES = 150
ESC = RES / 72
LETRAS = 'ABCDE'
SIMBOLOS = {'p': 'π', '´': '×', '£': '≤', '³': '≥', '¹': '≠', '»': '≈', '·': '·', 'Ö': '√', 'D': 'Δ', 'a': 'α', 'b': 'β', 'q': 'θ'}


def dentro(o, bbox, folga=1.0):
    x0, t, x1, b = bbox
    return o['x0'] >= x0 - folga and o['x1'] <= x1 + folga and o['top'] >= t - folga and o['bottom'] <= b + folga


def caixa(objs):
    return (min(o['x0'] for o in objs), min(o['top'] for o in objs), max(o['x1'] for o in objs), max(o['bottom'] for o in objs))


def sobrepoe(a, b, folga=0.0):
    return not (a[2] + folga < b[0] or b[2] + folga < a[0] or a[3] + folga < b[1] or b[3] + folga < a[1])


def texto_char(c):
    t = c['text']
    if 'Symbol' in c.get('fontname', '') and t in SIMBOLOS:
        return SIMBOLOS[t]
    if t == '\u2212':
        return '−'
    return t


# ---------------------------------------------------------------- frações
def achar_fracoes(chars, graficos, tamanho):
    """Barras de fração: traço horizontal curto com caracteres logo acima e logo abaixo.
    Devolve (tokens sintéticos, ids dos chars usados, ids dos gráficos usados)."""
    tokens, usados_c, usados_g = [], set(), set()
    for g in graficos:
        larg, alt = g['x1'] - g['x0'], g['bottom'] - g['top']
        if not (alt <= 1.6 and 3 <= larg <= 90):
            continue
        meio = (g['top'] + g['bottom']) / 2
        acima = [c for c in chars if id(c) not in usados_c and c['x0'] >= g['x0'] - 2 and c['x1'] <= g['x1'] + 2
                 and meio - tamanho * 0.6 <= c['bottom'] <= meio + 0.8 and c['top'] < meio]
        abaixo = [c for c in chars if id(c) not in usados_c and c['x0'] >= g['x0'] - 2 and c['x1'] <= g['x1'] + 2
                  and meio - 0.8 <= c['top'] <= meio + tamanho * 0.5 and c['bottom'] > meio]
        if not acima or not abaixo:
            continue
        # expoentes do numerador ficam mais altos: entram se encostados no numerador
        ids_a = {id(c) for c in acima}
        for c in chars:
            if id(c) in ids_a or id(c) in usados_c or c['size'] >= tamanho * 0.85:
                continue
            if g['x0'] - 2 <= c['x0'] and c['x1'] <= g['x1'] + 2 and meio - tamanho * 1.15 <= c['bottom'] <= meio \
                    and any(abs(c['x0'] - a['x1']) < tamanho * 0.3 for a in acima):
                acima.append(c); ids_a.add(id(c))
        num = juntar_linha(sorted(acima, key=lambda c: c['x0']), tamanho)
        den = juntar_linha(sorted(abaixo, key=lambda c: c['x0']), tamanho)
        tokens.append({'text': f'$$\\frac{{{num}}}{{{den}}}$$', 'x0': g['x0'], 'x1': g['x1'],
                       'top': min(c['top'] for c in acima), 'bottom': max(c['bottom'] for c in abaixo), 'size': tamanho, 'sintetico': True})
        usados_c.update(id(c) for c in acima + abaixo)
        usados_g.add(id(g))
    return tokens, usados_c, usados_g


def juntar_linha(chars, tamanho):
    """Numerador/denominador de fração: mantém expoentes (caracteres menores e mais altos)."""
    if not chars:
        return ''
    grande = max(c['size'] for c in chars)
    base = statistics.median([c['bottom'] for c in chars if c['size'] >= grande * 0.85])
    out, ant, modo = '', None, None
    for c in chars:
        pos = None
        if c['size'] < grande * 0.85:
            pos = 'sup' if c['bottom'] < base - grande * 0.15 else 'sub'
        if ant is not None and c['x0'] - ant['x1'] > tamanho * 0.22 and not out.endswith(' '):
            if modo:
                out += '}'; modo = None
            out += ' '
        if pos != modo:
            if modo:
                out += '}'
            if pos:
                out += '^{' if pos == 'sup' else '_{'
            modo = pos
        out += texto_char(c)
        ant = c
    if modo:
        out += '}'
    return out.strip()


# ---------------------------------------------------------------- figuras
def agrupar_figuras(graficos, chars, area, tamanho):
    """Junta objetos gráficos próximos em regiões de figura e puxa para dentro os rótulos de texto."""
    regioes = []
    for g in graficos:
        b = (g['x0'], g['top'], g['x1'], g['bottom'])
        regioes.append(list(b))
    mudou = True
    while mudou:
        mudou = False
        for i in range(len(regioes)):
            for j in range(i + 1, len(regioes)):
                if sobrepoe(regioes[i], regioes[j], folga=6):
                    a, b = regioes[i], regioes.pop(j)
                    regioes[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                    mudou = True
                    break
            if mudou:
                break
    # descarta regiões minúsculas (pontos soltos) e traços que atravessam a coluna inteira (separadores)
    largura_area = area[2] - area[0]
    boas = []
    for r in regioes:
        w, h = r[2] - r[0], r[3] - r[1]
        if w < 6 and h < 6:
            continue
        if h < 3 and w > largura_area * 0.8:
            continue
        sem_texto = not any(sobrepoe(r, (c['x0'], c['top'], c['x1'], c['bottom']), folga=2) for c in chars)
        if sem_texto and (w < 14 or h < 14):
            continue  # enfeites da página (quadradinho preto, faixa lateral)
        boas.append(r)
    # rótulos: caracteres que caem dentro (ou encostados) da região entram na figura
    for _ in range(2):
        for r in boas:
            for c in chars:
                cb = (c['x0'], c['top'], c['x1'], c['bottom'])
                if sobrepoe(r, cb, folga=2.5):
                    r[0], r[1], r[2], r[3] = min(r[0], cb[0]), min(r[1], cb[1]), max(r[2], cb[2]), max(r[3], cb[3])
        # regiões que passaram a se tocar viram uma só
        k = 0
        while k < len(boas):
            j = k + 1
            while j < len(boas):
                if sobrepoe(boas[k], boas[j], folga=4):
                    a, b = boas[k], boas.pop(j)
                    boas[k] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                else:
                    j += 1
            k += 1
    return [tuple(r) for r in boas]


# ---------------------------------------------------------------- linhas e parágrafos
def montar_linhas(itens, tamanho):
    """Agrupa caracteres (e tokens) em linhas. Caracteres pequenos colados numa linha viram sobrescrito/subscrito;
    texto pequeno solto (fonte, legenda) forma linhas próprias."""
    corpo = sorted([c for c in itens if c.get('sintetico') or c['size'] >= tamanho * 0.86], key=lambda c: (c['top'], c['x0']))
    pequenos = sorted([c for c in itens if not c.get('sintetico') and c['size'] < tamanho * 0.86], key=lambda c: (c['top'], c['x0']))
    linhas = []
    for c in corpo:
        meio = (c['top'] + c['bottom']) / 2
        for ln in linhas:
            if not ln['pequena'] and abs(ln['meio'] - meio) < tamanho * 0.45:
                ln['itens'].append(c)
                ln['top'] = min(ln['top'], c['top']); ln['bottom'] = max(ln['bottom'], c['bottom'])
                ln['x0'] = min(ln['x0'], c['x0']); ln['x1'] = max(ln['x1'], c['x1'])
                break
        else:
            linhas.append({'meio': meio, 'top': c['top'], 'bottom': c['bottom'], 'x0': c['x0'], 'x1': c['x1'], 'itens': [c], 'pequena': False})
    soltos = []
    for c in pequenos:
        meio = (c['top'] + c['bottom']) / 2
        # índice: encostado num caractere do corpo (à esquerda, até ~0,35 em) e deslocado verticalmente
        viz = None
        for ln in linhas:
            if ln['pequena'] or abs(ln['meio'] - meio) > tamanho * 0.75:
                continue
            for d in ln['itens']:
                if -tamanho * 0.15 <= c['x0'] - d['x1'] <= tamanho * 0.45 or (d['x0'] <= c['x0'] <= d['x1']):
                    viz = ln
                    break
            if viz:
                break
        if viz is not None and abs(viz['meio'] - meio) > tamanho * 0.1:
            c = dict(c)
            c['pos'] = 'sup' if meio < viz['meio'] else 'sub'
            viz['itens'].append(c)
        else:
            soltos.append(c)
    for c in soltos:
        meio = (c['top'] + c['bottom']) / 2
        for ln in linhas:
            if ln['pequena'] and abs(ln['meio'] - meio) < c['size'] * 0.5:
                ln['itens'].append(c); ln['top'] = min(ln['top'], c['top']); ln['bottom'] = max(ln['bottom'], c['bottom'])
                ln['x0'] = min(ln['x0'], c['x0']); ln['x1'] = max(ln['x1'], c['x1'])
                break
        else:
            linhas.append({'meio': meio, 'top': c['top'], 'bottom': c['bottom'], 'x0': c['x0'], 'x1': c['x1'], 'itens': [c], 'pequena': True})
    linhas.sort(key=lambda ln: (ln['top'], ln['x0']))
    for ln in linhas:
        ln['itens'].sort(key=lambda c: c['x0'])
    return linhas


def texto_itens(itens, tamanho, espacos=()):
    out, ant, modo = '', None, None
    for c in itens:
        if ant is not None:
            gap = c['x0'] - ant['x1']
            tem_espaco = any(ant['x1'] - 1.5 <= e <= c['x0'] + 0.5 for e in espacos)
            if (gap > tamanho * 0.17 or tem_espaco) and not out.endswith(' '):
                if modo:
                    out += '}$$'; modo = None
                out += ' '
        pos = c.get('pos')
        if pos != modo:
            if modo:
                out += '}$$'
            if pos:
                out += '$$' + ('^{' if pos == 'sup' else '_{')
            modo = pos
        out += c['text'] if c.get('sintetico') else texto_char(c)
        ant = c
    if modo:
        out += '}$$'
    return re.sub(r'\s+', ' ', out).strip()


def tamanho_corpo(chars):
    tams = [round(c['size'], 1) for c in chars if c['text'].strip()]
    return statistics.mode(tams) if tams else 10.0


# ---------------------------------------------------------------- uma questão
def converter_questao(pdf, n, pedacos, imagem_pagina, prefixo, saida):
    figuras = []
    linhas_g, figs_g = [], []      # com posição global (topo somado entre pedaços) e x relativo ao pedaço
    desloc = 0.0
    for k, (ip, bbox) in enumerate(pedacos):
        page = pdf.pages[ip]
        x0, t, x1, b = bbox
        todos = [c for c in page.chars if dentro(c, bbox) and c['size'] >= 4]
        chars = [c for c in todos if c['text'].strip()]
        espacos = [c for c in todos if not c['text'].strip()]
        graficos = [o for o in list(page.images) + list(page.rects) + list(page.curves) + list(page.lines)
                    if o['x0'] >= x0 - 1 and o['x1'] <= x1 + 1 and o['top'] >= t - 1 and o['bottom'] <= b + 1]
        if k == 0:
            palavras = [w for w in page.extract_words() if dentro(w, bbox)]
            cab = [w for w in palavras if re.fullmatch(r'QUEST[ÃA]O\d*', w['text'], re.I)]
            fim_cab = (cab[0]['bottom'] + 2.5) if cab else t + 14
            chars = [c for c in chars if c['top'] > fim_cab - 1]
            espacos = [c for c in espacos if c['top'] > fim_cab - 1]
            graficos = [g for g in graficos if g['top'] > fim_cab - 1]
        if not chars and not graficos:
            continue
        tam = tamanho_corpo(chars) if chars else 10.0
        fontes_corpo = {c['fontname'] for c in chars if abs(c['size'] - tam) < 0.3 and c['text'] not in LETRAS}
        tokens_f, usados_c, usados_g = achar_fracoes(chars, graficos, tam)
        chars = [c for c in chars if id(c) not in usados_c]
        graficos = [g for g in graficos if id(g) not in usados_g]
        # letras das alternativas em fonte própria (ex.: círculos) não podem ser engolidas pelas figuras
        marcas = [c for c in chars if c['text'] in LETRAS and c['fontname'] not in fontes_corpo and c['size'] >= tam * 0.85]
        ids_marcas = {id(c) for c in marcas}
        regioes = agrupar_figuras(graficos, [c for c in chars if id(c) not in ids_marcas], bbox, tam)
        livres = [c for c in chars if id(c) in ids_marcas or not any(sobrepoe(r, (c['x0'], c['top'], c['x1'], c['bottom']), folga=0.5) for r in regioes)]
        tokens_f = [tk for tk in tokens_f if not any(sobrepoe(r, (tk['x0'], tk['top'], tk['x1'], tk['bottom'])) for r in regioes)]
        for ln in montar_linhas(livres + tokens_f, tam):
            ln['espacos'] = [e['x0'] for e in espacos if abs((e['top'] + e['bottom']) / 2 - ln['meio']) < tam * 0.5]
            ln['tam'] = tam
            ln['fontes_corpo'] = fontes_corpo
            ln['g'] = desloc - t + ln['top']
            ln['rx0'] = ln['x0'] - x0
            pos_b = [c for c in ln['itens'] if not c.get('sintetico') and c['text'] not in '•-–']
            ln['rx_texto'] = (pos_b[0]['x0'] - x0) if pos_b else ln['rx0']
            linhas_g.append(ln)
        for r in regioes:
            figs_g.append({'ip': ip, 'r': list(r), 'd': desloc - t, 'px0': x0, 'g': desloc - t + r[1], 'gb': desloc - t + r[3], 'rx0': r[0] - x0, 'rx1': r[2] - x0})
        desloc += (b - t) + 60

    # ---- marcadores das alternativas (caractere a caractere: funciona também em grade A D / B E / C)
    cands = []
    for li, ln in enumerate(linhas_g):
        its = ln['itens']
        for j, c in enumerate(its):
            if c.get('sintetico') or c.get('pos') or c['text'] not in LETRAS:
                continue
            tam = ln['tam']
            antes = its[j - 1] if j else None
            depois = its[j + 1] if j + 1 < len(its) else None
            dup = depois is not None and depois['text'] == c['text'] and depois['x0'] - c['x1'] < tam * 0.3 and depois['fontname'] == c['fontname']
            if dup:
                depois = its[j + 2] if j + 2 < len(its) else None
            livre_esq = antes is None or c['x0'] - antes['x1'] > tam * 0.6
            livre_dir = depois is None or depois['x0'] - c['x1'] > tam * 0.15
            fonte_dif = c['fontname'] not in ln['fontes_corpo']
            if livre_esq and livre_dir and (fonte_dif or antes is None):
                cands.append({'L': c['text'], 'li': li, 'j': j, 'dup': dup, 'g': ln['g'], 'x': c['x0'] - (ln['x0'] - ln['rx0']), 'fonte_dif': fonte_dif})
    cands.sort(key=lambda m: (m['g'], m['x']))
    marcadores = None
    for k in range(len(cands) - 1, -1, -1):
        if cands[k]['L'] != 'A':
            continue
        vistos = {}
        for m in cands[k:]:
            vistos.setdefault(m['L'], m)
        if len(vistos) == 5:
            marcadores = vistos
            break

    # figura que junta várias alternativas (em coluna) é cortada entre os marcadores
    if marcadores:
        novas = []
        for f in figs_g:
            dentro_f = sorted([m for m in marcadores.values() if f['g'] - 4 <= m['g'] <= f['gb'] and f['rx0'] - 45 <= m['x'] <= f['rx1']],
                              key=lambda m: m['g'])
            linhas_m = []
            for m in dentro_f:
                if not linhas_m or m['g'] - linhas_m[-1] > 8:
                    linhas_m.append(m['g'])
            if len(linhas_m) < 2:
                novas.append(f); continue
            cortes = [f['g']] + [(linhas_m[i] + linhas_m[i + 1]) / 2 + 10 for i in range(len(linhas_m) - 1)] + [f['gb']]
            for a_, b_ in zip(cortes, cortes[1:]):
                r = list(f['r']); r[1] = a_ - f['d']; r[3] = b_ - f['d']
                novas.append(dict(f, r=r, g=a_, gb=b_))
        figs_g = novas
    figs_g.sort(key=lambda f: (f['g'], f['rx0']))
    for f in figs_g:
        r = f['r']
        img = imagem_pagina(f['ip']).crop((int((r[0] - 1.5) * ESC), int((r[1] - 1.5) * ESC), int((r[2] + 1.5) * ESC), int((r[3] + 1.5) * ESC)))
        nome = f'{prefixo}-{n}-f{len(figuras) + 1}.webp'
        img.save(saida / nome, 'WEBP', quality=85, method=6)
        figuras.append(nome)
        f['n'] = len(figuras)

    alternativas = {L: '' for L in LETRAS}
    if marcadores:
        topo_alt = min(m['g'] for m in marcadores.values())
        por_linha = {}
        for m in marcadores.values():
            por_linha.setdefault(m['li'], []).append(m)
        enun_linhas = [ln for li, ln in enumerate(linhas_g) if ln['g'] < topo_alt - 1 and li not in por_linha]
        alt_linhas = [(li, ln) for li, ln in enumerate(linhas_g) if not (ln['g'] < topo_alt - 1 and li not in por_linha)]
        enun_figs = [f for f in figs_g if f['gb'] < topo_alt]
        alt_figs = [f for f in figs_g if f['gb'] >= topo_alt]
        ms = sorted(marcadores.values(), key=lambda m: (m['g'], m['x']))
        partes = {L: [] for L in LETRAS}

        def dono(g, x):
            # marcador acima (ou na mesma altura) e à esquerda mais próximo
            cand = [m for m in ms if m['g'] <= g + 2 and m['x'] <= x + 6]
            if not cand:
                return ms[0]['L']
            return max(cand, key=lambda m: (m['x'], m['g']))['L'] if len({round(m['x'] / 20) for m in cand}) > 1 else max(cand, key=lambda m: m['g'])['L']

        for li, ln in alt_linhas:
            its = ln['itens']
            mlin = sorted(por_linha.get(li, []), key=lambda m: m['j'])
            cortes = []
            for m in mlin:
                cortes.append((m['j'], m['L'], m['dup']))
            if not cortes:
                partes[dono(ln['g'], ln['rx0'])].append((ln['g'], texto_itens(its, ln['tam'], ln['espacos'])))
                continue
            if cortes[0][0] > 0:
                partes[dono(ln['g'], ln['rx0'])].append((ln['g'], texto_itens(its[:cortes[0][0]], ln['tam'], ln['espacos'])))
            for q, (j, L, dup) in enumerate(cortes):
                ini = j + (2 if dup else 1)
                fim = cortes[q + 1][0] if q + 1 < len(cortes) else len(its)
                partes[L].append((ln['g'], texto_itens(its[ini:fim], ln['tam'], ln['espacos'])))
        for f in alt_figs:
            meio = (f['g'] + f['gb']) / 2
            cand = [m for m in ms if m['x'] <= f['rx0'] + 12]
            if not cand:
                cand = ms
            m = min(cand, key=lambda m: (abs(m['g'] - meio) if m['g'] <= f['gb'] + 2 else 1e6) + abs(f['rx0'] - m['x']) * 0.2)
            partes[m['L']].append((f['g'], f'[[fig:{f["n"]}]]'))
        for L in LETRAS:
            alternativas[L] = limpar(' '.join(t for _, t in sorted(partes[L], key=lambda x: x[0]) if t))
    else:
        enun_linhas, enun_figs = linhas_g, figs_g

    # ---- enunciado em parágrafos
    elementos = [('l', ln['g'], ln) for ln in enun_linhas] + [('f', f['g'], f) for f in enun_figs]
    elementos.sort(key=lambda e: (e[1], e[2]['rx0']))
    # margem: a posição inicial de linha mais comum (ignora rótulos soltos)
    xs = [round(ln['rx0'] / 3) for ln in enun_linhas if not ln['pequena']]
    margem = statistics.mode(xs) * 3 - 1.5 if xs else 0
    # espaço entre linhas típico desta questão (algumas provas usam entrelinha maior)
    so_l = [e for t_, g_, e in elementos if t_ == 'l' and not e['pequena']]
    vaos = [b_['g'] - (a_['g'] + a_['bottom'] - a_['top']) for a_, b_ in zip(so_l, so_l[1:])]
    vaos = [v for v in vaos if -2 < v < 30]
    vao_tipico = statistics.median(vaos) if vaos else 2.0
    paragrafos, atual, ant = [], [], None
    em_lista, recuo_lista = False, 0
    for tipo, g, e in elementos:
        if tipo == 'f':
            if atual:
                paragrafos.append(' '.join(atual)); atual = []
            paragrafos.append(f'[[fig:{e["n"]}]]')
            ant = None
            continue
        texto = texto_itens(e['itens'], e['tam'], e['espacos'])
        if not texto:
            continue
        novo = ant is None and bool(atual)
        marcador_lista = bool(re.match(r'^[•\-–]\s|^[a-z]\)\s|^[IVX]+\s?[–-]\s', texto))
        if ant is not None:
            if e['g'] - (ant['g'] + ant['bottom'] - ant['top']) > max(vao_tipico + e['tam'] * 0.35, e['tam'] * 0.5):
                novo = True
            if e['pequena'] != ant['pequena']:
                novo = True
            if marcador_lista:
                novo = True
            elif em_lista:
                if abs(e['rx0'] - recuo_lista) > e['tam'] * 0.5:
                    novo = True   # saiu do alinhamento do item: acabou a lista
            elif e['rx0'] - margem > e['tam'] * 0.9 and not e['pequena']:
                novo = True       # recuo de primeira linha
        if marcador_lista:
            em_lista = True
            recuo_lista = e['rx_texto']
        elif novo:
            em_lista = False
        if novo and atual:
            paragrafos.append(' '.join(atual)); atual = []
        if atual and atual[-1].endswith('-') and texto[:1].islower():
            atual[-1] = atual[-1][:-1] + texto
        else:
            atual.append(texto)
        ant = e
    if atual:
        paragrafos.append(' '.join(atual))
    enunciado = '\n\n'.join(limpar(p) for p in paragrafos if limpar(p))
    return enunciado, alternativas, figuras


def limpar(t):
    t = re.sub(r'\(cid:\d+\)', ' ', t)  # glifos sem texto (fórmulas montadas): conferir à mão
    t = re.sub(r'\$\$\$\$', '', t)
    t = re.sub(r'\}\$\$\$\$\^\{', '', t)  # sobrescritos vizinhos
    t = re.sub(r'\s+', ' ', t).strip()
    t = t.replace('°°', '°')
    t = re.sub(r'\s+([,.;:!?)])', r'\1', t)
    t = re.sub(r'\(\s+', '(', t)
    return t


# ---------------------------------------------------------------- revisão
def mat_html(s):
    for _ in range(4):
        s = re.sub(r'\^\{([^{}]*)\}', r'<sup>\1</sup>', s)
        s = re.sub(r'_\{([^{}]*)\}', r'<sub>\1</sub>', s)
        s = re.sub(r'\\sqrt\{([^{}]*)\}', r'√<span style="border-top:1px solid">\1</span>', s)
        s = re.sub(r'\\frac\{([^{}]*)\}\{([^{}]*)\}', r'<span class="frac"><span>\1</span><span>\2</span></span>', s)
    s = re.sub(r'\\sqrt\{([^{}]*)\}', r'√<span style="border-top:1px solid">\1</span>', s)
    for k, v in {'\\cdot': '·', '\\times': '×', '\\pi': 'π', '\\leq': '≤', '\\geq': '≥'}.items():
        s = s.replace(k, v)
    return s


def rico_html(t, figuras, pasta=''):
    out = []
    for p in t.split('\n\n'):
        m = re.fullmatch(r'\[\[fig:(\d+)\]\]', p.strip())
        if m:
            i = int(m.group(1)) - 1
            if i < len(figuras):
                out.append(f'<img class="fig" src="{pasta}{figuras[i]}">')
            continue
        h = html.escape(p)
        h = re.sub(r'\$\$(.+?)\$\$', lambda m: mat_html(m.group(1)), h)
        h = re.sub(r'\[\[fig:(\d+)\]\]', lambda m: f'<img class="fig" src="{pasta}{figuras[int(m.group(1)) - 1]}">' if int(m.group(1)) - 1 < len(figuras) else '', h)
        out.append(f'<p>{h}</p>')
    return ''.join(out)


def revisao(questoes, destino):
    css = ('body{font-family:Arial,sans-serif;margin:0;background:#f3f4f7}'
           '.q{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:18px;background:#fff;margin:14px;padding:14px;border:1px solid #ddd}'
           '.q h2{grid-column:1/-1;margin:0;font-size:16px}.orig img{width:100%;max-width:560px;border:1px solid #eee}'
           '.txt{font-size:15px;line-height:1.55}.txt p{margin:0 0 10px}.fig{max-width:340px;display:block;margin:6px auto;border:1px dashed #aaa}'
           '.alt{display:flex;gap:10px;padding:6px 8px;border-top:1px solid #eee}.alt b{width:22px}.frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.9em}'
           '.frac span:first-child{border-bottom:1px solid}')
    corpo = []
    for q in questoes:
        alts = ''.join(f'<div class="alt"><b>{L}</b><span>{rico_html(q["alternativas"][L], q["figuras"])}</span></div>' for L in LETRAS)
        corpo.append(f'<section class="q" id="q{q["numero_prova"]}"><h2>{q["numero_prova"]} · gabarito {q.get("resposta")}</h2>'
                     f'<div class="orig"><img src="{q["imagem"]}"></div><div class="txt">{rico_html(q["enunciado"], q["figuras"])}{alts}</div></section>')
    destino.write_text(f'<!doctype html><meta charset="utf-8"><style>{css}</style>' + ''.join(corpo), encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pdf')
    ap.add_argument('--ano', type=int, required=True)
    ap.add_argument('--aplicacao', default='REG')
    ap.add_argument('--pacote', required=True)
    ap.add_argument('--ajustes')
    ap.add_argument('--so', help='só estas questões (ex.: 136,147)')
    a = ap.parse_args()
    pasta = Path(a.pacote)
    dados = json.loads((pasta / 'questoes.json').read_text(encoding='utf-8'))
    prefixo = f'ENEM-{a.ano}-{a.aplicacao.upper()}'
    ajustes = {}
    if a.ajustes:
        spec = importlib.util.spec_from_file_location('ajustes', a.ajustes)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        ajustes = getattr(mod, 'AJUSTES', {})

    pdf = pdfplumber.open(a.pdf)
    pedacos, avisos = pedacos_das_questoes(pdf)
    tmp = Path(tempfile.mkdtemp())
    cache = {}

    def imagem_pagina(ip):
        if ip not in cache:
            base = tmp / f'p{ip}'
            subprocess.run(['pdftoppm', '-r', str(RES), '-f', str(ip + 1), '-l', str(ip + 1), '-png', '-singlefile', a.pdf, str(base)], check=True)
            cache[ip] = Image.open(f'{base}.png').convert('RGB')
        return cache[ip]

    so = {int(x) for x in a.so.split(',')} if a.so else None
    for q in dados['questoes']:
        n = q['numero_prova']
        if so and n not in so:
            continue
        if n not in pedacos:
            print('sem recorte:', n)
            continue
        ped = pedacos[n]
        aj = ajustes.get(n, {})
        if aj.get('pedacos'):
            ped = [ped[i] for i in aj['pedacos']]
        for f in pasta.glob(f'{prefixo}-{n}-f*.webp'):
            f.unlink()
        enunciado, alternativas, figuras = converter_questao(pdf, n, ped, imagem_pagina, prefixo, pasta)
        bruto = ''.join(c['text'] for ip, bb in ped for c in pdf.pages[ip].chars if dentro(c, bb))
        if '(cid:' in bruto and not aj:
            print(f'CONFERIR {n}: há fórmula com glifos sem texto')
        if 'enunciado' in aj:
            enunciado = aj['enunciado'].strip()
        if 'alternativas' in aj:
            alternativas = {**alternativas, **aj['alternativas']}
        for velho, novo in aj.get('trocar', []):
            if velho not in enunciado:
                print(f'AJUSTE {n}: não achei "{velho[:40]}"')
            enunciado = enunciado.replace(velho, novo)
        enunciado = re.sub(r'\n{3,}', '\n\n', enunciado).strip()
        # figuras que não ficaram citadas (depois dos ajustes) saem do pacote; renumera as demais
        tudo = enunciado + ' '.join(alternativas.values())
        usadas = [i for i in range(1, len(figuras) + 1) if f'[[fig:{i}]]' in tudo]
        novo_n = {old: new for new, old in enumerate(usadas, 1)}
        troca = lambda t: re.sub(r'\[\[fig:(\d+)\]\]', lambda m: f'[[fig:{novo_n.get(int(m.group(1)), 0)}]]', t)
        enunciado = troca(enunciado)
        alternativas = {L: troca(v) for L, v in alternativas.items()}
        mantidas = []
        for i, nome in enumerate(figuras, 1):
            if i in novo_n:
                destino = f'{prefixo}-{n}-f{novo_n[i]}.webp'
                if nome != destino:
                    (pasta / nome).rename(pasta / ('tmp-' + destino))
                    mantidas.append('tmp-' + destino)
                else:
                    mantidas.append(nome)
            else:
                (pasta / nome).unlink(missing_ok=True)
        figuras = []
        for nome in mantidas:
            if nome.startswith('tmp-'):
                (pasta / nome).rename(pasta / nome[4:])
                nome = nome[4:]
            figuras.append(nome)
        q['enunciado'] = enunciado
        q['alternativas'] = alternativas
        q['figuras'] = figuras
        q['formato'] = 'texto'
    (pasta / 'questoes.json').write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding='utf-8')
    revisao([q for q in dados['questoes'] if not so or q['numero_prova'] in so], pasta / 'revisao.html')
    print('ok', len(dados['questoes']))


if __name__ == '__main__':
    main()
