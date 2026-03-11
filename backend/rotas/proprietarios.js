const express = require("express");
const router = express.Router();
const proprietariosController = require("../controladores/proprietarioscontroller");
const authMiddleware = require("../middleware/auth");

// Todas as rotas protegidas (apenas admin)
router.use(authMiddleware);

router.get("/", proprietariosController.listar);
router.get("/:id", proprietariosController.buscarPorId);
router.post("/", proprietariosController.criar);
router.put("/:id", proprietariosController.atualizar);
router.delete("/:id", proprietariosController.deletar);

module.exports = router;
