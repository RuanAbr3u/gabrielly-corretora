const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// Inicializar Resend (substitui Nodemailer/Gmail)
const resend = new Resend(process.env.RESEND_API_KEY);

// Enviar email de contato
const enviarContato = async (req, res) => {
  try {
    const { nome, email, telefone, assunto, mensagem } = req.body;

    // Validação básica
    if (!nome || !email || !assunto || !mensagem) {
      return res.status(400).json({
        error: true,
        message: "Nome, email, assunto e mensagem são obrigatórios",
      });
    }

    // Salvar contato no Supabase
    const { data: contatoSalvo, error: erroSupabase } = await supabase
      .from("contatos")
      .insert([
        {
          nome,
          email,
          telefone: telefone || null,
          assunto,
          mensagem,
          lido: false,
        },
      ])
      .select()
      .single();

    if (erroSupabase) {
      console.error("❌ Erro ao salvar contato no Supabase:", erroSupabase);
      return res.status(500).json({
        success: false,
        error: true,
        message: "Erro ao salvar contato. Tente novamente.",
      });
    }

    console.log("✅ Contato salvo no Supabase:", contatoSalvo.id);

    // Enviar emails usando Resend
    const htmlEmailNotificacao = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3a1a1a 0%, #2d1010 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; color: #c9a961;">Novo Contato - Gabrielly Silva</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">${assunto}</h2>
          
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ""}
          
          <hr style="border: none; border-top: 1px solid #c9a961; margin: 20px 0;">
          
          <div style="background: white; padding: 15px; border-left: 4px solid #c9a961; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
            <p style="color: #666; white-space: pre-wrap; line-height: 1.6;">${mensagem}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este é um email automatizado do formulário de contato do site Gabrielly Silva Corretora.
          </p>
        </div>
      </div>
    `;

    const htmlEmailConfirmacao = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3a1a1a 0%, #2d1010 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; color: #c9a961;">Obrigada pelo Contato!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <p>Olá ${nome},</p>
          
          <p>Recebemos sua mensagem com sucesso! Gabrielly entrará em contato com você em breve através do email <strong>${email}</strong>${telefone ? ` ou telefone <strong>${telefone}</strong>` : ""}.</p>
          
          <div style="background: white; padding: 15px; border-left: 4px solid #c9a961; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Resumo do seu contato:</h3>
            <p><strong>Assunto:</strong> ${assunto}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ""}
          </div>
          
          <p>Enquanto isso, você pode:</p>
          <ul>
            <li>Explorar nossos <a href="https://gabriellycorretora.vercel.app/tela-inicial/servicos.html" style="color: #c9a961;">serviços</a></li>
            <li>Analisar nossos <a href="https://gabriellycorretora.vercel.app/tela-inicial/vendas.html" style="color: #c9a961;">imóveis à venda</a></li>
            <li>Verificar <a href="https://gabriellycorretora.vercel.app/tela-inicial/locacao.html" style="color: #c9a961;">imóveis para locação</a></li>
          </ul>
          
          <p>Para dúvidas urgentes, entre em contato via <a href="https://wa.me/557592112142" style="color: #c9a961;">WhatsApp</a>.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Gabrielly Silva - Corretora de Imóveis CRECI 26.012
          </p>
        </div>
      </div>
    `;

    // Enviar emails usando Resend
    try {
      await resend.batch.send([
        {
          from: "Gabrielly Silva <onboarding@resend.dev>",
          to: ["Gabriellycorretora1@gmail.com"],
          subject: `📬 Novo Contato: ${assunto}`,
          html: htmlEmailNotificacao,
          reply_to: email,
        },
        {
          from: "Gabrielly Silva <onboarding@resend.dev>",
          to: [email],
          subject: "✅ Mensagem Recebida - Gabrielly Silva",
          html: htmlEmailConfirmacao,
        },
      ]);

      console.log("✅ Emails enviados com sucesso via Resend");

      return res.status(200).json({
        success: true,
        message:
          "✅ Mensagem enviada com sucesso! Verifique seu email para confirmação.",
        contatoId: contatoSalvo.id,
      });
    } catch (emailError) {
      console.error("❌ Erro ao enviar email via Resend:", emailError);

      // Mesmo se o email falhar, retorna sucesso pois foi salvo no banco
      return res.status(200).json({
        success: true,
        message:
          "Mensagem recebida com sucesso! Entraremos em contato em breve.",
        contatoId: contatoSalvo.id,
        warning: "Email de confirmação pode ter falhado.",
      });
    }
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return res.status(500).json({
      error: true,
      message: "Erro ao enviar mensagem. Tente novamente mais tarde.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  enviarContato,
};
