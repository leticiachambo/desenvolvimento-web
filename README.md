# Catálogo Interativo — GTA VI

| | |
|---|---|
| **Aluna** | Letícia Souza dos Santos Chambó |
| **Disciplina** | Desenvolvimento Web |
| **Tema** | GTA VI (Grand Theft Auto VI) |
| **Tecnologias** | HTML5, CSS3, JavaScript (Fetch API), Bootstrap 5 |

Catálogo interativo sobre o universo de **GTA VI**, com **26 itens** em 4 categorias
(Personagens, Locais, Veículos e Vestuário). Os dados são obtidos por **requisições AJAX**
a arquivos JSON, e é possível buscar, filtrar e ver os detalhes de cada item **sem recarregar a página**.

---

## Funcionalidades

- **Listagem dinâmica via AJAX:** os cards são construídos pelo JavaScript a partir de `data/itens.json`
  (cada item tem `id`, `titulo`, `categoria`, `resumo`, `imagem` e `alt`).
- **Consulta de detalhes via nova requisição AJAX:** ao clicar em **Ver detalhes**, é feito um novo
  `fetch` para `data/detalhes/{id}.json`. A descrição completa, a ficha e as curiosidades aparecem num **modal** do Bootstrap.
- **Busca por texto** (título, resumo e categoria, sem diferenciar acentos nem maiúsculas) e **filtro por categoria**,
  atualizando os resultados enquanto você digita.
- **Estados da interface:**
  - *Carregando:* spinner na listagem e no modal
  - *Vazio:* mensagem quando nenhum item corresponde à busca ou ao filtro
  - *Erro:* aviso compreensível com botão **Tentar novamente**, que refaz a requisição
- **Layout responsivo:** grid do Bootstrap com 1 coluna (celular), 2 (tablet), 3 (notebook) e 4 (telas grandes).
  O menu recolhe em telas pequenas.
- **Componentes Bootstrap:** navbar com collapse, cards, botões, formulário (input group e select),
  badges, spinner, alerts, **modal** (detalhes) e **accordion** (perguntas frequentes).
- **HTML semântico:** `header`, `nav`, `main`, `section`, `article`, `figure`, `footer`, títulos em
  hierarquia (`h1` → `h2` → `h3` → `h4`), `label` associado a cada campo e `alt` em todas as imagens.

---

## Estrutura de pastas

```
desenvolvimento-web/
├── index.html              # Estrutura da página (apresentação, catálogo, sobre)
├── css/
│   └── style.css           # Estilos próprios (tema neon, cards, hero)
├── js/
│   └── app.js              # Lógica: fetch, busca/filtro, modal, estados
├── data/
│   ├── itens.json          # Fonte da LISTAGEM (26 itens)
│   └── detalhes/
│       ├── 1.json          # Fonte dos DETALHES (um arquivo por item)
│       ├── ...
│       └── 26.json
├── img/
│   ├── personagens/        # Imagens por categoria (1280×720, otimizadas)
│   ├── locais/
│   ├── veiculos/
│   └── vestuario/
└── README.md
```

---

## Como executar

> ⚠️ **Não abra o `index.html` com duplo clique (`file://`).** Por segurança, o navegador bloqueia
> requisições `fetch` a arquivos locais. O site precisa ser servido por **HTTP**.

1. Clone o repositório:
   ```bash
   git clone https://github.com/leticiachambo/desenvolvimento-web.git
   cd desenvolvimento-web
   ```
