/* =========================================================
   GTA VI Explorer — lógica da aplicação
   Autora: Letícia Souza dos Santos Chambó

   Fluxo geral:
   1. Ao abrir a página, carregarItens() faz uma requisição AJAX
      (fetch) para data/itens.json e monta os cards.
   2. A busca e o filtro de categoria atualizam a lista na hora,
      usando os dados que já foram carregados.
   3. Ao clicar em "Ver detalhes", carregarDetalhes(id) faz uma
      NOVA requisição para data/detalhes/{id}.json e mostra o
      resultado dentro de um modal do Bootstrap.
   4. Em cada requisição há estados de carregando, vazio e erro
      (com botão "Tentar novamente").
   ========================================================= */

// ---------- Endereços dos dados (duas fontes separadas) ----------
const URL_ITENS = 'data/itens.json';
const URL_DETALHES = 'data/detalhes/'; // + id + '.json'

// ---------- Elementos da página ----------
const listaItens = document.getElementById('lista-itens');
const estadoLista = document.getElementById('estado-lista');
const contador = document.getElementById('contador');
const formFiltros = document.getElementById('form-filtros');
const campoBusca = document.getElementById('campo-busca');
const filtroCategoria = document.getElementById('filtro-categoria');
const modalElemento = document.getElementById('modalDetalhes');
const modalTitulo = document.getElementById('modalTitulo');
const modalCorpo = document.getElementById('modalCorpo');

// ---------- Estado da aplicação ----------
let todosItens = [];         // itens recebidos da listagem
let idDetalheAtual = null;   // item aberto no modal (evita mostrar resposta atrasada de outro item)

// ---------- Simulação para testes (parâmetros na URL) ----------
// ?lento=1            -> espera 1,5 s antes de cada requisição (para ver o "carregando")
// ?erro=lista         -> a 1ª requisição da listagem falha
// ?erro=detalhes      -> a 1ª requisição de detalhes falha
// ?erro=todos         -> as duas falham na 1ª tentativa
// A falha acontece só na primeira tentativa, então "Tentar novamente" funciona.
const parametros = new URLSearchParams(window.location.search);
const modoLento = parametros.has('lento');
const erroSimulado = parametros.get('erro');
const falhasPendentes = {
  lista: erroSimulado === 'lista' || erroSimulado === 'todos' || erroSimulado === '1',
  detalhes: erroSimulado === 'detalhes' || erroSimulado === 'todos' || erroSimulado === '1'
};

/* =========================================================
   Funções utilitárias
   ========================================================= */

