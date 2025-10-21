import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, MembershipStatus } from '@prisma/client';
import { QueryMembersDto, UpdateMemberDto, SuspendMemberDto } from './dto';

/**
 * Member list item with user data and statistics
 */
export interface MemberListItem {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: MembershipStatus;
  activeLoansCount: number;
  totalLoansCount: number;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Paginated response type for members
 */
export interface PaginatedMembers {
  items: MemberListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Member detail with full profile and statistics
 */
export interface MemberDetail {
  id: string;
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  status: MembershipStatus;
  notes: string | null;
  activeLoansCount: number;
  totalLoansCount: number;
  outstandingPenalties: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * MembersService - Handles all member management business logic
 * Implements list, detail, update, activate, and suspend operations
 */
@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List members with pagination, search, and filtering
   * Admin only endpoint
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of members with statistics
   */
  async findAll(query: QueryMembersDto): Promise<PaginatedMembers> {
    const { q, status, sortBy, sortOrder, page, pageSize } = query;

    // Build where clause for search and filter
    const where: Prisma.MemberProfileWhereInput = {
      ...(status && { status }),
      ...(q && {
        OR: [
          {
            firstName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            user: {
              email: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    };

    // Build orderBy clause
    // For user fields (email), we need to sort through relation
    const orderBy: Prisma.MemberProfileOrderByWithRelationInput =
      sortBy === 'email'
        ? { user: { email: sortOrder } }
        : { [sortBy]: sortOrder };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [profiles, total] = await Promise.all([
      this.prisma.memberProfile.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      this.prisma.memberProfile.count({ where }),
    ]);

    // Get loan statistics for all members in parallel
    const items = await Promise.all(
      profiles.map(async (profile) => {
        // Count active loans (APPROVED, ACTIVE, OVERDUE)
        const activeLoansCount = await this.prisma.loan.count({
          where: {
            userId: profile.userId,
            status: {
              in: ['APPROVED', 'ACTIVE', 'OVERDUE'],
            },
          },
        });

        // Count total loans (all statuses)
        const totalLoansCount = await this.prisma.loan.count({
          where: {
            userId: profile.userId,
          },
        });

        return {
          id: profile.id,
          userId: profile.user.id,
          email: profile.user.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          status: profile.status,
          activeLoansCount,
          totalLoansCount,
          createdAt: profile.createdAt,
          lastLoginAt: profile.user.lastLoginAt,
        };
      }),
    );

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Get member detail by profile ID
   * Admin only endpoint
   * Returns full member profile including statistics
   *
   * @param id Member profile UUID
   * @returns Member detail with statistics
   * @throws NotFoundException if member not found
   */
  async findOne(id: string): Promise<MemberDetail> {
    // Get member profile with user data
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!profile) {
      this.logger.warn(`Member profile not found: ${id}`);
      throw new NotFoundException('Member not found');
    }

    // Get loan statistics
    const [activeLoansCount, totalLoansCount, outstandingPenalties] =
      await Promise.all([
        // Count active loans (APPROVED, ACTIVE, OVERDUE)
        this.prisma.loan.count({
          where: {
            userId: profile.userId,
            status: {
              in: ['APPROVED', 'ACTIVE', 'OVERDUE'],
            },
          },
        }),
        // Count total loans
        this.prisma.loan.count({
          where: {
            userId: profile.userId,
          },
        }),
        // Sum outstanding penalties
        this.prisma.loan.aggregate({
          where: {
            userId: profile.userId,
            status: {
              in: ['ACTIVE', 'OVERDUE'],
            },
          },
          _sum: {
            penaltyAccrued: true,
          },
        }),
      ]);

    return {
      id: profile.id,
      userId: profile.user.id,
      email: profile.user.email,
      role: profile.user.role,
      isActive: profile.user.isActive,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      address: profile.address,
      status: profile.status,
      notes: profile.notes,
      activeLoansCount,
      totalLoansCount,
      outstandingPenalties: outstandingPenalties._sum.penaltyAccrued
        ? Number(outstandingPenalties._sum.penaltyAccrued)
        : 0,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastLoginAt: profile.user.lastLoginAt,
    };
  }

  /**
   * Update member profile
   * Admin only endpoint
   * Updates profile information (name, phone, address, notes)
   *
   * @param id Member profile UUID
   * @param updateMemberDto Profile data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated member detail
   * @throws NotFoundException if member not found
   */
  async update(
    id: string,
    updateMemberDto: UpdateMemberDto,
    userId: string,
  ): Promise<MemberDetail> {
    // Check if member exists
    const existingProfile = await this.prisma.memberProfile.findUnique({
      where: { id },
    });

    if (!existingProfile) {
      this.logger.warn(`Member profile not found: ${id}`);
      throw new NotFoundException('Member not found');
    }

    // Update profile and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update the profile
      await tx.memberProfile.update({
        where: { id },
        data: updateMemberDto,
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'member.updated',
          entityType: 'MemberProfile',
          entityId: id,
          metadata: {
            before: {
              firstName: existingProfile.firstName,
              lastName: existingProfile.lastName,
              phone: existingProfile.phone,
              address: existingProfile.address,
              notes: existingProfile.notes,
            },
            after: {
              firstName: updateMemberDto.firstName ?? existingProfile.firstName,
              lastName: updateMemberDto.lastName ?? existingProfile.lastName,
              phone: updateMemberDto.phone ?? existingProfile.phone,
              address: updateMemberDto.address ?? existingProfile.address,
              notes: updateMemberDto.notes ?? existingProfile.notes,
            },
          },
        },
      });
    });

    this.logger.log(`Successfully updated member profile: ${id}`);

    // Return updated member detail
    return this.findOne(id);
  }

  /**
   * Activate a member
   * Admin only endpoint
   * Changes status from PENDING to ACTIVE
   *
   * @param id Member profile UUID
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated member detail
   * @throws NotFoundException if member not found
   * @throws ConflictException if member already active
   */
  async activate(id: string, userId: string): Promise<MemberDetail> {
    // Check if member exists and get current status
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      this.logger.warn(`Member profile not found: ${id}`);
      throw new NotFoundException('Member not found');
    }

    // Check if member is already active
    if (profile.status === 'ACTIVE') {
      this.logger.warn(`Member already active: ${id}`);
      throw new ConflictException('Member is already active');
    }

    // Update status and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update status to ACTIVE
      await tx.memberProfile.update({
        where: { id },
        data: {
          status: 'ACTIVE',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'member.activated',
          entityType: 'MemberProfile',
          entityId: id,
          metadata: {
            email: profile.user.email,
            previousStatus: profile.status,
            newStatus: 'ACTIVE',
          },
        },
      });
    });

