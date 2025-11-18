import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service.js";
import { successResponse } from "../../shared/utils/response.util.js";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getSellerSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const summary = await this.dashboardService.getSellerSummary(
        req.user!.id
      );
      successResponse(
        res,
        200,
        "Ringkasan dashboard seller berhasil diambil",
        summary
      );
    } catch (error) {
      next(error);
    }
  };

  getBuyerSummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const summary = await this.dashboardService.getBuyerSummary(req.user!.id);
      successResponse(
        res,
        200,
        "Ringkasan dashboard buyer berhasil diambil",
        summary
      );
    } catch (error) {
      next(error);
    }
  };
}
