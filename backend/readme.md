# API Gabrielly Silva Corretora - Documentação

## 📋 Índice
- [Configuração](#configuração)
- [Autenticação](#autenticação)
- [Imóveis](#imóveis)
- [Proprietários](#proprietários)
- [Atendimentos](#atendimentos)

---

## 🚀 Configuração

### Instalação

```bash
cd backend
npm install
```

### Configurar Banco de Dados

1. Crie o banco PostgreSQL:
```sql
CREATE DATABASE gabrielly_corretora;
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

3. Inicialize o banco:
```bash
npm run init-db
```

### Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

Servidor rodará em: `http://localhost:3000`

---

## 🔐 Autenticação

Todas as rotas administrativas requerem token JWT no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### POST /api/auth/login

Fazer login e obter token.

**Body:**
```json
{
  "email": "gabriellycorretora1@gmail.com",
  "senha": "Mariaas1@"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@gabriellysilva.com"
  }
}
```

### GET /api/auth/validar

Validar token atual (requer autenticação).

**Resposta:**
```json
{
  "success": true,
  "usuario": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@gabriellysilva.com"
  }
}
```

### POST /api/auth/trocar-senha

Trocar senha do usuário (requer autenticação).

**Body:**
```json
{
  "senhaAtual": "Mariaas1@",
  "novaSenha": "NovaSenha@2025"
}
```

---

## 🏠 Imóveis

### GET /api/imoveis

Listar imóveis (público).

**Query Parameters:**
- `tipo_negocio`: `venda` | `locacao`
- `categoria`: string
- `bairro`: string
- `disponibilidade`: string
- `preco_min`: number
- `preco_max`: number

**Exemplo:**
```
GET /api/imoveis?tipo_negocio=venda&bairro=Centro&preco_min=100000&preco_max=500000
```

**Resposta:**
```json
{
  "success": true,
  "total": 10,
  "imoveis": [...]
}
```

### GET /api/imoveis/estatisticas

Obter estatísticas gerais (público).

**Resposta:**
```json
{
  "success": true,
  "estatisticas": {
    "total_vendas": 50,
    "total_locacoes": 30,
    "disponiveis": 60,
    "vendidos": 15,
    "alugados": 5,
    "preco_medio_venda": 350000,
    "preco_medio_locacao": 1500
  }
}
```

### GET /api/imoveis/:id

Buscar imóvel por ID (público).

**Resposta:**
```json
{
  "success": true,
  "imovel": {
    "id": "uuid",
    "tipo_negocio": "venda",
    "categoria": "Casa",
    "rua": "Rua das Flores",
    ...
  }
}
```

### POST /api/imoveis

Criar novo imóvel (requer autenticação).

**Headers:**
```
Authorization: Bearer TOKEN
Content-Type: multipart/form-data
```

**Body (FormData):**
```
proprietario_id: uuid (opcional)
tipo_negocio: venda | locacao
categoria: string
cep: string
rua: string
numero: string
complemento: string (opcional)
bairro: string
cidade: string
estado: string (2 letras)
quartos: number
suites: number
banheiros: number
garagem: string
vagas_garagem: number
area_util: number
area_total: number
preco: number
valor_condominio: number (opcional)
valor_iptu: number (opcional)
descricao: text
disponibilidade: string
caracteristicas: JSON array (opcional)
imagens: files[] (máximo 10)
```

**Resposta:**
```json
{
  "success": true,
  "message": "Imóvel criado com sucesso",
  "imovel": {...}
}
```

### PUT /api/imoveis/:id

Atualizar imóvel (requer autenticação).

**Body:** Mesmos campos do POST (todos opcionais).

### DELETE /api/imoveis/:id

Deletar imóvel (requer autenticação).

**Resposta:**
```json
{
  "success": true,
  "message": "Imóvel deletado com sucesso"
}
```

---

## 👤 Proprietários

Todas as rotas requerem autenticação.

### GET /api/proprietarios

Listar todos os proprietários.

**Resposta:**
```json
{
  "success": true,
  "total": 25,
  "proprietarios": [...]
}
```

### GET /api/proprietarios/:id

Buscar proprietário por ID.

### POST /api/proprietarios

Criar novo proprietário.

**Body:**
```json
{
  "nome": "João Silva",
  "cpf_cnpj": "123.456.789-00",
  "tipo_pessoa": "fisica",
  "telefone": "(11) 99999-9999",
  "email": "joao@email.com",
  "cep": "12345-678",
  "rua": "Rua das Flores",
  "numero": "123",
  "complemento": "Apto 45",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "observacoes": "..."
}
```

### PUT /api/proprietarios/:id

Atualizar proprietário.

### DELETE /api/proprietarios/:id

Deletar proprietário (não pode ter imóveis vinculados).

---

## 📞 Atendimentos

### POST /api/atendimentos

Criar novo atendimento (público - formulário do site).

**Body:**
```json
{
  "imovel_id": "uuid",
  "nome_cliente": "Maria Santos",
  "telefone": "(11) 98888-8888",
  "email": "maria@email.com",
  "mensagem": "Gostaria de agendar uma visita",
  "status": "Novo",
  "origem": "Site"
}
```

### GET /api/atendimentos

Listar atendimentos (requer autenticação).

**Query Parameters:**
- `status`: string

### GET /api/atendimentos/:id

Buscar atendimento por ID (requer autenticação).

### PUT /api/atendimentos/:id

Atualizar atendimento (requer autenticação).

### DELETE /api/atendimentos/:id

Deletar atendimento (requer autenticação).

---

## 📊 Códigos de Status

- `200`: Sucesso
- `201`: Criado
- `400`: Requisição inválida
- `401`: Não autenticado
- `404`: Não encontrado
- `500`: Erro no servidor

---

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Rate limiting: 100 requests/15min
- CORS configurado
- Headers de segurança com Helmet
- Validação de tipos de arquivo no upload

---

## 📝 Exemplos de Uso (JavaScript)

### Login
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'gabriellycorretora1@gmail.com',
    senha: 'Mariaas1@'
  })
});

const data = await response.json();
const token = data.token;
localStorage.setItem('token', token);
```

### Listar Imóveis
```javascript
const response = await fetch('http://localhost:3000/api/imoveis?tipo_negocio=venda');
const data = await response.json();
console.log(data.imoveis);
```

### Criar Imóvel
```javascript
const formData = new FormData();
formData.append('tipo_negocio', 'venda');
formData.append('categoria', 'Casa');
formData.append('preco', '350000');
// ... outros campos
formData.append('imagens', file1);
formData.append('imagens', file2);

const response = await fetch('http://localhost:3000/api/imoveis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

---

## 🛠️ Desenvolvimento

### Estrutura de Pastas
```
backend/
├── config/          # Configurações (banco, init)
├── controllers/     # Lógica de negócio
├── middleware/      # Auth, upload, etc
├── routes/          # Rotas da API
├── uploads/         # Imagens dos imóveis
├── .env             # Variáveis de ambiente
├── package.json     # Dependências
└── server.js        # Servidor principal
```

### Scripts Disponíveis
- `npm start`: Iniciar em produção
- `npm run dev`: Iniciar em desenvolvimento (nodemon)
- `npm run init-db`: Inicializar banco de dados

---

## 📧 Suporte

Para dúvidas, entre em contato com o desenvolvedor.
