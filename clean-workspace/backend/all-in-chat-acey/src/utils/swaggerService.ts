import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { EnvironmentService } from '../config/environment';

export interface SwaggerConfig {
  definition: {
    openapi: string;
    info: {
      title: string;
      version: string;
      description: string;
      contact: {
        name: string;
        email: string;
        url: string;
      };
      license: {
        name: string;
        url: string;
      };
    };
    servers: Array<{
      url: string;
      description: string;
    }>;
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http';
          scheme: 'bearer';
          bearerFormat: 'JWT';
        };
      };
      schemas: {
        User: any;
        Error: any;
        HealthCheck: any;
        ServiceHealth: any;
        SystemHealth: any;
        HealthMetrics: any;
        Notification: any;
        MeshMessage: any;
      };
    };
    tags: Array<{
      name: string;
      description: string;
    }>;
  };
  apis: string[];
}

export class SwaggerService {
  private static instance: SwaggerService;
  private environmentService: EnvironmentService;
  private swaggerConfig: SwaggerConfig;

  private constructor() {
    this.environmentService = EnvironmentService.getInstance();
    this.swaggerConfig = this.createSwaggerConfig();
  }

  public static getInstance(): SwaggerService {
    if (!SwaggerService.instance) {
      SwaggerService.instance = new SwaggerService();
    }
    return SwaggerService.instance;
  }

