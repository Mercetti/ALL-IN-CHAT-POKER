import { DatabaseService, QueryOptions } from './databaseService';
import { Logger } from '../utils/logger';
import { PoolClient, QueryResultRow } from 'pg';

export interface QueryBuilderOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface WhereCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
  values?: any[];
}

export interface OrderByCondition {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface JoinCondition {
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  on: string;
}

export class QueryBuilder {
  protected static instance: QueryBuilder;
  protected databaseService: DatabaseService;
  protected logger: Logger;

  protected constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.logger = new Logger();
  }

  public static getInstance(): QueryBuilder {
    if (!QueryBuilder.instance) {
      QueryBuilder.instance = new QueryBuilder();
    }
    return QueryBuilder.instance;
  }

  public select(table: string, columns: string[] = ['*'], options: QueryBuilderOptions = {}) {
    const query = this.buildSelectQuery(table, columns);
    return this.executeQuery(query.text, query.params, options);
  }

  public insert(table: string, data: Record<string, any>, options: QueryBuilderOptions = {}) {
    const query = this.buildInsertQuery(table, data);
    return this.executeQuery(query.text, query.params, options);
  }

  public update(table: string, data: Record<string, any>, where: WhereCondition[], options: QueryBuilderOptions = {}) {
    const query = this.buildUpdateQuery(table, data, where);
    return this.executeQuery(query.text, query.params, options);
  }

  public delete(table: string, where: WhereCondition[], options: QueryBuilderOptions = {}) {
    const query = this.buildDeleteQuery(table, where);
    return this.executeQuery(query.text, query.params, options);
  }

  public selectWithJoins(
    table: string,
    columns: string[],
    joins: JoinCondition[],
    where?: WhereCondition[],
    orderBy?: OrderByCondition[],
    limit?: number,
    offset?: number,
    options: QueryBuilderOptions = {}
  ) {
    const query = this.buildSelectWithJoinsQuery(table, columns, joins, where, orderBy, limit, offset);
    return this.executeQuery(query.text, query.params, options);
  }

  public count(table: string, where?: WhereCondition[], options: QueryBuilderOptions = {}) {
    const query = this.buildCountQuery(table, where);
    return this.executeQuery(query.text, query.params, options);
  }

  public exists(table: string, where: WhereCondition[], options: QueryBuilderOptions = {}) {
    const query = this.buildExistsQuery(table, where);
    return this.executeQuery(query.text, query.params, options);
  }

  public batch(queries: Array<{
    type: 'select' | 'insert' | 'update' | 'delete';
    table: string;
    columns?: string[];
    data?: Record<string, any>;
    where?: WhereCondition[];
    joins?: JoinCondition[];
    orderBy?: OrderByCondition[];
    limit?: number;
    offset?: number;
  }>, options: QueryBuilderOptions = {}) {
    const batchQueries = queries.map(q => {
      switch (q.type) {
        case 'select':
          return q.joins
            ? this.buildSelectWithJoinsQuery(q.table, q.columns || ['*'], q.joins, q.where, q.orderBy, q.limit, q.offset)
            : this.buildSelectQuery(q.table, q.columns || ['*'], q.where, q.orderBy, q.limit, q.offset);
        case 'insert':
          return this.buildInsertQuery(q.table, q.data!);
        case 'update':
          return this.buildUpdateQuery(q.table, q.data!, q.where!);
        case 'delete':
          return this.buildDeleteQuery(q.table, q.where!);
        default:
          throw new Error(`Unsupported query type: ${q.type}`);
      }
    });

    return this.databaseService.batch(batchQueries);
  }

  public async transaction<T>(
    callback: (queryBuilder: QueryBuilder) => Promise<T>
  ): Promise<T> {
    return this.databaseService.transaction(async (client) => {
      // Create a new QueryBuilder instance with client
      const transactionQueryBuilder = new TransactionQueryBuilder(client);
      const result = await callback(transactionQueryBuilder);
      // Return result directly - databaseService.transaction expects QueryResult format
      return result as any;
    });
  }

  protected async executeQuery(text: string, params: any[], options: QueryBuilderOptions = {}) {
    return this.databaseService.query(text, params, options);
  }

