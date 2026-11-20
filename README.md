# JWLV4LGTVwebOS — JW Vídeos para TV LG

App para TVs LG com webOS que lista e reproduz os vídeos do JW.org, em português, com a seção
"De Nosso Estúdio" em destaque e navegação pelo controle remoto.

> Em construção. O passo a passo completo de instalação na TV será escrito ao final do projeto.

## Estado atual (etapa 1 de 5)

- Catálogo de vídeos lido da API pública do JW.org (todas as categorias, Novidades dos últimos 30 dias)
- Tela inicial: destaque, Novidades, "De Nosso Estúdio", uma fileira por categoria
- Categorias, página de categoria e detalhes do vídeo
- Navegação por controle remoto (setas, OK, Voltar), ponteiro do Magic Remote e rodinha
- Cache do catálogo na TV: abre na hora e atualiza em segundo plano

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
