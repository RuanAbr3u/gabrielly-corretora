// ============================================
// UTILITÁRIOS COMPARTILHADOS
// Funções comuns usadas em todo o projeto
// ============================================

// ========== FORMATAÇÃO DE DATAS ==========

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * @param {string} dataISO - Data no formato ISO
 * @returns {string} Data formatada em pt-BR
 */
function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Converte data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 * @param {string} dataBR - Data no formato brasileiro
 * @returns {string} Data no formato ISO
 */
function desformatarDataBR(dataBR) {
    if (!dataBR) return '';
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
}

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD)
 * @returns {string} Data atual
 */
function dataAtual() {
    return new Date().toISOString().split('T')[0];
}

// ========== FORMATAÇÃO DE DOCUMENTOS ==========

/**
 * Formata CPF ou CNPJ com pontuação
 * @param {string|number} input - Documento com ou sem formatação
 * @returns {string} Documento formatado
 */
function formatarDocumentoMask(input) {
    if (!input) return '';
    const digits = (input + '').replace(/\D/g, '');
    
    if (digits.length === 11) {
        // CPF: 000.000.000-00
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    if (digits.length === 14) {
        // CNPJ: 00.000.000/0000-00
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return input;
}

/**
 * Aplica máscara durante a digitação (CPF/CNPJ)
 * @param {string} value - Valor digitado
 * @returns {string} Valor com máscara aplicada
 */
function aplicarMaskDocumento(value) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    
    if (digits.length <= 11) {
        // CPF
        const p = digits;
        if (p.length <= 3) return p;
        if (p.length <= 6) return p.replace(/(\d{3})(\d+)/, '$1.$2');
        if (p.length <= 9) return p.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
        return p.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
    
    // CNPJ
    const p = digits;
    if (p.length <= 2) return p;
    if (p.length <= 5) return p.replace(/(\d{2})(\d+)/, '$1.$2');
    if (p.length <= 8) return p.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (p.length <= 12) return p.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return p.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
}

/**
 * Handler para aplicar máscara mantendo posição do cursor
 * @param {Event} e - Evento de input
 */
function handleDocumentoInput(e) {
    const input = e.target;
    const selectionStart = input.selectionStart;
    const oldValue = input.value;
    const digitsBefore = (oldValue.slice(0, selectionStart).match(/\d/g) || []).length;
    const newMasked = aplicarMaskDocumento(oldValue);
    input.value = newMasked;
    
    let pos = 0;
    let counted = 0;
    while (pos < input.value.length && counted < digitsBefore) {
        if (/\d/.test(input.value[pos])) counted++;
        pos++;
    }
    input.setSelectionRange(pos, pos);
}

// ========== VALIDAÇÃO DE DOCUMENTOS ==========

/**
 * Valida CPF usando algoritmo oficial
 * @param {string} digits - 11 dígitos do CPF
 * @returns {boolean} true se válido
 */
function validarCPF(digits) {
    if (!/^[0-9]{11}$/.test(digits)) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // Rejeita sequências repetidas
    
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

/**
 * Valida CNPJ usando algoritmo oficial
 * @param {string} digits - 14 dígitos do CNPJ
 * @returns {boolean} true se válido
 */
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

// ========== FORMATAÇÃO DE MOEDA ==========

/**
 * Formata número para moeda brasileira
 * @param {number|string} valor - Valor a formatar
 * @returns {string} Valor formatado (R$ 1.234,56)
 */
function formatarMoeda(valor) {
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Remove formatação de moeda e retorna número
 * @param {string} valorFormatado - Valor formatado (R$ 1.234,56)
 * @returns {number} Valor numérico
 */
function parseMoeda(valorFormatado) {
    if (!valorFormatado) return 0;
    const limpo = valorFormatado.toString()
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(limpo) || 0;
}

// ========== VALIDAÇÃO DE CAMPOS ==========

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} true se válido
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida telefone brasileiro
 * @param {string} telefone - Telefone com ou sem formatação
 * @returns {boolean} true se válido
 */
function validarTelefone(telefone) {
    const digits = telefone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
}

/**
 * Valida CEP brasileiro
 * @param {string} cep - CEP com ou sem formatação
 * @returns {boolean} true se válido
 */
function validarCEP(cep) {
    const digits = cep.replace(/\D/g, '');
    return digits.length === 8;
}

// ========== FORMATAÇÃO DE TELEFONE ==========

/**
 * Formata telefone brasileiro
 * @param {string} telefone - Telefone com ou sem formatação
 * @returns {string} Telefone formatado
 */
function formatarTelefone(telefone) {
    const digits = telefone.replace(/\D/g, '');
    
    if (digits.length === 11) {
        // Celular: (00) 00000-0000
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    if (digits.length === 10) {
        // Fixo: (00) 0000-0000
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
}

// ========== FORMATAÇÃO DE CEP ==========

/**
 * Formata CEP brasileiro
 * @param {string} cep - CEP com ou sem formatação
 * @returns {string} CEP formatado (00000-000)
 */
function formatarCEP(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length === 8) {
        return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
}

// ========== MENSAGENS DE FEEDBACK ==========

/**
 * Mostra mensagem de feedback temporária
 * @param {string} msg - Mensagem a exibir
 * @param {boolean} erro - Se é mensagem de erro
 * @param {number} duracao - Duração em ms (padrão: 3000)
 */
function mostrarMensagem(msg, erro = false, duracao = 3000) {
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
        div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        div.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(div);
    }
    
    div.textContent = msg;
    div.style.background = erro ? '#e74c3c' : '#27ae60';
    div.style.color = '#fff';
    div.style.opacity = '1';
    div.style.display = 'block';
    
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => { div.style.display = 'none'; }, 300);
    }, duracao);
}

// ========== UTILITÁRIOS GERAIS ==========

/**
 * Debounce - Atrasa execução de função
 * @param {Function} func - Função a executar
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copia texto para área de transferência
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} true se copiado com sucesso
 */
async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (err) {
        console.error('Erro ao copiar:', err);
        return false;
    }
}

/**
 * Sanitiza string para evitar XSS
 * @param {string} str - String a sanitizar
 * @returns {string} String segura
 */
function sanitizarHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Gera ID único
 * @returns {string} ID único
 */
function gerarID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

console.log('✅ Utilitários carregados com sucesso!');
