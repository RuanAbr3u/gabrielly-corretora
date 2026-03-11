const express = require("express");
const router = express.Router();
const { enviarContato } = require("../controladores/contatocontroller");

// POST - Enviar mensagem de contato
router.post("/enviar", enviarContato);

module.exports = router;