// Pausa a execução por alguns milissegundos (usada no modo lento)
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Faz uma requisição AJAX com fetch e devolve o JSON.
// Se o servidor responder com erro (ex.: 404), lança uma exceção.
async function buscarJSON(url, tipo) {
  if (modoLento) await esperar(1500);

  // Simulação de erro: troca o endereço por um arquivo que não existe
  if (falhasPendentes[tipo]) {
    falhasPendentes[tipo] = false;
    url = url.replace('.json', '-inexistente.json');
  }

  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} ao acessar ${url}`);
  }
  return resposta.json();
}

// Escapa caracteres especiais para inserir texto com segurança no HTML
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Remove acentos e deixa minúsculo para comparar textos na busca
// Ex.: "Veículos" -> "veiculos"
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Gera a classe CSS da etiqueta de categoria. Ex.: "Veículos" -> "badge-veiculos"
function classeCategoria(categoria) {
  return 'badge-' + normalizar(categoria);
}

/* =========================================================
   Estados da interface (carregando / vazio / erro)
   ========================================================= */

function htmlCarregando(mensagem) {
  return `
    <div class="estado d-flex flex-column align-items-center justify-content-center text-center" role="status">
      <div class="spinner-border text-danger mb-3" aria-hidden="true"></div>
      <p class="mb-0">${escapar(mensagem)}</p>
    </div>`;
}

function htmlVazio(mensagem) {
  return `
    <div class="alert alert-secondary text-center py-5" role="status">
      <i class="bi bi-emoji-frown fs-1 d-block mb-2" aria-hidden="true"></i>
      <p class="mb-0">${mensagem}</p>
    </div>`;
}

function htmlErro(mensagem) {
  return `
    <div class="alert alert-danger text-center py-4" role="alert">
      <i class="bi bi-wifi-off fs-1 d-block mb-2" aria-hidden="true"></i>
      <p class="fw-semibold mb-1">${escapar(mensagem)}</p>
      <p class="small mb-3">Verifique sua conexão ou se o site está sendo executado por um servidor HTTP.</p>
      <button type="button" class="btn btn-light btn-tentar-novamente">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Tentar novamente
      </button>
    </div>`;
}

/* =========================================================
   1. LISTAGEM (primeira requisição AJAX)
   ========================================================= */

async function carregarItens() {
  listaItens.innerHTML = '';
  contador.textContent = '';
  estadoLista.innerHTML = htmlCarregando('Carregando catálogo...');

  try {
    todosItens = await buscarJSON(URL_ITENS, 'lista');
    estadoLista.innerHTML = '';
    preencherCategorias();
    aplicarFiltros();
  } catch (erro) {
    console.error(erro);
    estadoLista.innerHTML = htmlErro('Não foi possível carregar o catálogo.');
    estadoLista.querySelector('.btn-tentar-novamente').addEventListener('click', carregarItens);
  }
}

// Cria as opções do <select> a partir das categorias presentes nos dados
function preencherCategorias() {
  const categorias = [...new Set(todosItens.map(item => item.categoria))].sort();
  const selecionada = filtroCategoria.value;

  filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
  categorias.forEach(categoria => {
    const opcao = document.createElement('option');
    opcao.value = categoria;
    opcao.textContent = categoria;
    filtroCategoria.appendChild(opcao);
  });
  filtroCategoria.value = selecionada;
}

// Monta os cards na tela (cada card é um <article>)
function renderizarCards(itens) {
  listaItens.innerHTML = itens.map(item => `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article class="card card-item h-100 shadow-sm">
        <img src="${escapar(item.imagem)}" class="card-img-top" alt="${escapar(item.alt)}" loading="lazy" width="1280" height="720">
        <div class="card-body d-flex flex-column">
          <span class="badge badge-categoria ${classeCategoria(item.categoria)} align-self-start mb-2">${escapar(item.categoria)}</span>
          <h3 class="card-title h5">${escapar(item.titulo)}</h3>
          <p class="card-text text-body-secondary small flex-grow-1">${escapar(item.resumo)}</p>
          <button type="button" class="btn btn-neon btn-sm mt-2"
                  data-bs-toggle="modal" data-bs-target="#modalDetalhes" data-id="${item.id}">
            <i class="bi bi-eye" aria-hidden="true"></i> Ver detalhes
            <span class="visually-hidden">de ${escapar(item.titulo)}</span>
          </button>
        </div>
      </article>
    </div>`).join('');
}

/* =========================================================
   2. BUSCA E FILTRO (sem recarregar a página)
   ========================================================= */

function aplicarFiltros() {
  const termo = normalizar(campoBusca.value.trim());
  const categoria = filtroCategoria.value;

  const filtrados = todosItens.filter(item => {
    const combinaCategoria = !categoria || item.categoria === categoria;
    const textoItem = normalizar(`${item.titulo} ${item.resumo} ${item.categoria}`);
    const combinaBusca = !termo || textoItem.includes(termo);
    return combinaCategoria && combinaBusca;
  });

  renderizarCards(filtrados);
  contador.textContent = `Mostrando ${filtrados.length} de ${todosItens.length} itens.`;

  if (filtrados.length === 0) {
    const descricao = campoBusca.value.trim()
      ? `para "<strong>${escapar(campoBusca.value.trim())}</strong>"`
      : 'nesta categoria';
    estadoLista.innerHTML = htmlVazio(`Nenhum item encontrado ${descricao}. Tente outro termo ou categoria.`);
  } else {
    estadoLista.innerHTML = '';
  }
}

campoBusca.addEventListener('input', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);

// Impede o envio do formulário (Enter) de recarregar a página
formFiltros.addEventListener('submit', evento => evento.preventDefault());

// Botão "Limpar": o reset limpa os campos; depois atualizamos a lista
formFiltros.addEventListener('reset', () => setTimeout(aplicarFiltros, 0));

/* =========================================================
   3. DETALHES (nova requisição AJAX a cada item)
   ========================================================= */

async function carregarDetalhes(id) {
  idDetalheAtual = id;
  modalTitulo.textContent = 'Carregando...';
  modalCorpo.innerHTML = htmlCarregando('Buscando detalhes do item...');

  try {
    const detalhe = await buscarJSON(`${URL_DETALHES}${id}.json`, 'detalhes');
    if (id !== idDetalheAtual) return; // o usuário já abriu outro item
    renderizarDetalhes(detalhe);
  } catch (erro) {
    if (id !== idDetalheAtual) return;
    console.error(erro);
    modalTitulo.textContent = 'Erro ao carregar';
    modalCorpo.innerHTML = htmlErro('Não foi possível carregar os detalhes deste item.');
    modalCorpo.querySelector('.btn-tentar-novamente').addEventListener('click', () => carregarDetalhes(id));
  }
}

function renderizarDetalhes(detalhe) {
  modalTitulo.textContent = detalhe.titulo;

  const paragrafos = detalhe.descricao.map(p => `<p>${escapar(p)}</p>`).join('');
  const ficha = detalhe.ficha.map(linha => `
      <dt class="col-sm-5">${escapar(linha.rotulo)}</dt>
      <dd class="col-sm-7">${escapar(linha.valor)}</dd>`).join('');
  const curiosidades = detalhe.curiosidades.map(c => `<li>${escapar(c)}</li>`).join('');

  modalCorpo.innerHTML = `
    <article>
      <figure class="mb-3">
        <img src="${escapar(detalhe.imagem)}" class="detalhe-imagem rounded" alt="${escapar(detalhe.alt)}" width="1280" height="720">
        <figcaption class="small text-body-secondary mt-1">Imagem: ${escapar(detalhe.fonte)}</figcaption>
      </figure>
      <span class="badge badge-categoria ${classeCategoria(detalhe.categoria)} mb-3">${escapar(detalhe.categoria)}</span>
      <div class="row g-4">
        <div class="col-12 col-md-7">
          <h3 class="h6 text-uppercase texto-neon">Descrição</h3>
          ${paragrafos}
        </div>
        <div class="col-12 col-md-5">
          <h3 class="h6 text-uppercase texto-neon">Ficha</h3>
          <dl class="row small mb-3">${ficha}</dl>
          <h3 class="h6 text-uppercase texto-neon">Curiosidades</h3>
          <ul class="small ps-3 mb-0">${curiosidades}</ul>
        </div>
      </div>
    </article>`;
}

// Evento do Bootstrap disparado quando o modal vai abrir.
// relatedTarget é o botão "Ver detalhes" clicado, que guarda o id em data-id.
modalElemento.addEventListener('show.bs.modal', evento => {
  const botao = evento.relatedTarget;
  if (botao && botao.dataset.id) {
    carregarDetalhes(Number(botao.dataset.id));
  }
});

/* =========================================================
   Navegação: no celular, fecha o menu ao clicar em um link
   ========================================================= */
const menuPrincipal = document.getElementById('menuPrincipal');
menuPrincipal.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (menuPrincipal.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(menuPrincipal).hide();
    }
  });
});

/* =========================================================
   Início
   ========================================================= */
carregarItens();
