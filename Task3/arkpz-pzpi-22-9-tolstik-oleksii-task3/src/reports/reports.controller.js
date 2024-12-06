import { Router } from 'express';
import { ReportService } from './reports.service.js';

const router = Router();
const reportService = new ReportService();

// звіт про видачу ліків для пацієнта
router.get('/medication-distribution/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const report = await reportService.generateMedicationDistributionReport(req.db, Number(patientId));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="medication_distribution_report.docx"`);
        res.send(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//  звіт про залишки ліків на складі
router.get('/medication-stock', async (req, res) => {
    try {
        const report = await reportService.generateStockReport(req.db);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="medication_stock_report.docx"`);
        res.send(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const reportRouter = router;
