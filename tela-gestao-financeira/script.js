document.getElementById('financeiro-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const tipo = this.tipo.value;
    const descricao = this.descricao.value.trim();
    const categoria = this.categoria ? this.categoria.value : 'outras';
    // normaliza valor: remove prefix R$, espaços e caracteres não numéricos exceto vírgula/ponto
    const rawValorStr = String(this.valor.value || '').replace(/[^\d,.-]/g, '');
    const valor = rawValorStr.replace(',', '.');
    const data = this.data.value;
    // read pendente from select (string 'true'/'false') and convert to boolean
    const pendente = this.pendente ? (String(this.pendente.value) === 'true') : true;
    const tabela = document.querySelector('#tabela-lancamentos tbody');
    // Validação
    if (!descricao || !valor || isNaN(Number(valor)) || Number(valor) <= 0 || !data) {
        mostrarMensagem('Preencha todos os campos corretamente!', true);
        return;
    }
    if (editandoIndex !== null) {
        // Atualizar lançamento existente
        lancamentos[editandoIndex] = { tipo, descricao, categoria, valor, data, pendente };
        editandoIndex = null;
        this.querySelector('button[type="submit"]').textContent = 'Cadastrar';
    } else {
        lancamentos.push({ tipo, descricao, categoria, valor, data, pendente });
    }
    salvarLancamentos();
    renderizarLancamentos();
    this.reset();
    mostrarMensagem('Lançamento salvo com sucesso!');
});

// Funções de armazenamento e renderização
let lancamentos = [];
let editandoIndex = null;

function salvarLancamentos() {
    try {
        if (!Array.isArray(lancamentos)) {
            console.error('❌ lancamentos não é um array');
            lancamentos = [];
        }
        localStorage.setItem('lancamentosFinanceiros', JSON.stringify(lancamentos));
    } catch (error) {
        console.error('❌ Erro ao salvar lançamentos:', error);
    }
}

function carregarLancamentos() {
    try {
        const dados = localStorage.getItem('lancamentosFinanceiros');
        lancamentos = dados ? JSON.parse(dados) : [];
        
        // Validar que é um array
        if (!Array.isArray(lancamentos)) {
            console.warn('⚠️ Dados inválidos no localStorage, resetando...');
            lancamentos = [];
        }
    } catch (error) {
        console.error('❌ Erro ao carregar lançamentos:', error);
        lancamentos = [];
    }
}

function renderizarLancamentos() {
    const tabela = document.querySelector('#tabela-lancamentos tbody');
    if (!tabela) {
        console.error('❌ Tabela de lançamentos não encontrada');
        return;
    }
    tabela.innerHTML = '';
    
    // Aplicar filtros
    const filtrados = aplicarFiltros();
    
    if (!Array.isArray(filtrados)) {
        console.error('❌ filtrados não é um array');
        return;
    }
    
    filtrados.forEach((l, idx) => {
        // Validar objeto
        if (!l || typeof l !== 'object') {
            console.warn('⚠️ Lançamento inválido ignorado:', l);
            return;
        }
        
        // Encontrar o índice original
        const idxOriginal = lancamentos.indexOf(l);
        
        const tr = document.createElement('tr');
        const statusHtml = l.pendente ? `<span class="badge pending" style="background:#f39c12;color:#111;padding:4px 8px;border-radius:8px;">Pendente</span>` : `<span class="badge paid" style="background:#2ecc71;color:#042; padding:4px 8px;border-radius:8px;">Pago</span>`;
        const dataBr = formatarDataBR(l.data);
        const categoriaLabel = l.categoria ? ` [${l.categoria}]` : '';
        tr.innerHTML = `<td>${l.tipo}</td><td>${l.descricao}${categoriaLabel}</td><td class="valor">${formatarMoeda(l.valor)}</td><td>${dataBr}</td><td>${statusHtml}</td><td><button type='button' class='toggle-status-btn' data-idx='${idxOriginal}'>${l.pendente? 'Marcar Pago' : 'Marcar Pendente'}</button> <button type='button' class='editar-btn' data-idx='${idxOriginal}'>Editar</button> <button type='button' class='excluir-btn' data-idx='${idxOriginal}'>Excluir</button></td>`;
        tabela.appendChild(tr);
    });
    adicionarEventosLinhas();
    // atualizar métricas e gráfico após render
    renderMetrics();
    renderChart();
}

