import { httpClient } from "./http";

export interface Report {
  id: string;
  type: string;
  reason: string;
  reporterName: string;
  reporterAvatar?: string;
  targetName: string;
  targetType: "post" | "user" | "message" | "comment";
  targetId: string;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export interface ReportStats {
  totalReports: number;
  pendingReports: number;
  reviewingReports: number;
  resolvedReports: number;
  rejectedReports: number;
}

export const reportsApi = {
  /**
   * Get all reports
   */
  getAllReports: async (): Promise<Report[]> => {
    try {
      return await httpClient.get<Report[]>("/api/reports");
    } catch (error) {
      console.error("Failed to get reports:", error);
      throw error;
    }
  },

  /**
   * Get pending reports
   */
  getPendingReports: async (): Promise<Report[]> => {
    try {
      return await httpClient.get<Report[]>("/api/reports/pending");
    } catch (error) {
      console.error("Failed to get pending reports:", error);
      throw error;
    }
  },

  /**
   * Get report by ID
   */
  getReportById: async (id: string): Promise<Report> => {
    return httpClient.get<Report>(`/api/reports/${id}`);
  },

  /**
   * Create a new report
   */
  createReport: async (
    report: Omit<Report, "id" | "createdAt" | "status">,
  ): Promise<Report> => {
    return httpClient.post<Report>("/api/reports", report);
  },

  /**
   * Update report status
   */
  updateReportStatus: async (
    id: string,
    status: "pending" | "reviewing" | "resolved" | "rejected",
  ): Promise<any> => {
    return httpClient.put<any>(
      `/api/reports/${id}/status?status=${status}`,
      {},
    );
  },

  /**
   * Get report statistics
   */
  getReportStats: async (): Promise<ReportStats> => {
    try {
      return await httpClient.get<ReportStats>("/api/reports/stats");
    } catch (error) {
      console.error("Failed to get report stats:", error);
      throw error;
    }
  },
};