2. Inicie um servidor HTTP local com **uma** das opções abaixo:

   **Opção A: Python** (já vem instalado no Linux/macOS; no Windows, instale pelo python.org)
   ```bash
   python -m http.server 8000
   ```
   Depois acesse: <http://localhost:8000>

   **Opção B: Node.js**
   ```bash
   npx serve .
   ```
   Depois acesse o endereço exibido no terminal (normalmente <http://localhost:3000>).

   **Opção C: VS Code**
   Instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha
   **"Open with Live Server"**.

É preciso ter conexão com a internet para carregar o Bootstrap pela CDN.

---

## Roteiro de testes

Com o site aberto em `http://localhost:8000`:

### 1. Listagem (AJAX)
1. Abra a página e vá até a seção **Catálogo**.
2. Veja o indicador de carregamento e, em seguida, os **26 cards**.
3. *(Opcional)* Abra o DevTools (F12) → aba **Network**, recarregue e veja a requisição para `itens.json`.

### 2. Detalhes (nova requisição AJAX)
1. Clique em **Ver detalhes** em qualquer card.
2. O modal abre com o spinner e depois mostra a imagem, a descrição, a ficha e as curiosidades.
3. Na aba **Network**, confira que foi feita uma **nova requisição** para `detalhes/{id}.json`.

### 3. Busca e filtro
1. Digite `cheetah` no campo de busca: aparece apenas o **Grotti Cheetah**.
   Digitando `lucia`, aparecem 3 itens: a personagem e duas roupas cujo resumo cita a Lucia.
2. Digite `veiculos` (sem acento): aparecem os veículos, porque a busca ignora acentos.
3. Limpe a busca e escolha **Locais** no filtro de categoria: aparecem 6 itens.
4. Clique em **Limpar** para voltar a mostrar todos.

### 4. Estado vazio
1. Digite `xyz` no campo de busca.
2. Aparece a mensagem **"Nenhum item encontrado para 'xyz'"**.

### 5. Estado de carregamento
- Acesse <http://localhost:8000/?lento=1>. Cada requisição espera 1,5 s, deixando o spinner visível
  na listagem e no modal.
- Outra opção: DevTools → Network → throttling **Slow 3G**.

### 6. Estado de erro e nova tentativa
- **Erro na listagem:** acesse <http://localhost:8000/?erro=lista>. Aparece o aviso
  *"Não foi possível carregar o catálogo"*. Clique em **Tentar novamente** e a lista carrega.
- **Erro nos detalhes:** acesse <http://localhost:8000/?erro=detalhes> e abra um item. Aparece o aviso
  no modal. Clique em **Tentar novamente** e os detalhes carregam.
- Como funciona: a primeira requisição é feita para um arquivo inexistente e recebe um **erro HTTP 404 real**.
  A nova tentativa usa o endereço correto.
- Outra opção: DevTools → Network → marque **Offline**, recarregue a página ou abra um item, e depois
  desmarque **Offline** e clique em **Tentar novamente**.

### 7. Responsividade
- DevTools → **Toggle device toolbar** (Ctrl+Shift+M). Teste um celular (ex.: 375 px) e um desktop.
  O número de colunas muda, o menu vira botão "hambúrguer" e não há rolagem horizontal.

---

## Como o código funciona (resumo)

| Função (`js/app.js`) | O que faz |
|---|---|
| `buscarJSON(url, tipo)` | Faz o `fetch`, verifica `resposta.ok` e devolve o JSON. Se der erro, lança uma exceção. |
| `carregarItens()` | Mostra o spinner, busca `itens.json` e chama `preencherCategorias()` e `aplicarFiltros()`. Em caso de erro, mostra o alerta com **Tentar novamente**. |
| `preencherCategorias()` | Cria as opções do `<select>` a partir das categorias que vieram nos dados. |
| `aplicarFiltros()` | Filtra `todosItens` pelo texto e pela categoria, e mostra os cards ou a mensagem de vazio. |
| `renderizarCards(itens)` | Gera o HTML dos cards (`<article>`) dentro do grid do Bootstrap. |
| `carregarDetalhes(id)` | Nova requisição para `detalhes/{id}.json`, com carregando, erro e nova tentativa. |
| `renderizarDetalhes(detalhe)` | Monta o conteúdo do modal (figura, descrição, ficha e curiosidades). |
| `escapar(texto)` | Protege o HTML contra caracteres especiais vindos dos dados. |
| `normalizar(texto)` | Remove acentos e deixa minúsculo, para a busca funcionar com "veiculos" ou "Veículos". |

O modal é aberto pelo próprio Bootstrap (`data-bs-toggle="modal"`). O evento `show.bs.modal` informa qual botão
foi clicado (`evento.relatedTarget`), e o `data-id` desse botão indica qual item buscar.

---

## Fontes e créditos

| Recurso | Fonte | Uso |
|---|---|---|
| **Informações** sobre personagens, locais e itens | Site oficial de GTA VI (<https://www.rockstargames.com/VI>) e trailers oficiais da Rockstar Games | Textos resumidos e escritos em português pela autora para este projeto |
| **Imagens** (pasta `img/`) | Material oficial de divulgação de GTA VI, **© Rockstar Games / Take-Two Interactive** | Redimensionadas para 1280×720 e usadas apenas para fins educacionais, sem fins lucrativos |
| **Bootstrap 5.3.3** | <https://getbootstrap.com>, via CDN jsDelivr | Layout, grid e componentes (licença MIT) |
| **Bootstrap Icons 1.11.3** | <https://icons.getbootstrap.com>, via CDN jsDelivr | Ícones (licença MIT) |
| **Fetch API** | Recurso nativo dos navegadores (<https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API>) | Requisições AJAX |

> GTA, Grand Theft Auto e todas as marcas e imagens relacionadas pertencem à Rockstar Games e à
> Take-Two Interactive. Este é um projeto acadêmico, sem vínculo com essas empresas.
