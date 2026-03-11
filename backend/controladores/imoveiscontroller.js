const db = require("../configuração/database");
const fs = require("fs").promises;
const path = require("path");

class ImoveisController {
  // LISTAR TODOS OS IMÓVEIS
  async listar(req, res) {
    try {
      const {
        tipo_negocio,
        categoria,
        bairro,
        disponibilidade,
        preco_min,
        preco_max,
      } = req.query;

      let query = "SELECT * FROM imoveis WHERE 1=1";
      const params = [];
      let paramIndex = 1;

      if (tipo_negocio) {
        query += ` AND tipo_negocio = $${paramIndex}`;
        params.push(tipo_negocio);
        paramIndex++;
      }

      if (categoria) {
        query += ` AND categoria = $${paramIndex}`;
        params.push(categoria);
        paramIndex++;
      }

      if (bairro) {
        query += ` AND bairro ILIKE $${paramIndex}`;
        params.push(`%${bairro}%`);
        paramIndex++;
      }

      if (disponibilidade) {
        query += ` AND disponibilidade = $${paramIndex}`;
        params.push(disponibilidade);
        paramIndex++;
      }

      if (preco_min) {
        query += ` AND preco >= $${paramIndex}`;
        params.push(parseFloat(preco_min));
        paramIndex++;
      }

      if (preco_max) {
        query += ` AND preco <= $${paramIndex}`;
        params.push(parseFloat(preco_max));
        paramIndex++;
      }

      query += " ORDER BY criado_em DESC";

      const result = await db.query(query, params);

      res.json({
        success: true,
        total: result.rows.length,
        imoveis: result.rows,
      });
    } catch (error) {
      console.error("Erro ao listar imóveis:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao listar imóveis",
      });
    }
  }

  // BUSCAR IMÓVEL POR ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      const result = await db.query("SELECT * FROM imoveis WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Imóvel não encontrado",
        });
      }

      res.json({
        success: true,
        imovel: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao buscar imóvel:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao buscar imóvel",
      });
    }
  }

  // CRIAR NOVO IMÓVEL
  async criar(req, res) {
    try {
      const {
        proprietario_id,
        tipo_negocio,
        categoria,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        quartos,
        suites,
        banheiros,
        garagem,
        vagas_garagem,
        area_util,
        area_total,
        preco,
        valor_condominio,
        valor_iptu,
        descricao,
        disponibilidade,
        caracteristicas,
      } = req.body;

      // Processar imagens
      const imagens = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];

      const query = `
        INSERT INTO imoveis (
          proprietario_id, tipo_negocio, categoria, cep, rua, numero, complemento,
          bairro, cidade, estado, quartos, suites, banheiros, garagem, vagas_garagem,
          area_util, area_total, preco, valor_condominio, valor_iptu, descricao,
          disponibilidade, imagens, caracteristicas
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24
        ) RETURNING *
      `;

      const values = [
        proprietario_id || null,
        tipo_negocio,
        categoria,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        parseInt(quartos) || 0,
        parseInt(suites) || 0,
        parseInt(banheiros) || 0,
        garagem,
        parseInt(vagas_garagem) || 0,
        parseFloat(area_util) || null,
        parseFloat(area_total) || null,
        parseFloat(preco),
        parseFloat(valor_condominio) || null,
        parseFloat(valor_iptu) || null,
        descricao,
        disponibilidade || "Disponível",
        JSON.stringify(imagens),
        caracteristicas ? JSON.stringify(caracteristicas) : JSON.stringify([]),
      ];

      const result = await db.query(query, values);

      res.status(201).json({
        success: true,
        message: "Imóvel criado com sucesso",
        imovel: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao criar imóvel:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao criar imóvel",
      });
    }
  }

  // ATUALIZAR IMÓVEL
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;

      // Verificar se imóvel existe
      const imovelExistente = await db.query(
        "SELECT * FROM imoveis WHERE id = $1",
        [id],
      );

      if (imovelExistente.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Imóvel não encontrado",
        });
      }

      // Processar novas imagens se enviadas
      if (req.files && req.files.length > 0) {
        const novasImagens = req.files.map(
          (file) => `/uploads/${file.filename}`,
        );
        const imagensAtuais = JSON.parse(
          imovelExistente.rows[0].imagens || "[]",
        );
        dados.imagens = JSON.stringify([...imagensAtuais, ...novasImagens]);
      }

      // Construir query dinâmica
      const campos = [];
      const valores = [];
      let index = 1;

      for (const [key, value] of Object.entries(dados)) {
        if (value !== undefined && value !== null && value !== "") {
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
        UPDATE imoveis 
        SET ${campos.join(", ")}
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await db.query(query, valores);

      res.json({
        success: true,
        message: "Imóvel atualizado com sucesso",
        imovel: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao atualizar imóvel:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao atualizar imóvel",
      });
    }
  }

  // DELETAR IMÓVEL
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Buscar imagens para deletar
      const imovel = await db.query(
        "SELECT imagens FROM imoveis WHERE id = $1",
        [id],
      );

      if (imovel.rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Imóvel não encontrado",
        });
      }

      // Deletar imagens do disco
      const imagens = JSON.parse(imovel.rows[0].imagens || "[]");
      for (const imagemUrl of imagens) {
        const filename = imagemUrl.replace("/uploads/", "");
        const filepath = path.join(__dirname, "..", "uploads", filename);
        try {
          await fs.unlink(filepath);
        } catch (err) {
          console.log("Erro ao deletar imagem:", err);
        }
      }

      // Deletar imóvel
      await db.query("DELETE FROM imoveis WHERE id = $1", [id]);

      res.json({
        success: true,
        message: "Imóvel deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar imóvel:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao deletar imóvel",
      });
    }
  }

  // ESTATÍSTICAS
  async estatisticas(req, res) {
    try {
      const result = await db.query("SELECT * FROM vw_estatisticas");

      res.json({
        success: true,
        estatisticas: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({
        error: true,
        message: "Erro ao buscar estatísticas",
      });
    }
  }
}

module.exports = new ImoveisController();
