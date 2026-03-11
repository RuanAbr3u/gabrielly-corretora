// ============================================
// SUPABASE STORAGE - Upload de Imagens
// ============================================

const STORAGE_BUCKET = 'imoveis-fotos';

// Criar URL pública para imagem
function getImageUrl(path) {
  if (!path) return '';
  
  // Se já é uma URL completa, retorna
  if (path.startsWith('http')) return path;
  
  // Gera URL pública do Supabase Storage
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Upload de imagem
async function uploadImagem(file, imovelId) {
  try {
    // Gerar nome único para arquivo
    const timestamp = Date.now();
    const extensao = file.name.split('.').pop();
    const fileName = `${imovelId}/${timestamp}.${extensao}`;
    
    // Upload
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Retornar caminho do arquivo
    return data.path;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

// Upload múltiplo de imagens
async function uploadMultiplasImagens(files, imovelId) {
  const uploads = [];
  
  for (const file of files) {
    try {
      const path = await uploadImagem(file, imovelId);
      uploads.push(path);
    } catch (error) {
      console.error('Erro ao fazer upload de arquivo:', file.name, error);
    }
  }
  
  return uploads;
}

// Deletar imagem
async function deletarImagem(path) {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return false;
  }
}

// Deletar múltiplas imagens
async function deletarMultiplasImagens(paths) {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar imagens:', error);
    return false;
  }
}

// Converter imagens base64 para arquivos (para compatibilidade)
function base64ToFile(base64String, fileName) {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], fileName, { type: mime });
}

// Migrar imagens base64 para Supabase Storage
async function migrarImagensParaStorage(imovelId, imagensBase64) {
  const novasUrls = [];
  
  for (let i = 0; i < imagensBase64.length; i++) {
    const base64 = imagensBase64[i];
    
    // Se já é URL do Supabase, manter
    if (base64.includes('supabase')) {
      novasUrls.push(base64);
      continue;
    }
    
    // Se é base64, converter e fazer upload
    if (base64.startsWith('data:image')) {
      try {
        const file = base64ToFile(base64, `imagem-${i}.jpg`);
        const path = await uploadImagem(file, imovelId);
        const url = getImageUrl(path);
        novasUrls.push(url);
      } catch (error) {
        console.error('Erro ao migrar imagem:', error);
        novasUrls.push(base64); // Manter base64 em caso de erro
      }
    } else {
      // URL externa, manter
      novasUrls.push(base64);
    }
  }
  
  return novasUrls;
}

console.log('✅ Supabase Storage configurado!');
