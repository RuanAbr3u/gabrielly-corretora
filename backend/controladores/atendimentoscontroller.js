const db = require("../configuração/database");

class AtendimentosController {
  // LISTAR TODOS
  async listar(req, res) {
    try {
      const { status } = req.query;

      let query = `
        SELECT a.*, i.rua, i.numero, i.bairro, i.cidade 
        FROM atendimentos a
        LEFT JOIN imoveis i ON a.imovel_id = i.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += " AND a.status = $1";
        params.push(status);
      }

      query += " ORDER BY a.data_contato DESC";

      const result = await db.query(query, params);

      res.json({
        success: true,
        total: result.rows.length,
        atendimentos: result.rows,
      });
    } catch (error) {
      console.error("Erro ao listar atendimentos:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao listar atendimentos",
      });
    }
  }

  // BUSCAR POR ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT a.*, i.rua, i.numero, i.bairro, i.cidade, i.preco
         FROM atendimentos a
         LEFT JOIN imoveis i ON a.imovel_id = i.id
         WHERE a.id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Atendimento não encontrado",
        });
      }

      res.json({
        success: true,
        atendimento: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao buscar atendimento:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao buscar atendimento",
      });
    }
  }

  // CRIAR
  async criar(req, res) {
    try {
      const {
        imovel_id,
        nome_cliente,
        telefone,
        email,
        mensagem,
        status,
        origem,
      } = req.body;

      // Validações
      if (!nome_cliente || !telefone) {
        return res.status(400).json({
          error: true,
          message: "Nome e telefone são obrigatórios",
        });
      }

      const query = `
        INSERT INTO atendimentos (
          imovel_id, nome_cliente, telefone, email, mensagem, status, origem
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        imovel_id || null,
        nome_cliente,
        telefone,
        email,
        mensagem,
        status || "Novo",
        origem || "Site",
      ];

      const result = await db.query(query, values);

      res.status(201).json({
        success: true,
        message: "Atendimento criado com sucesso",
        atendimento: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao criar atendimento:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao criar atendimento",
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
        "SELECT id FROM atendimentos WHERE id = $1",
        [id],
      );

      if (existente.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Atendimento não encontrado",
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
        UPDATE atendimentos 
        SET ${campos.join(", ")}
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await db.query(query, valores);

      res.json({
        success: true,
        message: "Atendimento atualizado com sucesso",
        atendimento: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao atualizar atendimento:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao atualizar atendimento",
      });
    }
  }

  // DELETAR
  async deletar(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query(
        "DELETE FROM atendimentos WHERE id = $1 RETURNING id",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Atendimento não encontrado",
        });
      }

      res.json({
        success: true,
        message: "Atendimento deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar atendimento:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao deletar atendimento",
      });
    }
  }
}

module.exports = new AtendimentosController();
