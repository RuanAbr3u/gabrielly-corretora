// Controlador para gerenciar contatos via Formspree
// O Formspree envia emails para: Gabriellycorretora1@gmail.com

const receberContato = async (req, res) => {
  try {
    const { nome, email, telefone, assunto, mensagem } = req.body;

    // Validação básica
    if (!nome || !email || !assunto || !mensagem) {
      return res.status(400).json({
        error: true,
        message: "Nome, email, assunto e mensagem são obrigatórios",
      });
    }

    console.log("📧 Contato recebido:", {
      nome,
      email,
      telefone,
      assunto,
      mensagem,
      recebidoEm: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message:
        "✅ Mensagem enviada com sucesso! Em breve entraremos em contato.",
    });
  } catch (error) {
    console.error("Erro ao processar contato:", error);
    return res.status(500).json({
      error: true,
      message: "Erro ao processar mensagem. Tente novamente.",
    });
  }
};

module.exports = {
  receberContato,
};
