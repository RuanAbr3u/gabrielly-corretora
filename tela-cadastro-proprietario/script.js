// Armazenamento e renderização
let proprietarios = [];
let editandoIndex = null;

// Buscar CEP via API ViaCEP
async function buscarCEP(cep) {
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) {
        return null;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const dados = await response.json();
        
        if (dados.erro) {
            return null;
        }
        
        return dados;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
    }
}

// Máscara para CEP
function aplicarMascaraCEP(value) {
    const digitos = value.replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 5) {
        return digitos;
    }
    return digitos.replace(/(\d{5})(\d{0,3})/, '$1-$2');
}

// popula select de imóveis com dados do Supabase
async function carregarImoveisNoSelect(){
    const sel = document.querySelector('select[name="imovel"]');
    if(!sel) return;
    sel.innerHTML = '';
    
    try {
        // Carregar imóveis do Supabase
        const imoveis = await carregarImoveis();
        console.log('📦 Imóveis carregados para select (proprietário):', imoveis.length);
        
        if(!Array.isArray(imoveis) || imoveis.length === 0){
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '-- Nenhum imóvel cadastrado --';
            sel.appendChild(opt);
            return;
        }
        
        const optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.textContent = '-- Selecionar imóvel (opcional) --';
        sel.appendChild(optEmpty);
        
        imoveis.forEach((imovel)=>{
            const title = imovel.titulo || imovel.endereco || `Imóvel ${imovel.id}`;
            const op = document.createElement('option');
            op.value = imovel.id; // Usar ID do Supabase
            op.textContent = `${title} (${imovel.bairro||'sem bairro'})`;
            sel.appendChild(op);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- Erro ao carregar imóveis --';
        sel.appendChild(opt);
    }
}
window.atualizarImoveisProprietario = carregarImoveisNoSelect;

// Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) a partir de apenas dígitos
function formatarDocumentoMask(digits){
    if(!digits) return '';
    const d = digits.replace(/\D/g,'');
    if(d.length <= 11){
        // CPF
        const p1 = d.slice(0,3);
        const p2 = d.slice(3,6);
        const p3 = d.slice(6,9);
        const p4 = d.slice(9,11);
        return `${p1}${p2?'.'+p2:''}${p3?'.'+p3:''}${p4?'-'+p4:''}`;
    } else {
        // CNPJ
        const a = d.slice(0,2);
        const b = d.slice(2,5);
        const c = d.slice(5,8);
        const d1 = d.slice(8,12);
        const e = d.slice(12,14);
        return `${a}${b?'.'+b:''}${c?'.'+c:''}${d1?'/'+d1:''}${e?'-'+e:''}`;
    }
}

// Validação algorítmica CPF
function validarCPF(digits) {
    if (!/^[0-9]{11}$/.test(digits)) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    const nums = digits.split('').map(Number);
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += nums[i] * (10 - i);
    let rev = 11 - (soma % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== nums[9]) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += nums[i] * (11 - i);
    rev = 11 - (soma % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === nums[10];
}

// Validação algorítmica CNPJ
function validarCNPJ(digits) {
    if (!/^[0-9]{14}$/.test(digits)) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;
    const nums = digits.split('').map(Number);
    const calc = (pos) => {
        let soma = 0;
        let peso = pos - 7;
        for (let i = 0; i < pos - 1; i++) {
            soma += nums[i] * peso;
            peso = peso - 1;
            if (peso < 2) peso = 9;
        }
        let res = soma % 11;
        return res < 2 ? 0 : 11 - res;
    };
    const v1 = calc(13);
    if (v1 !== nums[12]) return false;
    const v2 = calc(14);
    return v2 === nums[13];
}

// Máscara live para documento com caret preservation (suporta CPF e CNPJ)
function aplicarMaskDocumento(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
        const p = digits;
        if (p.length <= 3) return p;
        if (p.length <= 6) return p.replace(/(\d{3})(\d+)/, '$1.$2');
        if (p.length <= 9) return p.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        return p.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
    const p = digits;
    if (p.length <= 2) return p;
    if (p.length <= 5) return p.replace(/(\d{2})(\d+)/, '$1.$2');
    if (p.length <= 8) return p.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (p.length <= 12) return p.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return p.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
}

function handleDocumentoInput(e) {
    const input = e.target;
    const selectionStart = input.selectionStart;
    const oldValue = input.value;
    const digitsBefore = (oldValue.slice(0, selectionStart).match(/\d/g) || []).length;
    const newMasked = aplicarMaskDocumento(oldValue);
    input.value = newMasked;
    let pos = 0; let counted = 0;
    while (pos < input.value.length && counted < digitsBefore) {
        if (/\d/.test(input.value[pos])) counted++;
        pos++;
    }
    input.setSelectionRange(pos, pos);
}

async function carregarProprietarios() {
    try {
        console.log('📥 Carregando proprietários do Supabase...');
        const dados = await DB.proprietarios.listar();
        console.log('✅ Dados recebidos:', dados);
        console.log('📊 Total de registros:', dados?.length || 0);
        
        if (dados && dados.length > 0) {
            console.table(dados);
        }
        
        proprietarios = (dados || []).map(p => {
            console.log('🔄 Processando proprietário:', p);
            
            // Mapeamento universal (funciona com Supabase E localStorage)
            return {
                id: p.id,
                nome: p.nome,
                documento: p.cpf_cnpj || p.documento,  // Ambos os nomes
                telefone: p.telefone,
                email: p.email,
                cep: p.cep,
                rua: p.rua,
                numero: p.numero,
                complemento: p.complemento,
                bairro: p.bairro,
                cidade: p.cidade,
                estado: p.estado,
                observacoes: p.observacoes,
                imovelId: p.imovel_id,
                synced: p.synced,  // Manter flag de sincronização
                foi_salvo_localmente: p.synced === false  // Compatibilidade
            };
        });
        
        console.log('✅ Proprietários processados:', proprietarios.length);
        console.log('📋 Array final de proprietários:', proprietarios);
        
        // Adicionar ao escopo global para debug
        window.proprietarios = proprietarios;
        
        // Atualizar estatísticas
        if (proprietarios.length === 0) {
            console.warn('⚠️ Nenhum proprietário encontrado');
        } else {
            const naoSincronizados = proprietarios.filter(p => p.synced === false).length;
            if (naoSincronizados > 0) {
                console.warn(`⚠️ ${naoSincronizados} proprietário(s) não sincronizado(s)`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar proprietários:', error);
        proprietarios = [];
        mostrarMensagem('Erro ao carregar proprietários: ' + (error.message || 'Erro desconhecido'), true);
    }
}

async function renderizarProprietarios() {
    const ul = document.getElementById('lista-proprietarios');
    if (!ul) {
        console.error('❌ Elemento lista-proprietarios não encontrado!');
        return;
    }
    
    ul.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-muted);">⏳ Renderizando...</li>';
    
    console.log('📋 Renderizando proprietários:', proprietarios.length);
    console.log('👥 Array de proprietários:', proprietarios);
    
    // Carregar todos os imóveis uma vez
    let todosImoveis = [];
    try {
        console.log('🏠 Carregando imóveis...');
        todosImoveis = await carregarImoveis();
        console.log('✅ Imóveis carregados para vinculação:', todosImoveis.length);
    } catch (error) {
        console.error('❌ Erro ao carregar imóveis:', error);
        console.log('⚠️ Continuando sem imóveis...');
        todosImoveis = [];
    }
    
    if (proprietarios.length === 0) {
        ul.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-muted);">Nenhum proprietário cadastrado</li>';
        atualizarEstatisticas(0);
        return;
    }
    
    console.log('🎨 Iniciando loop de renderização...');
    ul.innerHTML = '';
    let totalImoveisVinculados = 0;
    
    proprietarios.forEach((p, idx) => {
        console.log(`🔄 Renderizando proprietário ${idx + 1}/${proprietarios.length}:`, p.nome);
        
        const li = document.createElement('li');
        
        // Buscar todos os imóveis deste proprietário
        const imoveisDoProprietario = todosImoveis.filter(imovel => {
            // Verificar se o proprietário_id do imóvel corresponde ao ID do proprietário
            return imovel.proprietario_id === p.id || 
                   imovel.proprietario === p.id ||
                   imovel.owner_id === p.id;
        });
        
        console.log(`  └─ ${imoveisDoProprietario.length} imóveis vinculados`);
        
        totalImoveisVinculados += imoveisDoProprietario.length;
        
        const doc = p.documento ? formatarDocumentoMask(p.documento) : '';
        const metaParts = [];
        if(doc) metaParts.push(doc);
        if(p.telefone) metaParts.push(p.telefone);
        const meta = metaParts.join(' | ');

        // Criar HTML dos imóveis
        let imoveisHTML = '';
        if (imoveisDoProprietario.length > 0) {
            imoveisHTML = `
                <div class="imoveis-proprietario" style="margin-top: 12px; padding: 12px; background: rgba(201, 169, 97, 0.15); border-radius: 8px; border-left: 4px solid var(--color-gold);">
                    <div style="font-size: 0.9rem; color: var(--color-gold); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        🏠 ${imoveisDoProprietario.length} ${imoveisDoProprietario.length === 1 ? 'Imóvel Vinculado' : 'Imóveis Vinculados'}
                    </div>
                    ${imoveisDoProprietario.map((imovel, idx) => `
                        <div style="background: rgba(255,255,255,0.04); padding: 8px; border-radius: 6px; margin-bottom: ${idx === imoveisDoProprietario.length - 1 ? '0' : '8px'}; border-left: 3px solid rgba(201, 169, 97, 0.5);">
                            <div style="font-size: 0.9rem; color: var(--color-white); font-weight: 600; margin-bottom: 4px;">
                                ${imovel.titulo || imovel.endereco || 'Imóvel sem título'}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--color-muted);">
                                <div>📍 <strong>Bairro:</strong> ${imovel.bairro || 'N/A'}</div>
                                <div>📋 <strong>Tipo:</strong> ${imovel.tipo_negocio || 'N/A'}</div>
                                <div>💰 <strong>Valor:</strong> ${imovel.valor ? 'R$ ' + parseFloat(imovel.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : 'N/A'}</div>
                                <div>🏘️ <strong>Categoria:</strong> ${imovel.categoria || 'N/A'}</div>
                            </div>
                            ${imovel.descricao ? `<div style="margin-top: 6px; font-size: 0.85rem; color: var(--color-text); padding-top: 6px; border-top: 1px solid rgba(201, 169, 97, 0.2);">
                                📝 ${imovel.descricao.substring(0, 100)}${imovel.descricao.length > 100 ? '...' : ''}
                            </div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        li.innerHTML = `
            <div class="owner-info">
                <div class="owner-name">${p.nome}</div>
                <div class="owner-meta">${meta}</div>
                <div class="owner-email">${p.email}</div>
                ${p.observacoes ? `<div class="owner-observacoes" style="margin-top: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; font-size: 0.85rem; color: var(--color-muted); border-left: 3px solid var(--color-gold);">
                    <span style="color: var(--color-gold); font-weight: 600;">📝 Observações:</span> ${p.observacoes}
                </div>` : ''}
                ${imoveisHTML}
            </div>
            <div class="owner-actions">
                <button type='button' class='editar-btn' data-idx='${idx}'>Editar</button>
                <button type='button' class='excluir-btn' data-idx='${idx}'>Excluir</button>
            </div>
        `;
        li.setAttribute('data-proprietario-idx', idx);
        ul.appendChild(li);
        console.log(`  └─ ✅ Item adicionado à lista`);
    });
    
    console.log('✅ Loop finalizado. Total de itens na lista:', ul.children.length);
    
    // Atualizar estatísticas
    atualizarEstatisticas(totalImoveisVinculados);
    adicionarEventosProprietarios();
    
    console.log('🎉 Renderização completa!');
}

// Função para atualizar estatísticas
function atualizarEstatisticas(totalImoveisVinculados) {
    const totalProprietarios = proprietarios.length;
    const media = totalProprietarios > 0 ? (totalImoveisVinculados / totalProprietarios).toFixed(1) : 0;
    
    const elementoTotal = document.getElementById('total-proprietarios');
    const elementoImoveis = document.getElementById('total-imoveis-vinculados');
    const elementoMedia = document.getElementById('media-imoveis');
    
    if (elementoTotal) elementoTotal.textContent = totalProprietarios;
    if (elementoImoveis) elementoImoveis.textContent = totalImoveisVinculados;
    if (elementoMedia) elementoMedia.textContent = media;
}

function adicionarEventosProprietarios() {
    document.querySelectorAll('.excluir-btn').forEach(btn => {
        btn.onclick = async function() {
            const idx = Number(this.getAttribute('data-idx'));
            const proprietario = proprietarios[idx];
            
            if (!proprietario) {
                console.error('❌ Proprietário não encontrado no índice:', idx);
                mostrarMensagem('Erro: Proprietário não encontrado!', true);
                return;
            }
            
            if (!proprietario.id) {
                console.error('❌ Proprietário sem ID:', proprietario);
                mostrarMensagem('Erro: ID do proprietário não encontrado!', true);
                return;
            }
            
            if (confirm(`Tem certeza que deseja excluir ${proprietario.nome}?`)) {
                try {
                    console.log('🗑️ Excluindo proprietário:', proprietario.id, proprietario.nome);
                    await DB.proprietarios.deletar(proprietario.id);
                    console.log('✅ Proprietário excluído com sucesso');
                    
                    await carregarProprietarios();
                    await renderizarProprietarios();
                    mostrarMensagem('Proprietário excluído com sucesso!');
                    
                    // Atualizar select no painel (se existir)
                    if (window.parent && window.parent.atualizarProprietariosPainel) {
                        window.parent.atualizarProprietariosPainel();
                    }
                } catch (error) {
                    console.error('❌ Erro ao excluir proprietário:', error);
                    mostrarMensagem('Erro ao excluir proprietário: ' + (error.message || 'Erro desconhecido'), true);
                }
            }
        };
    });
    document.querySelectorAll('.editar-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = Number(this.getAttribute('data-idx'));
            const p = proprietarios[idx];
            
            console.log('📝 Editando proprietário:', p);
            
            document.querySelector('input[name="nome"]').value = p.nome;
            document.querySelector('input[name="telefone"]').value = p.telefone || '';
            document.querySelector('input[name="documento"]').value = formatarDocumentoMask(p.documento || '');
            document.querySelector('input[name="email"]').value = p.email || '';
            
            // Campos de endereço
            const cepInput = document.querySelector('input[name="cep"]');
            if (cepInput) cepInput.value = p.cep || '';
            
            const ruaInput = document.querySelector('input[name="rua"]');
            if (ruaInput) ruaInput.value = p.rua || '';
            
            const numeroInput = document.querySelector('input[name="numero"]');
            if (numeroInput) numeroInput.value = p.numero || '';
            
            const complementoInput = document.querySelector('input[name="complemento"]');
            if (complementoInput) complementoInput.value = p.complemento || '';
            
            const bairroInput = document.querySelector('input[name="bairro"]');
            if (bairroInput) bairroInput.value = p.bairro || '';
            
            const cidadeInput = document.querySelector('input[name="cidade"]');
            if (cidadeInput) cidadeInput.value = p.cidade || '';
            
            const estadoInput = document.querySelector('input[name="estado"]');
            if (estadoInput) estadoInput.value = p.estado || '';
            
            // Observações
            const obsInput = document.querySelector('textarea[name="observacoes"]');
            if (obsInput) obsInput.value = p.observacoes || '';
            
            // Setar select de imóvel (suporta ID ou índice)
            const sel = document.querySelector('select[name="imovel"]');
            if(sel) {
                if(p.imovelId) {
                    sel.value = p.imovelId;
                } else if(p.imovelIndex !== undefined && p.imovelIndex !== null) {
                    sel.value = String(p.imovelIndex);
                } else {
                    sel.value = '';
                }
            }
            
            editandoIndex = idx;
            document.querySelector('button[type="submit"]').textContent = 'Atualizar Proprietário';
            
            // Scroll para o formulário
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    });
}

document.getElementById('proprietario-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nome = this.nome.value.trim();
    const telefone = this.telefone.value.trim();
    const documento = this.documento ? this.documento.value.trim() : '';
    const imovelValue = this.imovel && this.imovel.value !== '' ? this.imovel.value : null;
    const email = this.email.value.trim();
    const cep = this.cep ? this.cep.value.trim() : '';
    const rua = this.rua ? this.rua.value.trim() : '';
    const numero = this.numero ? this.numero.value.trim() : '';
    const complemento = this.complemento ? this.complemento.value.trim() : '';
    const bairro = this.bairro ? this.bairro.value.trim() : '';
    const cidade = this.cidade ? this.cidade.value.trim() : '';
    const estado = this.estado ? this.estado.value.trim() : '';
    const observacoes = this.observacoes ? this.observacoes.value.trim() : '';
    
    // Validação
    if (!nome || !telefone || !email) {
        mostrarMensagem('Preencha todos os campos obrigatórios!', true);
        return;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        mostrarMensagem('E-mail inválido!', true);
        return;
    }
    // validação simples do documento (apenas números permitidos ou vazio)
    const docDigits = (documento || '').replace(/\D/g,'');
    if(documento && !(docDigits.length === 11 || docDigits.length === 14)){
        mostrarMensagem('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos).', true);
        return;
    }
    // validação algorítmica quando presente
    if (docDigits) {
        if (docDigits.length === 11 && !validarCPF(docDigits)) { mostrarMensagem('CPF inválido.', true); return; }
        if (docDigits.length === 14 && !validarCNPJ(docDigits)) { mostrarMensagem('CNPJ inválido.', true); return; }
    }
    // armazena documento apenas com dígitos
    const documentoParaSalvar = docDigits || '';
    
    try {
        const proprietarioData = {
            nome,
            cpf_cnpj: documentoParaSalvar,
            telefone,
            email,
            cep: cep || '',
            rua: rua || '',
            numero: numero || '',
            complemento: complemento || '',
            bairro: bairro || '',
            cidade: cidade || '',
            estado: estado || '',
            observacoes: observacoes || ''
        };
        
        console.log('💾 Salvando proprietário:', proprietarioData);
        
        if (editandoIndex !== null) {
            // Atualizar
            const proprietarioAtual = proprietarios[editandoIndex];
            await DB.proprietarios.atualizar(proprietarioAtual.id, proprietarioData);
            editandoIndex = null;
            this.querySelector('button[type="submit"]').textContent = 'Cadastrar';
            mostrarMensagem('Proprietário atualizado com sucesso!');
        } else {
            // Verificar se CPF/CNPJ já existe antes de criar
            if (documentoParaSalvar) {
                const jaExiste = proprietarios.some(p => p.documento === documentoParaSalvar);
                if (jaExiste) {
                    mostrarMensagem('Este CPF/CNPJ já está cadastrado!', true);
                    return;
                }
            }
            
            // Criar novo
            await DB.proprietarios.criar(proprietarioData);
            mostrarMensagem('Proprietário cadastrado com sucesso!');
        }
        
        // Recarregar lista
        console.log('🔄 Recarregando proprietários após salvar...');
        await carregarProprietarios();
        console.log('✅ Proprietários recarregados. Total:', proprietarios.length);
        
        console.log('🎨 Renderizando lista de proprietários...');
        await renderizarProprietarios();
        console.log('✅ Lista renderizada com sucesso!');
        
        this.reset();
        
        // Atualizar select no painel (se existir)
        if (window.parent && window.parent.atualizarProprietariosPainel) {
            window.parent.atualizarProprietariosPainel();
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar proprietário:', error);
        console.error('   Tipo:', error.constructor.name);
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        
        // Mensagem mais amigável para erros comuns
        let mensagemErro = error.message;
        if (mensagemErro.includes('Failed to fetch')) {
            mensagemErro = '⚠️ Supabase está indisponível. Dados sendo salvos LOCALMENTE. Sincronizarão quando internet voltar.';
        } else if (mensagemErro.includes('duplicate key') && mensagemErro.includes('cpf_cnpj')) {
            mensagemErro = 'Este CPF/CNPJ já está cadastrado no sistema!';
        } else if (mensagemErro.includes('duplicate key') && mensagemErro.includes('email')) {
            mensagemErro = 'Este e-mail já está cadastrado no sistema!';
        } else if (mensagemErro.includes('not initialized')) {
            mensagemErro = 'Supabase não está inicializado. Recarregue a página e tente novamente.';
        }
        
        // Se foi salvo localmente, não mostrar como erro
        const foi_salvo_localmente = proprietarios.length > 0 && 
                                      proprietarios[proprietarios.length - 1]?.synced === false;
        
        mostrarMensagem(`${foi_salvo_localmente ? '✅ Salvo Localmente: ' : 'Erro ao salvar: '}${mensagemErro}`, !foi_salvo_localmente);
    }
});

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
(async function() {
    try {
        console.log('🚀 Iniciando aplicação...');
        
        // Verificar se DB está disponível
        if (!window.DB || !window.DB.proprietarios) {
            console.error('❌ DB não está disponível! Aguardando...');
            // Tentar novamente após 1 segundo
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('📥 Carregando proprietários...');
        await carregarProprietarios();
        console.log('✅ Proprietários carregados:', proprietarios.length);
        
        console.log('🎨 Renderizando proprietários...');
        await renderizarProprietarios();
        console.log('✅ Proprietários renderizados');
        
        console.log('🏠 Carregando imóveis no select...');
        await carregarImoveisNoSelect();
        console.log('✅ Imóveis carregados no select');
        
        // Verificar se há dados locais não sincronizados
        const backup = JSON.parse(localStorage.getItem('proprietarios_backup') || '[]');
        const naoSincronizados = backup.filter(p => p.synced === false).length;
        if (naoSincronizados > 0) {
            mostrarMensagem(`⚠️ Você tem ${naoSincronizados} propriet${naoSincronizados === 1 ? 'ário' : 'ários'} aguardando sincronização com Supabase`, false);
            console.warn(`⚠️ ${naoSincronizados} registros locais não sincronizados com Supabase`);
        }
        
        console.log('🎉 Aplicação iniciada com sucesso!');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        
        // Tentar carregar do fallback localStorage
        try {
            console.warn('⚠️ Tentando carregar dados do localStorage...');
            const backup = JSON.parse(localStorage.getItem('proprietarios_backup') || '[]');
            proprietarios = backup;
            await renderizarProprietarios();
            
            mostrarMensagem('⚠️ Supabase indisponível. Mostrando dados locais salvos.', false);
            console.log('📂 Dados carregados do localStorage. Total:', proprietarios.length);
        } catch (fallbackError) {
            console.error('❌ Erro ao carregar fallback:', fallbackError);
            const ul = document.getElementById('lista-proprietarios');
            if (ul) {
                ul.innerHTML = `
                    <li style="text-align: center; padding: 20px; color: #ff6b6b;">
                        ❌ Erro ao carregar: ${error.message}<br>
                        <button onclick="recarregarListaProprietarios()" style="margin-top: 10px; padding: 8px 16px; background: var(--color-gold); border: none; border-radius: 6px; cursor: pointer;">
                            🔄 Tentar Novamente
                        </button>
                    </li>
                `;
            }
        }
    }
})();

// Atualiza lista de imóveis quando a janela/aba ganha foco (útil se imóveis forem cadastrados em outra tela)
window.addEventListener('focus', async function(){ 
    await carregarImoveisNoSelect(); 
});

// Listener para CEP
const inputCEP = document.getElementById('cep');
const cepLoading = document.getElementById('cep-loading');
const cepError = document.getElementById('cep-error');

if (inputCEP) {
    // Aplicar máscara ao digitar
    inputCEP.addEventListener('input', function(e) {
        e.target.value = aplicarMascaraCEP(e.target.value);
    });
    
    // Buscar endereço ao completar 8 dígitos
    inputCEP.addEventListener('blur', async function() {
        const cep = this.value.replace(/\D/g, '');
        
        if (cep.length !== 8) return;
        
        if (cepLoading) cepLoading.style.display = 'block';
        if (cepError) cepError.style.display = 'none';
        
        const dados = await buscarCEP(cep);
        
        if (cepLoading) cepLoading.style.display = 'none';
        
        if (dados) {
            // Preencher campos automaticamente
            const ruaInput = document.querySelector('input[name="rua"]');
            const bairroInput = document.getElementById('bairro');
            const cidadeInput = document.getElementById('cidade');
            const estadoInput = document.getElementById('estado');
            
            if (ruaInput && dados.logradouro) ruaInput.value = dados.logradouro;
            if (bairroInput && dados.bairro) bairroInput.value = dados.bairro;
            if (cidadeInput && dados.localidade) cidadeInput.value = dados.localidade;
            if (estadoInput && dados.uf) estadoInput.value = dados.uf;
            
            mostrarMensagem('✅ Endereço encontrado!');
        } else {
            if (cepError) cepError.style.display = 'block';
            mostrarMensagem('❌ CEP não encontrado', true);
        }
    });
}
// ligar máscara live se o input existir
const docInput = document.querySelector('input[name="documento"]');
if (docInput) {
    docInput.addEventListener('input', handleDocumentoInput);
    docInput.addEventListener('blur', function(){ this.value = formatarDocumentoMask(this.value); });
}

// Função global para recarregar lista manualmente
window.recarregarListaProprietarios = async function() {
    try {
        console.log('🔄 Recarregando lista manualmente...');
        const ul = document.getElementById('lista-proprietarios');
        ul.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-muted);">⏳ Carregando proprietários...</li>';
        
        await carregarProprietarios();
        await renderizarProprietarios();
        
        console.log('✅ Lista recarregada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao recarregar lista:', error);
        const ul = document.getElementById('lista-proprietarios');
        ul.innerHTML = '<li style="text-align: center; padding: 20px; color: #ff6b6b;">❌ Erro ao carregar. Tente novamente.</li>';
    }
};

// ========== BUSCA E FILTRO ==========

function buscarProprietarios() {
    const termo = document.getElementById('busca-proprietario')?.value.toLowerCase() || '';
    const todosLi = document.querySelectorAll('#lista-proprietarios > li:not(.mensagem-busca-vazia)');
    
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
    
    // Gerenciar mensagem de busca vazia
    const ul = document.getElementById('lista-proprietarios');
    const mensagemExistente = ul.querySelector('.mensagem-busca-vazia');
    
    if (termo && encontrados === 0 && todosLi.length > 0) {
        if (!mensagemExistente) {
            const li = document.createElement('li');
            li.className = 'mensagem-busca-vazia';
            li.style.cssText = 'text-align: center; padding: 20px; color: var(--color-muted);';
            li.textContent = '🔍 Nenhum proprietário encontrado com esse termo';
            ul.appendChild(li);
        }
    } else {
        if (mensagemExistente) mensagemExistente.remove();
    }
}

function limparBusca() {
    const buscaInput = document.getElementById('busca-proprietario');
    if (buscaInput) {
        buscaInput.value = '';
        buscarProprietarios();
    }
}

// Inicializar busca se elemento existir
document.addEventListener('DOMContentLoaded', function() {
    const buscaInput = document.getElementById('busca-proprietario');
    if (buscaInput) {
        buscaInput.addEventListener('input', buscarProprietarios);
    }
});