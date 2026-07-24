import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FriendRequest } from './entities/friend-request.entity';
export interface UserInfo {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface FriendRequestWithSender {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  sender: UserInfo;
}

export interface FriendRequestWithReceiver {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  receiver: UserInfo;
}

export interface PendingRequestResult {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  sender_username: string;
  sender_first_name: string;
  sender_last_name: string;
}

export interface FriendInfo {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  friends_since: Date;
}

@Injectable()
export class FriendsRepository {
  constructor(private readonly db: DatabaseService) {}

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
  async findRequest(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    const query = `
      SELECT * FROM friend_requests
      WHERE sender_id = $1 AND receiver_id = $2
    `;

    const result = await this.db.query<FriendRequest>(query, [senderId, receiverId]);
    return result.rows[0] || null;
  }

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

  async acceptRequest(
    requestId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    const query = `
      UPDATE friend_requests
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await this.db.query<FriendRequest>(query, [requestId, receiverId]);
    return result.rows[0] || null;
  }

  async declineRequest(
    requestId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    const query = `
      UPDATE friend_requests
      SET status = 'declined', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING *
    `;

    const result = await this.db.query<FriendRequest>(query, [requestId, receiverId]);
    return result.rows[0] || null;
  }

  async getPendingRequests(userId: string): Promise<PendingRequestResult[]> {
    const query = `
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        u.username as sender_username,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
      FROM friend_requests fr
      INNER JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getSentRequests(userId: string): Promise<FriendRequestWithReceiver[]> {
    const query = `
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        u.username as receiver_username,
        u.first_name as receiver_first_name,
        u.last_name as receiver_last_name
      FROM friend_requests fr
      INNER JOIN users u ON u.id = fr.receiver_id
      WHERE fr.sender_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getFriends(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ friends: FriendInfo[]; total: number }> {
    const countQuery = `
      SELECT COUNT(DISTINCT f.friend_id) as total
      FROM friendships f
      INNER JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1
    `;

    const countResult = await this.db.query<{ total: string }>(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    const offset = (page - 1) * limit;

    const query = `
      SELECT
        f.friend_id as id,
        u.username,
        u.first_name,
        u.last_name,
        f.friends_since
      FROM friendships f
      INNER JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1
      ORDER BY f.friends_since DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [userId, limit, offset]);

    return {
      friends: result.rows,
      total,
    };
  }

  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const query = `SELECT are_friends($1, $2) as are_friends`;
    const result = await this.db.query<{ are_friends: boolean }>(query, [
      userId1,
      userId2,
    ]);
    return result.rows[0].are_friends;
  }

  async cancelRequest(requestId: string, senderId: string): Promise<boolean> {
    const query = `
      DELETE FROM friend_requests
      WHERE id = $1 AND sender_id = $2 AND status = 'pending'
      RETURNING id
    `;

    const result = await this.db.query(query, [requestId, senderId]);
    return (result.rowCount ?? 0) > 0;
  }

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
