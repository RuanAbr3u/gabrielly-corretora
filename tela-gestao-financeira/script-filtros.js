// Funções de filtros
function aplicarFiltros() {
    const dataInicio = document.getElementById('filtro-data-inicio')?.value || '';
    const dataFim = document.getElementById('filtro-data-fim')?.value || '';
    const tipo = document.getElementById('filtro-tipo')?.value || '';
    const status = document.getElementById('filtro-status')?.value || '';
    
    return lancamentos.filter(l => {
        // Filtro de data início
        if (dataInicio && l.data < dataInicio) return false;
        // Filtro de data fim
        if (dataFim && l.data > dataFim) return false;
        // Filtro de tipo
        if (tipo && l.tipo !== tipo) return false;
        // Filtro de status
        if (status === 'pago' && l.pendente) return false;
        if (status === 'pendente' && !l.pendente) return false;
        
        return true;
    });
}

function limparFiltros() {
    const filtroInicio = document.getElementById('filtro-data-inicio');
    const filtroFim = document.getElementById('filtro-data-fim');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroStatus = document.getElementById('filtro-status');
    
    if (filtroInicio) filtroInicio.value = '';
    if (filtroFim) filtroFim.value = '';
    if (filtroTipo) filtroTipo.value = '';
    if (filtroStatus) filtroStatus.value = '';
    
    renderizarLancamentos();
    mostrarMensagem('Filtros limpos!');
}

// Adicionar evento aos filtros
document.addEventListener('DOMContentLoaded', function() {
    const filtros = ['filtro-data-inicio', 'filtro-data-fim', 'filtro-tipo', 'filtro-status'];
    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', renderizarLancamentos);
        }
    });
});

// Função de renderizar gráfico aprimorada
function renderChart() {
    const filtrados = aplicarFiltros();
    let totalReceitas = 0;
    let totalDespesas = 0;
    
    filtrados.forEach(l => {
        const v = Number((l.valor||0).toString().replace(',','.')) || 0;
        if (!l.pendente) {
            if (l.tipo === 'receita') totalReceitas += v;
            else if (l.tipo === 'despesa') totalDespesas += v;
        }
    });
    
    const saldoLiquido = totalReceitas - totalDespesas;
    const total = totalReceitas + totalDespesas;
    const maximo = Math.max(totalReceitas, totalDespesas, 1);
    const alturaReceitas = (totalReceitas / maximo) * 100;
    const alturaDespesas = (totalDespesas / maximo) * 100;
    
    // Calcular percentuais
    const percentReceitas = total > 0 ? ((totalReceitas / total) * 100).toFixed(1) : 0;
    const percentDespesas = total > 0 ? ((totalDespesas / total) * 100).toFixed(1) : 0;
    
    // Atualizar elementos
    const barReceitas = document.getElementById('bar-receitas');
    const barDespesas = document.getElementById('bar-despesas');
    const barReceitasValue = document.getElementById('bar-receitas-value');
    const barDespesasValue = document.getElementById('bar-despesas-value');
    const barReceitasPercent = document.getElementById('bar-receitas-percent');
    const barDespesasPercent = document.getElementById('bar-despesas-percent');
    const saldoLiquidoChart = document.getElementById('saldo-liquido-chart');
    
    if (barReceitas) barReceitas.style.height = alturaReceitas + '%';
    if (barDespesas) barDespesas.style.height = alturaDespesas + '%';
    if (barReceitasValue) barReceitasValue.textContent = formatarMoeda(totalReceitas);
    if (barDespesasValue) barDespesasValue.textContent = formatarMoeda(totalDespesas);
    if (barReceitasPercent) barReceitasPercent.textContent = percentReceitas + '% do total';
    if (barDespesasPercent) barDespesasPercent.textContent = percentDespesas + '% do total';
    
    // Atualizar saldo líquido com cor dinâmica
    if (saldoLiquidoChart) {
        saldoLiquidoChart.textContent = formatarMoeda(saldoLiquido);
        if (saldoLiquido > 0) {
            saldoLiquidoChart.style.color = '#27ae60';
        } else if (saldoLiquido < 0) {
            saldoLiquidoChart.style.color = '#e74c3c';
        } else {
            saldoLiquidoChart.style.color = 'var(--color-gold)';
        }
    }
}

// Função de exportar para Excel (CSV)
function exportarParaExcel() {
    const filtrados = aplicarFiltros();
    
    if (filtrados.length === 0) {
        mostrarMensagem('Nenhum lançamento para exportar!', true);
        return;
    }
    
    // Criar CSV
    let csv = 'Tipo;Descrição;Categoria;Valor;Data;Status\n';
    
    filtrados.forEach(l => {
        const valor = formatarMoeda(l.valor).replace('R$ ', '');
        const status = l.pendente ? 'Pendente' : 'Pago';
        const categoria = l.categoria || 'N/A';
        const dataBr = formatarDataBR(l.data);
        csv += `${l.tipo};${l.descricao};${categoria};${valor};${dataBr};${status}\n`;
    });
    
    // Criar download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const hoje = (function(){ const d = new Date(); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; })();
    
    link.setAttribute('href', url);
    link.setAttribute('download', `lancamentos_financeiros_${hoje}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarMensagem('Dados exportados com sucesso!');
}
