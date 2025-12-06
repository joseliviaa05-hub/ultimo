"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = __importDefault(require("../controllers/statsController"));
const router = (0, express_1.Router)();
router.get('/', statsController_1.default.getStats.bind(statsController_1.default));
exports.default = router;
//# sourceMappingURL=stats.routes.js.map