  private createSwaggerConfig(): SwaggerConfig {
    const isProduction = this.environmentService.isProduction();
    const appConfig = this.environmentService.getAppConfig();

    return {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Acey Control Center API',
          version: appConfig.environment === 'production' ? '1.0.0' : '1.0.0-dev',
          description: `
            ## Acey Control Center API Documentation
            
            This API provides access to the Acey Control Center backend services, including:
            - User authentication and authorization
            - Real-time mesh communication
            - Push notifications (FCM/APNS)
            - System monitoring and health checks
            - Business operations and governance
            
            ### Authentication
            Most endpoints require JWT authentication. Include the token in the Authorization header:
            \`Authorization: Bearer <your-jwt-token>\`
            
            ### Rate Limiting
            API requests are rate-limited to ensure fair usage.
            - Development: 100 requests per 15 minutes
            - Production: 50 requests per 15 minutes
            
            ### Error Handling
            All errors follow a consistent format:
            \`\`\`json
            {
              "success": false,
              "error": {
                "code": "ERROR_CODE",
                "message": "Human-readable error message",
                "timestamp": "2024-01-01T00:00:00.000Z",
                "requestId": "req_1234567890_abcdef"
              },
              "metadata": {
                "environment": "production",
                "version": "1.0.0"
              }
            }
            \`\`\`
          `,
          contact: {
            name: 'Acey Support',
            email: 'support@acey-control-center.com',
            url: 'https://acey-control-center.com/support',
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          {
            url: isProduction ? 'https://api.acey-control-center.com' : `http://localhost:${appConfig.port}`,
            description: isProduction ? 'Production server' : 'Development server',
          },
          {
            url: 'https://staging-api.acey-control-center.com',
            description: 'Staging server',
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
              required: ['id', 'email', 'role'],
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  description: 'Unique user identifier',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email address',
                },
                role: {
                  type: 'string',
                  enum: ['owner', 'finance', 'legal', 'dev', 'partner'],
                  description: 'User role in the system',
                },
                tier: {
                  type: 'string',
                  enum: ['core', 'pro', 'enterprise'],
                  description: 'User subscription tier',
                },
                isActive: {
                  type: 'boolean',
                  description: 'Whether the user account is active',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Account creation timestamp',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last update timestamp',
                },
              },
            },
            Error: {
              type: 'object',
              required: ['success', 'error'],
              properties: {
                success: {
                  type: 'boolean',
                  enum: [false],
                  description: 'Always false for error responses',
                },
                error: {
                  type: 'object',
                  required: ['code', 'message'],
                  properties: {
                    code: {
                      type: 'string',
                      description: 'Machine-readable error code',
                    },
                    message: {
                      type: 'string',
                      description: 'Human-readable error message',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Error occurrence timestamp',
                    },
                    requestId: {
                      type: 'string',
                      description: 'Request identifier for debugging',
                    },
                    details: {
                      type: 'object',
                      description: 'Additional error details (development only)',
                    },
                  },
                },
                metadata: {
                  type: 'object',
                  properties: {
                    environment: {
                      type: 'string',
                      description: 'Server environment',
                    },
                    version: {
                      type: 'string',
                      description: 'API version',
                    },
                    correlationId: {
                      type: 'string',
                      description: 'Correlation identifier',
                    },
                  },
                },
              },
            },
            HealthCheck: {
              type: 'object',
              required: ['status', 'timestamp', 'uptime', 'version', 'environment', 'services', 'system', 'metrics'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['healthy', 'unhealthy', 'degraded'],
                  description: 'Overall system health status',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Health check timestamp',
                },
                uptime: {
                  type: 'number',
                  description: 'System uptime in milliseconds',
                },
                version: {
                  type: 'string',
                  description: 'Application version',
                },
                environment: {
                  type: 'string',
                  description: 'Current environment',
                },
                services: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ServiceHealth',
                  },
                  description: 'Individual service health status',
                },
                system: {
                  $ref: '#/components/schemas/SystemHealth',
                  description: 'System resource health',
                },
                metrics: {
                  $ref: '#/components/schemas/HealthMetrics',
                  description: 'Application metrics',
                },
              },
            },
            ServiceHealth: {
              type: 'object',
              required: ['name', 'status', 'lastCheck'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Service name',
                },
                status: {
                  type: 'string',
                  enum: ['healthy', 'unhealthy', 'degraded'],
                  description: 'Service health status',
                },
                responseTime: {
                  type: 'number',
                  description: 'Service response time in milliseconds',
                },
                lastCheck: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Last health check timestamp',
                },
                error: {
                  type: 'string',
                  description: 'Error message if service is unhealthy',
                },
                details: {
                  type: 'object',
                  description: 'Additional service details',
                },
              },
            },
            SystemHealth: {
              type: 'object',
              required: ['memory', 'cpu', 'disk'],
              properties: {
                memory: {
                  type: 'object',
                  required: ['used', 'total', 'percentage'],
                  properties: {
                    used: {
                      type: 'number',
                      description: 'Memory used in bytes',
                    },
                    total: {
                      type: 'number',
                      description: 'Total memory in bytes',
                    },
                    percentage: {
                      type: 'number',
                      description: 'Memory usage percentage',
                    },
                  },
                },
                cpu: {
                  type: 'object',
                  required: ['usage'],
                  properties: {
                    usage: {
                      type: 'number',
                      description: 'CPU usage percentage',
                    },
                  },
                },
                disk: {
                  type: 'object',
                  required: ['used', 'total', 'percentage'],
                  properties: {
                    used: {
                      type: 'number',
                      description: 'Disk used in bytes',
                    },
                    total: {
                      type: 'number',
                      description: 'Total disk space in bytes',
                    },
                    percentage: {
                      type: 'number',
                      description: 'Disk usage percentage',
                    },
                  },
                },
              },
            },
            HealthMetrics: {
              type: 'object',
              required: ['activeConnections', 'requestsPerMinute', 'errorRate', 'averageResponseTime', 'websocketConnections', 'meshInstances'],
              properties: {
                activeConnections: {
                  type: 'number',
                  description: 'Number of active connections',
                },
                requestsPerMinute: {
                  type: 'number',
                  description: 'Requests per minute',
                },
                errorRate: {
                  type: 'number',
                  description: 'Error rate percentage',
                },
                averageResponseTime: {
                  type: 'number',
                  description: 'Average response time in milliseconds',
                },
                websocketConnections: {
                  type: 'number',
                  description: 'Number of WebSocket connections',
                },
                meshInstances: {
                  type: 'number',
                  description: 'Number of active mesh instances',
                },
              },
            },
            Notification: {
              type: 'object',
              required: ['title', 'body', 'type'],
              properties: {
                title: {
                  type: 'string',
                  description: 'Notification title',
                },
                body: {
                  type: 'string',
                  description: 'Notification body/message',
                },
                type: {
                  type: 'string',
                  enum: ['info', 'warning', 'error', 'success'],
                  description: 'Notification type',
                },
                data: {
                  type: 'object',
                  description: 'Additional notification data',
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'normal', 'low'],
                  description: 'Notification priority',
                },
                ttl: {
                  type: 'number',
                  description: 'Time to live in seconds',
                },
              },
            },
            MeshMessage: {
              type: 'object',
              required: ['type', 'payload', 'timestamp'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['skill_execution', 'payout_request', 'security_alert', 'partner_update'],
                  description: 'Message type',
                },
                payload: {
                  type: 'object',
                  description: 'Message payload',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Message timestamp',
                },
                sender: {
                  type: 'string',
                  description: 'Message sender identifier',
                },
                recipient: {
                  type: 'string',
                  description: 'Message recipient identifier',
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'normal', 'low'],
                  description: 'Message priority',
                },
              },
            },
          },
        },
        tags: [
          {
            name: 'Authentication',
            description: 'User authentication and authorization endpoints',
          },
          {
            name: 'Users',
            description: 'User management endpoints',
          },
          {
            name: 'Health',
            description: 'System health and monitoring endpoints',
          },
          {
            name: 'Notifications',
            description: 'Push notification endpoints',
          },
          {
            name: 'WebSocket',
            description: 'WebSocket connection endpoints',
          },
          {
            name: 'Mesh',
            description: 'Mesh network communication endpoints',
          },
          {
            name: 'Monitoring',
            description: 'System monitoring and metrics endpoints',
          },
        ],
      },
      apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/middleware/*.ts',
      ],
    };
  }

  public getSwaggerSpec(): any {
    return swaggerJsdoc(this.swaggerConfig);
  }

  public setupSwagger(app: Application): void {
    if (!this.environmentService.isProduction()) {
      const specs = this.getSwaggerSpec();
      
      // Swagger UI configuration
      app.use('/api-docs', swaggerUi.serve);
      app.get('/api-docs', swaggerUi.setup(specs, {
        explorer: true,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          docExpansion: 'none',
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2,
        },
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Acey Control Center API Documentation',
      }));

      // JSON spec endpoint
      app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
      });

      // OpenAPI spec endpoint
      app.get('/openapi.yaml', (req, res) => {
        res.setHeader('Content-Type', 'application/yaml');
        const yaml = require('yamljs');
        res.send(yaml.stringify(specs));
      });
    }
  }

  public getApiDocumentation(): {
    title: string;
    version: string;
    description: string;
    servers: Array<{ url: string; description: string }>;
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      tags: string[];
      authentication: boolean;
    }>;
  } {
    const spec = this.getSwaggerSpec();
    const endpoints: Array<any> = [];

    // Extract endpoints from OpenAPI spec
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathItem as any)) {
          if (typeof operation === 'object' && operation !== null && 'operationId' in operation) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              description: (operation as any).summary || (operation as any).description || '',
              tags: (operation as any).tags || [],
              authentication: (operation as any).security ? true : false,
            });
          }
        }
      }
    }

    return {
      title: spec.info.title,
      version: spec.info.version,
      description: spec.info.description,
      servers: spec.servers,
      endpoints,
    };
  }

  public validateApiSpec(): {
    valid: boolean;
    errors: Array<{
      path: string;
      message: string;
    }>;
  } {
    const spec = this.getSwaggerSpec();
    const errors: Array<{ path: string; message: string }> = [];

    // Basic validation
    if (!spec.info) {
      errors.push({ path: 'info', message: 'Missing info object' });
    }

    if (!spec.paths) {
      errors.push({ path: 'paths', message: 'Missing paths object' });
    }

    if (!spec.components) {
      errors.push({ path: 'components', message: 'Missing components object' });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default SwaggerService;
