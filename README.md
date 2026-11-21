# JWLV4LGTVwebOS — JW Vídeos para TV LG

App para TVs LG com webOS que lista e reproduz os vídeos do JW.org, em português, com
"De Nosso Estúdio" em destaque e navegação pelo controle remoto. Feito e testado para a
LG 43UN7300PSC (webOS 5).

## O que o app faz

- **Tela inicial:** vídeo mais novo em destaque, Novidades (últimos 30 dias), "De Nosso Estúdio", Continuar assistindo, Favoritos e uma fileira por categoria
- **Categorias:** todas as categorias de vídeo do JW.org
- **Player:** pausa, avançar/voltar 10 s, botões de mídia do controle, qualidade (padrão 720p), legendas em português, inglês, espanhol e francês (tamanho pequeno, médio ou grande), troca do idioma do vídeo
- **Busca:** por título e descrição, sem diferenciar acentos
- **Modo TV:** programação contínua alternando categorias: 1 a cada 4 vídeos é de Músicas, 1 vídeo longo a cada 15 curtos, novidades primeiro, sem repetir no mesmo dia
- **Minha lista:** Favoritos e Continuar assistindo
- **Timer para desligar:** 30 min, 1 h, 2 h ou ao fim do vídeo
- **Ao abrir:** oferece continuar o último vídeo e avisa quantos vídeos novos saíram
- **Proteção de tela:** após 5 min parado nos menus, mostra relógio e previsão do tempo do Rio de Janeiro
- **Ajustes:** qualidade, legendas, idioma, fundo de tela (imagem padrão, trocar ou remover), cópia de segurança
- **Atualização automática:** novas versões chegam sozinhas pela internet, sem reinstalar
- **Cópia de segurança:** favoritos, progresso e ajustes guardados na nuvem (Firebase), restauráveis com um código de 6 caracteres
- **Renovação automática do Developer Mode:** o GitHub renova a sessão da TV a cada 12 horas

## Controle remoto

| Botão | Nos menus | Assistindo | No Modo TV |
|---|---|---|---|
| Setas | Navegar | Com a barra escondida: ← → voltam/avançam 10 s | ↑↓ trocam de canal, → próximo vídeo |
| OK | Abrir | Mostra a barra de controles | Mostra a barra de controles |
| OK segurado | Opções do vídeo (favoritar, remover) | | |
| Voltar | Tela anterior; na tela inicial, pergunta se quer sair | Esconde a barra; de novo, sai do vídeo | Esconde a barra; de novo, sai do Modo TV |
| ▶ ❚❚ ⏩ ⏪ ⏹ | | Tocar/pausar, avançar/voltar 30 s, parar | Igual |

O ponteiro do Magic Remote seleciona ao passar por cima, e a rodinha rola a tela.

---

# Instalação passo a passo

Você vai precisar de:

- a TV LG ligada e conectada à internet, na mesma rede Wi-Fi do Mac;
- um Mac (ou outro computador) com acesso à internet;
- uma conta Google (para a cópia de segurança);
- acesso a este repositório no GitHub.

São 6 partes. Faça na ordem: 1 e 2 preparam TV e Mac, 3 publica o app no GitHub Pages
(a TV abre o app de lá), 4 instala na TV, 5 e 6 ligam a cópia de segurança e a renovação
automática do Developer Mode.

## Parte 1 — Ativar o Developer Mode na TV

1. No computador, crie uma conta gratuita em **developer.lge.com** (canto superior direito: *Sign in* → *Create account*).
2. Na TV, abra a **LG Content Store**, procure **Developer Mode** e instale.
3. Abra o app **Developer Mode**, entre com a conta criada e ligue **Dev Mode Status**. A TV reinicia.
4. Abra o app de novo e ligue **Key Server**.
5. Anote o **IP Address** e a **Passphrase** que aparecem na tela.

> A sessão dura 1000 horas (cerca de 41 dias). A Parte 6 faz a renovação automática.
> Sem ela, basta apertar **EXTEND** no app Developer Mode uma vez por mês.

## Parte 2 — Preparar o Mac (uma vez só)

1. Baixe o instalador **LTS** do Node.js em **nodejs.org**, abra o arquivo `.pkg` e avance até o fim.
2. Abra o **Terminal** (⌘ + espaço, digite "Terminal", Enter) e confira a instalação:

```bash
node -v
```

Deve aparecer algo como `v22.x.x` ou mais novo.

3. Baixe o projeto. Se o Mac pedir para instalar as "ferramentas de linha de comando", aceite e rode o comando de novo:

