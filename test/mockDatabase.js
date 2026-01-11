jest.mock('../server/database', () => ({
  connect: jest.fn().mockResolvedValue(),
  query: jest.fn().mockResolvedValue({ version: '3.40.1' })
}));
