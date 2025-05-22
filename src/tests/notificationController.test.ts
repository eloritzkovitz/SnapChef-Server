import express from 'express';
import request from 'supertest';
import * as notificationController from '../modules/notifications/notificationController';
import Notification from '../modules/notifications/Notification';
import admin from 'firebase-admin';

// Mock Firebase
jest.mock('firebase-admin', () => ({
  messaging: jest.fn().mockReturnValue({
    send: jest.fn(),
  }),
}));

// Mock Notification model
jest.mock('../modules/notifications/Notification');

const app = express();
app.use(express.json());
//app.post('/notifications', notificationController.createNotification);

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    const mockBody = {
      userId: 'user123',
      type: 'info',
      title: 'Test Notification',
      body: 'This is a test.',
      metadata: { orderId: '123' },
      deviceToken: 'testDeviceToken',
    };

    it('should create and send a notification', async () => {
      (Notification.create as jest.Mock).mockResolvedValue({ ...mockBody, _id: 'notif1' });
      (admin.messaging().send as jest.Mock).mockResolvedValue('success');

      const res = await request(app).post('/notifications').send(mockBody);

      expect(res.status).toBe(201);
      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        body: 'This is a test.',
        metadata: { orderId: '123' },
      });
      expect(admin.messaging().send).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post('/notifications').send({
        userId: 'user123',
        title: 'Missing fields',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required fields.');
    });

    it('should handle Firebase errors gracefully', async () => {
      (Notification.create as jest.Mock).mockResolvedValue({ ...mockBody });
      (admin.messaging().send as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      const res = await request(app).post('/notifications').send(mockBody);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to send notification.');
    });

    it('should handle DB errors gracefully', async () => {
      (Notification.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/notifications').send(mockBody);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to send notification.');
    });
  });
});
