"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsappController_1 = __importDefault(require("../controllers/whatsappController"));
const router = (0, express_1.Router)();
router.post('/send', whatsappController_1.default.sendMessage.bind(whatsappController_1.default));
router.post('/send-image', whatsappController_1.default.sendImage.bind(whatsappController_1.default));
router.get('/status', whatsappController_1.default.getStatus.bind(whatsappController_1.default));
exports.default = router;
//# sourceMappingURL=whatsapp.routes.js.map