```bash
git clone https://github.com/andrellsantana/JWLib4LGTV.git ~/JWLib4LGTV
```

4. Prepare o projeto:

```bash
cd ~/JWLib4LGTV && npm install
```

5. Cadastre a TV no Mac, trocando o IP pelo que aparece na sua TV:

```bash
TV_IP=192.168.1.121 npm run tv:add
```

6. Conecte o Mac à TV. O comando pede a *passphrase*: digite os 6 caracteres da TV.

```bash
npm run tv:key
```

## Parte 3 — Publicar o app (GitHub Pages)

1. Junte as mudanças no ramo principal: no GitHub, abra o *pull request* do ramo de desenvolvimento e clique em **Merge**.
2. No GitHub, abra o repositório → **Settings** → **Pages**.
3. Em **Build and deployment** → **Source**, escolha **GitHub Actions**.
4. Vá em **Actions** → **Publicar app (GitHub Pages)** → **Run workflow**.
5. Quando ficar verde (cerca de 1 minuto), abra **https://andrellsantana.github.io/JWLib4LGTV/version.json** no navegador. Deve aparecer a versão.

A partir daí, toda mudança no ramo principal é publicada sozinha, e a TV já abre a versão
nova. Em **Ajustes**, no fim da tela, a versão aparece com "(online)". Sem internet, a TV
usa a cópia que veio no pacote.

## Parte 4 — Instalar o app na TV

Com a TV ligada e o app Developer Mode aberto:

```bash
cd ~/JWLib4LGTV && npm run tv
```

O comando gera o pacote, instala e abre o app. Ele passa a aparecer na barra de apps da
TV (botão Home), com o ícone azul **JW Vídeos**, e pode ser arrastado para perto de Netflix e YouTube.

Neste ponto o app já funciona por completo, exceto a cópia de segurança, que depende da Parte 5.

## Parte 5 — Ligar a cópia de segurança (Firebase)

1. Abra **console.firebase.google.com** e entre com sua conta Google.
2. **Criar um projeto** → nome `jw-videos-tv` → pode desligar o Google Analytics → **Criar projeto**.
3. No menu à esquerda: **Criação** → **Authentication** → **Vamos começar** → aba **Método de login** → **Anônimo** → **Ativar** → **Salvar**.
4. No menu: **Criação** → **Firestore Database** → **Criar banco de dados** → local **southamerica-east1 (São Paulo)** → **modo de produção** → **Criar**.
5. Na aba **Regras** do Firestore, apague o conteúdo, cole o conteúdo do arquivo [`firestore.rules`](firestore.rules) deste repositório e clique em **Publicar**.
6. Clique na engrenagem ⚙️ → **Configurações do projeto** → em **Seus apps**, clique no ícone **`</>`** (Web) → apelido `JW Vídeos TV` → **Registrar app**.
7. Na tela seguinte aparece um bloco `firebaseConfig`. Anote dois valores: `apiKey` e `projectId`.
8. No GitHub: repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Crie dois segredos:
   - nome `FIREBASE_API_KEY`, valor = o `apiKey`;
   - nome `FIREBASE_PROJECT_ID`, valor = o `projectId`.
9. Vá em **Actions** → **Publicar app (GitHub Pages)** → **Run workflow**.
10. Feche e abra o app na TV. Em **Ajustes** → **Cópia de segurança** aparece o seu código. **Anote-o.**

> A `apiKey` do Firebase não é uma senha: ela só identifica o projeto. Quem protege os
> dados são as regras do Firestore. Cada cópia só pode ser lida por quem tem o código, e
> ninguém pode listar ou apagar cópias.

**Para restaurar** depois de reinstalar o app: **Ajustes** → **Cópia de segurança** → **Restaurar com código**, digite o código e confirme.

## Parte 6 — Ligar a renovação automática do Developer Mode

1. No Mac, com a TV ligada:

```bash
cd ~/JWLib4LGTV && npm run tv:token
```

2. Aparece um código de 64 letras e números. Copie-o inteiro.
3. No GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → nome `LG_DEV_SESSION_TOKEN`, valor = o código copiado.
4. Vá em **Actions** → **Renovar Developer Mode da TV** → **Run workflow**. Ele deve ficar verde, e no app Developer Mode da TV o tempo restante volta para perto de 1000 horas.

