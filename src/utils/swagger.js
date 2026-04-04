const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const PORT = process.env.PORT || 8000;
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinTrack API Documentation',
      version: '1.0.0',
      description: 'The interactive API documentation for the FinTrack financial dashboard project.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'ANALYST', 'VIEWER'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'string' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            transactionDate: { type: 'string', format: 'date' },
            description: { type: 'string' },
            createdBy: { type: 'string' },
          },
        },
        ImportJob: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED'] },
            filename: { type: 'string' },
            totalRows: { type: 'integer' },
            savedCount: { type: 'integer' },
            failedCount: { type: 'integer' },
            errorLog: { type: 'array', items: { type: 'object' } },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        DashboardSummary: {
          type: 'object',
          properties: {
            totalIncome: { type: 'string' },
            totalExpenses: { type: 'string' },
            netBalance: { type: 'string' },
            transactionCount: { type: 'integer' },
            period: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date', nullable: true },
                to: { type: 'string', format: 'date', nullable: true },
              },
            },
          },
        },
        DashboardCategoryTrends: {
          type: 'object',
          properties: {
            groupBy: { type: 'string', enum: ['monthly', 'weekly'] },
            period: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' },
              },
            },
            labels: { type: 'array', items: { type: 'string' } },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  income: { type: 'array', items: { type: 'number' } },
                  expense: { type: 'array', items: { type: 'number' } },
                },
              },
            },
          },
        },
        DashboardInsights: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' },
              },
            },
            overall: {
              type: 'object',
              properties: {
                totalIncome: { type: 'string' },
                totalExpenses: { type: 'string' },
                net: { type: 'string' },
                result: { type: 'string', enum: ['profit', 'loss', 'break-even'] },
                transactionCount: { type: 'integer' },
                summary: { type: 'string' },
              },
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  totalIncome: { type: 'string' },
                  totalExpenses: { type: 'string' },
                  net: { type: 'string' },
                  result: { type: 'string', enum: ['profit', 'loss', 'break-even'] },
                  transactionCount: { type: 'integer' },
                  summary: { type: 'string' },
                },
              },
            },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DashboardComparison: {
          type: 'object',
          properties: {
            currentPeriod: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                totalIncome: { type: 'string' },
                totalExpenses: { type: 'string' },
                netBalance: { type: 'string' },
              },
            },
            previousPeriod: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                totalIncome: { type: 'string' },
                totalExpenses: { type: 'string' },
                netBalance: { type: 'string' },
              },
            },
            changes: {
              type: 'object',
              properties: {
                incomeChange: { type: 'string', nullable: true },
                expenseChange: { type: 'string', nullable: true },
                netChange: { type: 'string', nullable: true },
                incomeDirection: { type: 'string', enum: ['up', 'down', 'neutral'] },
                expenseDirection: { type: 'string', enum: ['up', 'down', 'neutral'] },
                netDirection: { type: 'string', enum: ['up', 'down', 'neutral'] },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./docs/swagger/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