    this.logger.log(`Successfully activated member: ${id}`);

    // Send activation notification email
    await this.sendActivationEmail(profile.user.email, profile.firstName);

    // Return updated member detail
    return this.findOne(id);
  }

  /**
   * Suspend a member
   * Admin only endpoint
   * Changes status from ACTIVE to SUSPENDED
   *
   * @param id Member profile UUID
   * @param suspendDto Suspension data (optional reason)
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated member detail
   * @throws NotFoundException if member not found
   * @throws ConflictException if member already suspended
   */
  async suspend(
    id: string,
    suspendDto: SuspendMemberDto,
    userId: string,
  ): Promise<MemberDetail> {
    // Check if member exists and get current status
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      this.logger.warn(`Member profile not found: ${id}`);
      throw new NotFoundException('Member not found');
    }

    // Check if member is in ACTIVE status (business rule requirement)
    if (profile.status !== 'ACTIVE') {
      this.logger.warn(
        `Cannot suspend member with status ${profile.status}: ${id}`,
      );
      if (profile.status === 'SUSPENDED') {
        throw new ConflictException('Member is already suspended');
      }
      throw new ConflictException(
        `Cannot suspend member with status ${profile.status}. Only ACTIVE members can be suspended.`,
      );
    }

    // Update status and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update status to SUSPENDED and append reason to notes
      const updatedNotes = suspendDto.reason
        ? `${profile.notes ? profile.notes + '\n\n' : ''}Suspended: ${suspendDto.reason}`
        : profile.notes;

      await tx.memberProfile.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          notes: updatedNotes,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'member.suspended',
          entityType: 'MemberProfile',
          entityId: id,
          metadata: {
            email: profile.user.email,
            previousStatus: profile.status,
            newStatus: 'SUSPENDED',
            reason: suspendDto.reason,
          },
        },
      });
    });

    this.logger.log(`Successfully suspended member: ${id}`);

    // Send suspension notification email
    await this.sendSuspensionEmail(
      profile.user.email,
      profile.firstName,
      suspendDto.reason,
    );

    // Return updated member detail
    return this.findOne(id);
  }

  /**
   * Send activation notification email to member
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param email Member's email address
   * @param firstName Member's first name
   */
  private async sendActivationEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Activation notification sent to ${email} (${firstName})`,
    );

    // Email template:
    // Subject: Your Library Membership is Now Active
    // Body: Hello {firstName}, Your library membership has been activated...
  }

  /**
   * Send suspension notification email to member
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param email Member's email address
   * @param firstName Member's first name
   * @param reason Optional suspension reason
   */
  private async sendSuspensionEmail(
    email: string,
    firstName: string,
    reason?: string | null,
  ): Promise<void> {
    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Suspension notification sent to ${email} (${firstName})${reason ? ` - Reason: ${reason}` : ''}`,
    );

    // Email template:
    // Subject: Your Library Membership Has Been Suspended
    // Body: Hello {firstName}, Your library membership has been suspended...
  }
}