A partir daí, o GitHub renova a sessão a cada 12 horas. Uma vez por mês, ele também
reativa o próprio agendamento, para não ser desligado por falta de atividade. Se a
renovação falhar, o GitHub envia um e-mail. Nesse caso, gere o código de novo (passos 1 a 3).

---

## Depois de instalado: guarde estas informações

| O quê | Para que serve | Onde encontrar |
|---|---|---|
| **Código da cópia de segurança** (6 caracteres) | Recuperar favoritos, progresso e ajustes se o app for reinstalado | Na TV: **Ajustes** → **Cópia de segurança** → "Seu código" |
| **IP da TV** | Reinstalar ou atualizar o app pelo Mac | Na TV: app **Developer Mode** |

### Se precisar reinstalar o app

1. Instale de novo pelo Mac (Parte 4): `cd ~/JWLib4LGTV && npm run tv`.
2. Na TV, abra o app → **Ajustes** → **Cópia de segurança** → **Restaurar com código**.
3. Digite o seu código de 6 caracteres e escolha **Restaurar**.
4. Favoritos, Continuar assistindo e ajustes voltam como estavam na última cópia.

A cópia é feita sozinha cerca de 10 segundos depois de cada mudança. Para forçar uma cópia, use **Copiar agora**.

### Se o IP da TV mudar

```bash
cd ~/JWLib4LGTV && TV_IP=novo-ip npm run tv:add
```

### Se o GitHub avisar por e-mail que a renovação falhou

A TV provavelmente gerou um código de sessão novo. Repita a Parte 6.

---

## Problemas comuns

| Problema | O que fazer |
|---|---|
| `npm run tv` diz que não encontra a TV | Confira se a TV está ligada, na mesma rede, com o app Developer Mode aberto e o Key Server ligado. Se o IP mudou, rode `npm run tv:add` com o novo IP. |
| Erro de chave ou de autenticação | Rode `npm run tv:key` de novo e digite a *passphrase* atual da TV. |
| O app sumiu da TV | A sessão do Developer Mode venceu. Reative-a no app Developer Mode, rode `npm run tv` e restaure seus dados com o código (Parte 5). |
| A legenda não aparece | O vídeo pode não ter legenda nesse idioma. Tente outro idioma no botão Legendas. |
| Mensagem "Não foi possível carregar os vídeos" | Verifique a internet da TV e use "Tentar novamente". |
| A versão em Ajustes não mostra "(online)" | Confira a Parte 3 e a internet da TV. |
| A proteção de tela não mostra o tempo | Sem acesso ao serviço de previsão, ela mostra só o relógio. Tente mais tarde. |

---

## Para desenvolvedores

Requer Node.js 20 ou mais novo.

```bash
npm install
npm run dev      # abre no navegador do computador (setas, Enter = OK, Esc = Voltar)
npm test         # testes (Vitest)
npm run build    # dist/app (app), dist/tv (pacote da TV), dist/pages (GitHub Pages)
npm run tv       # gera o .ipk, instala e abre na TV cadastrada como "tv"
```

Para testar a cópia de segurança localmente, crie `.env.local` com `VITE_FIREBASE_API_KEY` e `VITE_FIREBASE_PROJECT_ID`.

### Como funciona

| Peça | Função |
|---|---|
| `src/api` | Leitura da API pública do JW.org (catálogo, vídeos por idioma) e cache em IndexedDB |
| `src/nav` | Navegação espacial por controle remoto |
| `src/ui` | Telas (Preact): início, categorias, detalhes, player, busca, Modo TV, Minha lista, Ajustes, proteção de tela |
| `src/lib` | Preferências, legendas VTT, regras do Modo TV, timer, previsão do tempo, cópia de segurança |
| `loader/index.html` | Carregador do pacote da TV: abre a versão do GitHub Pages ou, sem internet, a cópia embutida |
| `scripts/package.mjs` | Monta o pacote da TV e o site do GitHub Pages |
| `webos/` | `appinfo.json`, ícones e tela de abertura |
| `.github/workflows` | Publicação no GitHub Pages e renovação do Developer Mode |
| `firestore.rules` | Regras de acesso da cópia de segurança |

O app é compilado como um único script clássico, compatível com o Chromium 68 do webOS 5.
O carregador abre a versão hospedada em https (a API do JW.org não aceita pedidos de
páginas locais). O `appinfo.json` declara `requiredACG: []`, como a LG exige a partir de 2027:
o app não usa APIs internas da TV.

Os vídeos, imagens e textos pertencem ao JW.org; este app apenas os exibe a partir da API pública do site, para uso pessoal.
