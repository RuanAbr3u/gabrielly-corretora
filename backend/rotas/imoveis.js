const express = require("express");
const router = express.Router();
const imoveisController = require("../controladores/imoveiscontroller");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

// Rotas públicas (para site)
router.get("/", imoveisController.listar);
router.get("/estatisticas", imoveisController.estatisticas);
router.get("/:id", imoveisController.buscarPorId);

// Rotas protegidas (para admin)
router.post(
  "/",
  authMiddleware,
  upload.array("imagens", 10),
  imoveisController.criar,
);
router.put(
  "/:id",
  authMiddleware,
  upload.array("imagens", 10),
  imoveisController.atualizar,
);
router.delete("/:id", authMiddleware, imoveisController.deletar);

module.exports = router;
