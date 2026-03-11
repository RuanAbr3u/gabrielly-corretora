document.getElementById('caracteristica-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const caracteristica = this.caracteristica.value.trim();
    if (!caracteristica) {
        mostrarMensagem('Preencha a característica!', true);
        return;
    }
    
    try {
        console.log('💾 Adicionando característica:', caracteristica);
        
        // Verificar duplicidade no Supabase
        const existentes = await DB.caracteristicas.listar();
        const jaExiste = existentes.some(c => c.nome.toLowerCase() === caracteristica.toLowerCase());
        
        if (jaExiste) {
            mostrarMensagem('Característica já cadastrada!', true);
            return;
        }
        
        // Salvar no Supabase
        await DB.caracteristicas.criar(caracteristica);
        console.log('✅ Característica adicionada com sucesso!');
        
        // Recarregar lista completa
        await carregarCaracteristicas();
        
        this.reset();
        
        // Atualizar painel se estiver aberto
        if (window.opener && window.opener.atualizarCaracteristicasPainel) {
            window.opener.atualizarCaracteristicasPainel();
        }
        
        mostrarMensagem('Característica adicionada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao adicionar característica:', error);
        mostrarMensagem('Erro ao adicionar característica!', true);
    }
});

function criarLiCaracteristica(texto, comId = false) {
    const li = document.createElement('li');
    if (comId && texto.id) li.dataset.id = texto.id;
    const nome = typeof texto === 'string' ? texto : texto.nome;
    li.innerHTML = `<span>${nome}</span> <button type='button' class='excluir-btn'>Excluir</button>`;
    adicionarEventosCaracteristica(li);
    return li;
}

function adicionarEventosCaracteristica(li) {
    const excluirBtn = li.querySelector('.excluir-btn');
    if (excluirBtn) excluirBtn.onclick = async function() {
        if (confirm('Tem certeza que deseja excluir esta característica?')) {
            const id = li.dataset.id;
            console.log('🗑️ Tentando excluir característica com ID:', id);
            
            if (!id) {
                console.error('❌ Erro: ID da característica não encontrado!');
                mostrarMensagem('Erro: ID não encontrado!', true);
                return;
            }
            
            try {
                // Excluir do Supabase
                await DB.caracteristicas.deletar(id);
                console.log('✅ Característica excluída com sucesso do Supabase!');
                
                // Remover da lista visualmente
                li.remove();
                
                // Recarregar lista completa para garantir
                await carregarCaracteristicas();
                
                // Atualizar painel se estiver aberto
                if (window.opener && window.opener.atualizarCaracteristicasPainel) {
                    window.opener.atualizarCaracteristicasPainel();
                }
                
                mostrarMensagem('Característica excluída com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao excluir:', error);
                mostrarMensagem('Erro ao excluir característica: ' + error.message, true);
            }
        }
    };
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
    setTimeout(() => { div.style.display = 'none'; }, 3000);
}

// Carregar características salvas ao abrir a tela
window.addEventListener('DOMContentLoaded', async function() {
    await carregarCaracteristicas();
    
    // Adicionar evento de busca
    const buscaInput = document.getElementById('busca-caracteristica');
    if (buscaInput) {
        buscaInput.addEventListener('input', buscarCaracteristicas);
    }
});

// Função para carregar características
async function carregarCaracteristicas() {
    const ul = document.getElementById('lista-caracteristicas');
    ul.innerHTML = '<li style="text-align:center; color:#666; border: none;">⏳ Carregando características...</li>';
    
    try {
        console.log('📥 Carregando características do Supabase...');
        const caracteristicas = await DB.caracteristicas.listar();
        console.log('✅ Características carregadas:', caracteristicas.length, caracteristicas);
        
        ul.innerHTML = '';
        
        if (caracteristicas.length === 0) {
            ul.innerHTML = '<li style="text-align:center; color:var(--color-muted); border: none;">Nenhuma característica cadastrada</li>';
        } else {
            caracteristicas.forEach(carac => {
                const li = document.createElement('li');
                li.dataset.id = carac.id;
                console.log('✏️ Criando item com ID:', carac.id, 'Nome:', carac.nome);
                li.innerHTML = `<span>${carac.nome}</span> <button type='button' class='excluir-btn'>Excluir</button>`;
                adicionarEventosCaracteristica(li);
                ul.appendChild(li);
            });
        }
        
        atualizarEstatisticas(caracteristicas);
    } catch (error) {
        console.error('❌ Erro ao carregar características:', error);
        ul.innerHTML = '<li style="text-align:center; color:#e74c3c; border: none;">❌ Erro ao carregar características</li>';
        mostrarMensagem('Erro ao carregar características!', true);
    }
}

// Função para atualizar estatísticas
function atualizarEstatisticas(caracteristicas) {
    const total = caracteristicas.length;
    document.getElementById('stat-total').textContent = total;
    
    // Contar características adicionadas hoje
    const hoje = new Date().toDateString();
    const recentes = caracteristicas.filter(c => {
        if (!c.created_at) return false;
        const dataCarac = new Date(c.created_at).toDateString();
        return dataCarac === hoje;
    }).length;
    
    document.getElementById('stat-recentes').textContent = recentes;
}

// Função de busca
function buscarCaracteristicas() {
    const termo = document.getElementById('busca-caracteristica')?.value.toLowerCase() || '';
    const todosLi = document.querySelectorAll('#lista-caracteristicas > li');
    
    let encontrados = 0;
    
    todosLi.forEach(li => {
        const texto = li.textContent.toLowerCase();
        const corresponde = texto.includes(termo);
        
        if (corresponde) {
            li.style.display = '';
            encontrados++;
        } else {
            li.style.display = 'none';
        }
    });
}

// Função para recarregar lista
window.recarregarCaracteristicas = async function() {
    console.log('🔄 Recarregando características...');
    await carregarCaracteristicas();
    mostrarMensagem('Lista atualizada!');
};