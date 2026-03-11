const express = require("express");
const router = express.Router();
const atendimentosController = require("../controladores/atendimentoscontroller");
const authMiddleware = require("../middleware/auth");

// Rota pública para criar atendimento (formulário do site)
router.post("/", atendimentosController.criar);

// Rotas protegidas (apenas admin)
router.get("/", authMiddleware, atendimentosController.listar);
router.get("/:id", authMiddleware, atendimentosController.buscarPorId);
router.put("/:id", authMiddleware, atendimentosController.atualizar);
router.delete("/:id", authMiddleware, atendimentosController.deletar);

module.exports = router;