  private buildSelectQuery(
    table: string,
    columns?: string[],
    where?: WhereCondition[],
    orderBy?: OrderByCondition[],
    limit?: number,
    offset?: number
  ): { text: string; params: any[] } {
    const params: any[] = [];
    let query = `SELECT ${columns ? columns.join(', ') : '*'} FROM ${table}`;

    if (where && where.length > 0) {
      const { whereClause, params: whereParams } = this.buildWhereClause(where);
      query += ` WHERE ${whereClause}`;
      params.push(...whereParams);
    }

    if (orderBy && orderBy.length > 0) {
      const orderByClause = orderBy
        .map(ob => `${ob.column} ${ob.direction}`)
        .join(', ');
      query += ` ORDER BY ${orderByClause}`;
    }

    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
    }

    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }

    return { text: query, params };
  }

  private buildSelectWithJoinsQuery(
    table: string,
    columns: string[],
    joins: JoinCondition[],
    where?: WhereCondition[],
    orderBy?: OrderByCondition[],
    limit?: number,
    offset?: number
  ): { text: string; params: any[] } {
    const params: any[] = [];
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;

    // Add joins
    for (const join of joins) {
      query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }

    if (where && where.length > 0) {
      const { whereClause, params: whereParams } = this.buildWhereClause(where);
      query += ` WHERE ${whereClause}`;
      params.push(...whereParams);
    }

    if (orderBy && orderBy.length > 0) {
      const orderByClause = orderBy
        .map(ob => `${ob.column} ${ob.direction}`)
        .join(', ');
      query += ` ORDER BY ${orderByClause}`;
    }

    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
    }

    if (offset !== undefined) {
      query += ` OFFSET ${offset}`;
    }

    return { text: query, params };
  }

  private buildInsertQuery(table: string, data: Record<string, any>): { text: string; params: any[] } {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    return { text: query, params: values };
  }

  private buildUpdateQuery(table: string, data: Record<string, any>, where: WhereCondition[]): { text: string; params: any[] } {
    const params: any[] = [];
    const setClause = Object.entries(data)
      .map(([column, value], index) => {
        params.push(value);
        return `${column} = $${index + 1}`;
      })
      .join(', ');

    const { whereClause, params: whereParams } = this.buildWhereClause(where);
    params.push(...whereParams);

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    return { text: query, params: [...params, ...whereParams] };
  }

  private buildDeleteQuery(table: string, where: WhereCondition[]): { text: string; params: any[] } {
    const { whereClause, params: whereParams } = this.buildWhereClause(where);
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    return { text: query, params: whereParams };
  }

  private buildCountQuery(table: string, where?: WhereCondition[]): { text: string; params: any[] } {
    const params: any[] = [];
    let query = `SELECT COUNT(*) as count FROM ${table}`;

    if (where && where.length > 0) {
      const { whereClause, params: whereParams } = this.buildWhereClause(where);
      query += ` WHERE ${whereClause}`;
      params.push(...whereParams);
    }

    return { text: query, params };
  }

  private buildExistsQuery(table: string, where: WhereCondition[]): { text: string; params: any[] } {
    const { whereClause, params: whereParams } = this.buildWhereClause(where);
    const query = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${whereClause}) as exists`;
    return { text: query, params: whereParams };
  }

  private buildWhereClause(conditions: WhereCondition[]): { whereClause: string; params: any[] } {
    const params: any[] = [];
    const clauses: string[] = [];

    for (const condition of conditions) {
      let clause = '';
      
      switch (condition.operator) {
        case '=':
        case '!=':
        case '>':
        case '<':
        case '>=':
        case '<=':
        case 'LIKE':
          clause = `${condition.column} ${condition.operator} $${params.length + 1}`;
          params.push(condition.value);
          break;
        case 'IN':
        case 'NOT IN':
          const placeholders = condition.values!.map((_, index) => `$${params.length + index + 1}`).join(', ');
          clause = `${condition.column} ${condition.operator} (${placeholders})`;
          params.push(...condition.values!);
          break;
        case 'IS NULL':
          clause = `${condition.column} IS NULL`;
          break;
        case 'IS NOT NULL':
          clause = `${condition.column} IS NOT NULL`;
          break;
      }
      
      clauses.push(clause);
    }

    return {
      whereClause: clauses.join(' AND '),
      params,
    };
  }
}

class TransactionQueryBuilder extends QueryBuilder {
  private client: any;

  constructor(client: any) {
    super();
    this.client = client;
  }

  public async executeQuery(text: string, params: any[], options: QueryBuilderOptions = {}) {
    return this.client.query(text, params);
  }
}

export default QueryBuilder.getInstance();
