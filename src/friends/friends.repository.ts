import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FriendRequest, FriendshipStatus } from './entities/friend-request.entity';

/**
 * Friends Repository - Data access layer for friend operations
 */
@Injectable()
export class FriendsRepository {
  private readonly logger = new Logger(FriendsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Send a friend request
   * @param senderId Sender user ID
   * @param receiverId Receiver user ID
   * @returns Created friend request
   */
  async sendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    const query = `
      INSERT INTO friend_requests (sender_id, receiver_id, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (sender_id, receiver_id)
      DO UPDATE SET
        status = 'pending',
        updated_at = CURRENT_TIMESTAMP,
        responded_at = NULL
      RETURNING *
    `;

    const result = await this.db.query<FriendRequest>(query, [senderId, receiverId]);
    return result.rows[0];
  }

  /**
   * Check if a friend request exists
   * @param senderId Sender user ID
   * @param receiverId Receiver user ID
   * @returns Friend request or null
   */
  async findRequest(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    const query = `
      SELECT * FROM friend_requests
      WHERE sender_id = $1 AND receiver_id = $2
    `;

    const result = await this.db.query<FriendRequest>(query, [senderId, receiverId]);
    return result.rows[0] || null;
  }

  /**
   * Check if users are already friends or have pending request
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Friend request or null
   */
  async findExistingRelationship(
    userId1: string,
    userId2: string,
  ): Promise<FriendRequest | null> {
    const query = `
      SELECT * FROM friend_requests
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `;

    const result = await this.db.query<FriendRequest>(query, [userId1, userId2]);
    return result.rows[0] || null;
  }

  /**
   * Accept a friend request
   * @param requestId Request ID
   * @param receiverId Receiver user ID (for verification)
   * @returns Updated friend request
   */
  async acceptRequest(requestId: string, receiverId: string): Promise<FriendRequest | null> {
    const query = `
      UPDATE friend_requests
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await this.db.query<FriendRequest>(query, [requestId, receiverId]);
    return result.rows[0] || null;
  }

  /**
   * Decline a friend request
   * @param requestId Request ID
   * @param receiverId Receiver user ID (for verification)
   * @returns Updated friend request
   */
  async declineRequest(requestId: string, receiverId: string): Promise<FriendRequest | null> {
    const query = `
      UPDATE friend_requests
      SET status = 'declined', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await this.db.query<FriendRequest>(query, [requestId, receiverId]);
    return result.rows[0] || null;
  }

  /**
   * Get pending friend requests received by a user
   * @param userId User ID
   * @returns List of pending requests with sender info
   */
  async getPendingRequests(userId: string): Promise<any[]> {
    const query = `
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_picture_url', u.profile_picture_url
        ) as sender
      FROM friend_requests fr
      INNER JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending' AND u.is_active = true
      ORDER BY fr.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get sent friend requests (pending)
   * @param userId User ID
   * @returns List of sent pending requests
   */
  async getSentRequests(userId: string): Promise<any[]> {
    const query = `
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'profile_picture_url', u.profile_picture_url
        ) as receiver
      FROM friend_requests fr
      INNER JOIN users u ON u.id = fr.receiver_id
      WHERE fr.sender_id = $1 AND fr.status = 'pending' AND u.is_active = true
      ORDER BY fr.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get list of friends for a user
   * @param userId User ID
   * @param page Page number
   * @param limit Results per page
   * @returns Paginated list of friends
   */
  async getFriends(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ friends: any[]; total: number }> {
    // Count total friends
    const countQuery = `
      SELECT COUNT(DISTINCT f.friend_id) as total
      FROM friendships f
      INNER JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1 AND u.is_active = true
    `;

    const countResult = await this.db.query<{ total: string }>(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated friends
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        f.friend_id as id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.bio,
        f.friends_since
      FROM friendships f
      INNER JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1 AND u.is_active = true
      ORDER BY f.friends_since DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [userId, limit, offset]);

    return {
      friends: result.rows,
      total,
    };
  }

  /**
   * Check if two users are friends
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns True if friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const query = `SELECT are_friends($1, $2) as are_friends`;
    const result = await this.db.query<{ are_friends: boolean }>(query, [userId1, userId2]);
    return result.rows[0].are_friends;
  }

  /**
   * Get mutual friends count
   * @param userId1 First user ID
   * @param userId2 Second user ID
   * @returns Mutual friends count
   */
  async getMutualFriendsCount(userId1: string, userId2: string): Promise<number> {
    const query = `SELECT get_mutual_friends_count($1, $2) as count`;
    const result = await this.db.query<{ count: number }>(query, [userId1, userId2]);
    return result.rows[0].count;
  }

  /**
   * Cancel/withdraw a friend request
   * @param requestId Request ID
   * @param senderId Sender ID (for verification)
   */
  async cancelRequest(requestId: string, senderId: string): Promise<boolean> {
    const query = `
      DELETE FROM friend_requests
      WHERE id = $1 AND sender_id = $2 AND status = 'pending'
      RETURNING id
    `;

    const result = await this.db.query(query, [requestId, senderId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Remove a friendship (unfriend)
   * @param userId User ID
   * @param friendId Friend ID
   */
  async unfriend(userId: string, friendId: string): Promise<boolean> {
    const query = `
      DELETE FROM friend_requests
      WHERE status = 'accepted'
        AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
      RETURNING id
    `;

    const result = await this.db.query(query, [userId, friendId]);
    return (result.rowCount ?? 0) > 0;
  }
}
