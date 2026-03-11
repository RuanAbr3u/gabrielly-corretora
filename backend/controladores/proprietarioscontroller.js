const db = require("../configuração/database");

class ProprietariosController {
  // LISTAR TODOS
  async listar(req, res) {
    try {
      const result = await db.query(
        "SELECT * FROM proprietarios ORDER BY nome ASC",
      );

      res.json({
        success: true,
        total: result.rows.length,
        proprietarios: result.rows,
      });
    } catch (error) {
      console.error("Erro ao listar proprietários:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao listar proprietários",
      });
    }
  }

  // BUSCAR POR ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        "SELECT * FROM proprietarios WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Proprietário não encontrado",
        });
      }

      res.json({
        success: true,
        proprietario: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao buscar proprietário:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao buscar proprietário",
      });
    }
  }

  // CRIAR
  async criar(req, res) {
    try {
      const {
        nome,
        cpf_cnpj,
        tipo_pessoa,
        telefone,
        email,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
      } = req.body;

      // Validações
      if (!nome || !cpf_cnpj) {
        return res.status(400).json({
          error: true,
          message: "Nome e CPF/CNPJ são obrigatórios",
        });
      }

      // Verificar se CPF/CNPJ já existe
      const existente = await db.query(
        "SELECT id FROM proprietarios WHERE cpf_cnpj = $1",
        [cpf_cnpj],
      );

      if (existente.rows.length > 0) {
        return res.status(400).json({
          error: true,
          message: "CPF/CNPJ já cadastrado",
        });
      }

      const query = `
        INSERT INTO proprietarios (
          nome, cpf_cnpj, tipo_pessoa, telefone, email, cep, rua, numero,
          complemento, bairro, cidade, estado, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        nome,
        cpf_cnpj,
        tipo_pessoa || "fisica",
        telefone,
        email,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        observacoes,
      ];

      const result = await db.query(query, values);

      res.status(201).json({
        success: true,
        message: "Proprietário criado com sucesso",
        proprietario: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao criar proprietário:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao criar proprietário",
      });
    }
  }

  // ATUALIZAR
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;

      // Verificar se existe
      const existente = await db.query(
        "SELECT id FROM proprietarios WHERE id = $1",
        [id],
      );

      if (existente.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Proprietário não encontrado",
        });
      }

      // Construir query dinâmica
      const campos = [];
      const valores = [];
      let index = 1;

      for (const [key, value] of Object.entries(dados)) {
        if (value !== undefined && value !== null) {
          campos.push(`${key} = $${index}`);
          valores.push(value);
          index++;
        }
      }

      if (campos.length === 0) {
        return res.status(400).json({
          error: true,
          message: "Nenhum campo para atualizar",
        });
      }

      campos.push(`atualizado_em = NOW()`);
      valores.push(id);

      const query = `
        UPDATE proprietarios 
        SET ${campos.join(", ")}
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await db.query(query, valores);

      res.json({
        success: true,
        message: "Proprietário atualizado com sucesso",
        proprietario: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao atualizar proprietário:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao atualizar proprietário",
      });
    }
  }

  // DELETAR
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se tem imóveis vinculados
      const imoveis = await db.query(
        "SELECT COUNT(*) as total FROM imoveis WHERE proprietario_id = $1",
        [id],
      );

      if (parseInt(imoveis.rows[0].total) > 0) {
        return res.status(400).json({
          error: true,
          message: "Não é possível deletar proprietário com imóveis vinculados",
        });
      }

      const result = await db.query(
        "DELETE FROM proprietarios WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Proprietário não encontrado",
        });
      }

      res.json({
        success: true,
        message: "Proprietário deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar proprietário:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao deletar proprietário",
      });
    }
  }
}

module.exports = new ProprietariosController();