function adicionarEventosLinhas() {
    document.querySelectorAll('.excluir-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = Number(this.getAttribute('data-idx'));
            if (confirm('Tem certeza que deseja excluir este lançamento?')) {
                lancamentos.splice(idx, 1);
                salvarLancamentos();
                renderizarLancamentos();
                mostrarMensagem('Lançamento excluído!');
            }
        };
    });
    document.querySelectorAll('.editar-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = Number(this.getAttribute('data-idx'));
            const l = lancamentos[idx];
            document.querySelector('select[name="tipo"]').value = l.tipo;
            document.querySelector('input[name="descricao"]').value = l.descricao;
            if (l.categoria && document.querySelector('select[name="categoria"]')) {
                document.querySelector('select[name="categoria"]').value = l.categoria;
            }
            document.querySelector('input[name="valor"]').value = 'R$ ' + (l.valor ? l.valor.replace('.', ',') : '0,00');
            // set pendente select if present
            const pendenteInput = document.querySelector('select[name="pendente"]');
            if (pendenteInput) pendenteInput.value = l.pendente ? 'true' : 'false';
            document.querySelector('input[name="data"]').value = l.data;
            editandoIndex = idx;
            document.querySelector('button[type="submit"]').textContent = 'Atualizar';
        };
    });
    // Toggle status buttons
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = Number(this.getAttribute('data-idx'));
            if (typeof lancamentos[idx] === 'undefined') return;
            lancamentos[idx].pendente = !lancamentos[idx].pendente;
            salvarLancamentos();
            renderizarLancamentos();
            mostrarMensagem(lancamentos[idx].pendente ? 'Lançamento marcado como pendente' : 'Lançamento marcado como pago');
        };
    });
}

// Função para formatar valor como moeda
function formatarMoeda(valor) {
    if (!valor) return '';
    valor = valor.toString().replace(',', '.');
    return 'R$ ' + Number(valor).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Formata data ISO (YYYY-MM-DD) para padrão BR (DD/MM/YYYY)
function formatarDataBR(dataISO){
    if(!dataISO) return '';
    // aceita também Date
    if(dataISO instanceof Date){
        const d = dataISO; const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }
    // string esperada YYYY-MM-DD
    const parts = String(dataISO).split('-');
    if(parts.length >= 3){
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataISO;
}

// Renderiza métricas: total saldo, entradas pagas, saídas pagas e pendentes
function renderMetrics(){
    const im = lancamentos || [];
    let entrada = 0, saida = 0, pendentes = 0;
    im.forEach(i=>{
        const v = Number((i.valor||0).toString().replace(',','.')) || 0;
        if (i.pendente) {
            pendentes += v;
        } else {
            if (i.tipo === 'receita') entrada += v;
            else if (i.tipo === 'despesa') saida += v;
        }
    });
    const saldo = entrada - saida;
    const elTotal = document.getElementById('totalSaldo'); if(elTotal) elTotal.textContent = formatarMoeda(saldo);
    const elEnt = document.getElementById('totalEntrada'); if(elEnt) elEnt.textContent = formatarMoeda(entrada);
    const elSai = document.getElementById('totalSaida'); if(elSai) elSai.textContent = formatarMoeda(saida);
    const elPen = document.getElementById('totalPendentes'); if(elPen) elPen.textContent = formatarMoeda(pendentes);
}

// Formatar campo de valor ao digitar (protegido caso o input não exista)
const valorInput = document.querySelector('input[name="valor"]');
if (valorInput) {
    valorInput.addEventListener('input', function(e) {
        // mantemos apenas dígitos para construir a máscara (ex: 12345 -> 123,45)
        let v = e.target.value.replace(/\D/g, "");
        if (!v) { e.target.value = ''; return; }
        // converte para centavos e formata com duas casas
        v = (parseInt(v, 10) / 100).toFixed(2);
        // adiciona prefixo R$
        e.target.value = 'R$ ' + v.replace('.', ',');
    });
    // quando o campo perde o foco, garante que tenha R$
    valorInput.addEventListener('blur', function(e){ if(e.target.value && !e.target.value.startsWith('R$')) e.target.value = 'R$ ' + e.target.value; });
}

// Mensagem de feedback
function mostrarMensagem(msg, erro = false) {
    let div = document.getElementById('mensagem-feedback');
    if (!div) {
        div = document.createElement('div');
        div.id = 'mensagem-feedback';
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.zIndex = '9999';
        div.style.padding = '14px 28px';
        div.style.borderRadius = '8px';
        div.style.fontWeight = 'bold';
        div.style.fontSize = '1.1rem';
        document.body.appendChild(div);
    }
    div.textContent = msg;
    div.style.background = erro ? '#e74c3c' : '#27ae60';
    div.style.color = '#fff';
    div.style.boxShadow = '0 2px 8px #2228';
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 2200);
}

// Inicialização
carregarLancamentos();
renderizarLancamentos();
renderMetrics();

// Define data padrão (hoje) no input no formato ISO (YYYY-MM-DD) se estiver vazio
function hojeISO(){ const d = new Date(); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; }
const dataInput = document.querySelector('input[name="data"]');
if (dataInput && !dataInput.value) dataInput.value = hojeISO();