import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLog } from '@prisma/client';
import { QueryAuditLogsDto } from './dto';

/**
 * Audit log with user details
 */
export interface AuditLogWithUser extends AuditLog {
  user: {
    email: string;
  } | null;
}

/**
 * Paginated audit logs response
 */
export interface PaginatedAuditLogsResponse {
  items: AuditLogWithUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * AuditLogsService - Handles audit log retrieval business logic
 */
@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List all audit logs with filtering, sorting, and pagination (BE-7.1)
   * Admin only - returns audit logs with user details
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated audit logs response
   */
  async findAll(query: QueryAuditLogsDto): Promise<PaginatedAuditLogsResponse> {
    const {
      userId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = query;

    // Build where clause based on filters
    interface WhereClause {
      userId?: string;
      action?: string;
      entityType?: string;
      entityId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }

      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [auditLogsData, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    this.logger.log(
      `Listed ${auditLogsData.length} audit logs (page ${page}/${totalPages}, total ${total})`,
    );

    return {
      items: auditLogsData as AuditLogWithUser[],
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
