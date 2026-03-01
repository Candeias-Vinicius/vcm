const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Valorant Custom Manager API',
      version: '1.0.0',
      description:
        'API para gerenciamento de partidas personalizadas de Valorant. ' +
        'Autenticação via cookie HttpOnly (`vcm_token`) retornado nos endpoints de login/register.',
    },
    servers: [{ url: '/api', description: 'Servidor atual' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'vcm_token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            nick: { type: 'string', example: 'ProPlayer' },
            email: { type: 'string', format: 'email', example: 'player@vcm.com' },
          },
        },
        Player: {
          type: 'object',
          properties: {
            nick: { type: 'string' },
            is_present: { type: 'boolean' },
            is_adm: { type: 'boolean' },
          },
        },
        WaitlistEntry: {
          type: 'object',
          properties: {
            nick: { type: 'string' },
            joined_at: { type: 'string', format: 'date-time' },
          },
        },
        Lobby: {
          type: 'object',
          properties: {
            lobby_id: { type: 'string', format: 'uuid' },
            adm_user_id: { type: 'string' },
            status: { type: 'string', enum: ['active', 'cancelled'] },
            config: {
              type: 'object',
              properties: {
                mapa: { type: 'string', example: 'Haven' },
                data_hora: { type: 'string', format: 'date-time' },
                total_partidas: { type: 'integer', example: 3 },
                max_players: { type: 'integer', minimum: 2, maximum: 10, example: 10 },
                adm_nick: { type: 'string' },
                adm_is_player: { type: 'boolean' },
              },
            },
            players: { type: 'array', items: { $ref: '#/components/schemas/Player' } },
            waitlist: { type: 'array', items: { $ref: '#/components/schemas/WaitlistEntry' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensagem de erro' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
