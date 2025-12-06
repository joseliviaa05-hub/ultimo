import { Router } from 'express';
import whatsappController from '../controllers/whatsappController';

const router = Router();

router.post('/send', whatsappController.sendMessage. bind(whatsappController));
router.post('/send-image', whatsappController.sendImage. bind(whatsappController));
router.get('/status', whatsappController.getStatus.bind(whatsappController));

export default router;