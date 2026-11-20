# JWLV4LGTVwebOS — JW Vídeos para TV LG

App para TVs LG com webOS que lista e reproduz os vídeos do JW.org, em português, com a seção
"De Nosso Estúdio" em destaque e navegação pelo controle remoto.

> Em construção. O passo a passo completo de instalação na TV será escrito ao final do projeto.

## Estado atual (etapa 3 de 5)

- Catálogo de vídeos lido da API pública do JW.org (todas as categorias, Novidades dos últimos 30 dias)
- Tela inicial: destaque, Novidades, "De Nosso Estúdio", uma fileira por categoria
- Categorias, página de categoria e detalhes do vídeo
- Navegação por controle remoto (setas, OK, Voltar), ponteiro do Magic Remote e rodinha
- Cache do catálogo na TV: abre na hora e atualiza em segundo plano
- Player: pausa, avançar/voltar 10 s, botões de mídia do controle, qualidade (padrão 720p), legendas em vários idiomas com tamanho ajustável, troca do idioma do vídeo
- Minha lista: Favoritos e Continuar assistindo (segure OK sobre um vídeo para remover)
- Ao abrir, oferece continuar o último vídeo interrompido
- Busca por título e descrição, sem diferenciar acentos, com teclado na tela
- Modo TV: programação contínua alternando categorias (1 a cada 4 de Músicas, 1 longo a cada 15 curtos, novidades primeiro); ↑↓ troca de canal, → pula
- Timer para desligar: 30 min, 1 h, 2 h ou ao fim do vídeo
- Aviso de vídeos novos desde a última visita
- Proteção de tela após 5 min parado: relógio e previsão do tempo do Rio de Janeiro (Open-Meteo)
- Ajustes: qualidade, legendas, tamanho da legenda, idioma, fundo de tela (imagem, trocar, remover)

## Desenvolvimento

Requer Node.js 20 ou mais novo.

```bash
npm install
npm run dev      # abre no navegador do computador (tela reduzida para caber)
npm test         # testes
npm run build    # gera a pasta dist/ pronta para empacotar para a TV
```

Teclas no computador: setas, Enter = OK, Esc = Voltar.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/api` | Leitura da API do JW.org e cache do catálogo |
| `src/nav` | Navegação espacial por controle remoto |
| `src/ui` | Telas e componentes (Preact) |
| `src/lib` | Utilitários: textos, datas, armazenamento |
| `webos` | `appinfo.json`, ícones e tela de abertura do app webOS |
| `tests` | Testes (Vitest) |

## Instalação na TV (versão preliminar)

O guia completo, passo a passo, será escrito na etapa 5. Por enquanto:

1. Na TV, ative o **Developer Mode** (app "Developer Mode" da LG Content Store, entrando com sua conta de desenvolvedor LG) e ligue **Key Server**. Anote o IP da TV e a *passphrase* mostrados no app.
2. No Mac, com o Node.js instalado, dentro da pasta do projeto:

```bash
npm install
TV_IP=192.168.0.25 npm run tv:add
npm run tv:key
npm run tv
```

`tv:key` pede a *passphrase* da TV. `tv` gera o pacote, instala e abre o app.
