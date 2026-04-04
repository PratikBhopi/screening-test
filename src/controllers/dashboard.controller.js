const dashboardService = require('../services/dashboard.service');
const {
  summaryQuerySchema,
  categoryQuerySchema,
  categoryTrendsQuerySchema,
  insightsQuerySchema,
  compareQuerySchema
} = require('../validations/dashboard.validation');
const { parseRequest } = require('../utils/parseRequest');
const AppError = require('../errors/AppError');

/**
 * GET /api/v1/dashboard/summary
 * Total income, expenses, net balance, and transaction count.
 * Accepts optional startDate / endDate query params.
 */
const getSummary = async (req, res, next) => {
  try {
    const data = parseRequest(summaryQuerySchema, req.query);
    const result = await dashboardService.getSummary(data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch summary', 500));
  }
};

/**
 * GET /api/v1/dashboard/categories
 * Per-category totals with percentage of grand total.
 */
const getCategories = async (req, res, next) => {
  try {
    const data = parseRequest(categoryQuerySchema, req.query);
    const result = await dashboardService.getCategoryBreakdown(data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch category breakdown', 500));
  }
};

/**
 * GET /api/v1/dashboard/categories/trends
 * Time-series income/expense per category, grouped by month or week.
 */
const getCategoryTrends = async (req, res, next) => {
  try {
    const data = parseRequest(categoryTrendsQuerySchema, req.query);
    const result = await dashboardService.getCategoryTrends(data.from, data.to, data.groupBy);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch category trends', 500));
  }
};

/**
 * GET /api/v1/dashboard/insights
 * Per-category profit/loss breakdown with plain-English summaries.
 */
const getInsights = async (req, res, next) => {
  try {
    const data = parseRequest(insightsQuerySchema, req.query);
    const result = await dashboardService.getInsights(data.startDate, data.endDate);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch insights', 500));
  }
};

/**
 * GET /api/v1/dashboard/compare
 * Compares current vs previous period (monthly, weekly, or quarterly).
 */
const getComparison = async (req, res, next) => {
  try {
    const data = parseRequest(compareQuerySchema, req.query);
    const result = await dashboardService.getComparison(data.period, data.date);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch comparison', 500));
  }
};

/**
 * GET /api/v1/dashboard
 * All dashboard blocks in one request.
 * VIEWER gets summary only — other blocks are not computed for that role.
 */
const getFullDashboard = async (req, res, next) => {
  try {
    const params = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      type: req.query.type,
      period: req.query.period,
      count: req.query.count ? parseInt(req.query.count, 10) : undefined,
      recentLimit: req.query.recentLimit ? parseInt(req.query.recentLimit, 10) : undefined
    };
    const data = await dashboardService.getFullDashboard(params, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err.isOperational ? err : new AppError('Failed to fetch dashboard', 500));
  }
};

module.exports = { getSummary, getCategories, getCategoryTrends, getInsights, getComparison, getFullDashboard };
