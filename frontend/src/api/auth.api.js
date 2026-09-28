/**
 * ECHO ROUTE SMART WASTE - Auth & Domain API Services
 */
import { apiClient } from './client';

export const authApi = {
  // Authentication
  login: async (email, password, portalRole) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: { email, password, portalRole }
    });
  },

  getCurrentUser: async () => {
    return apiClient('/auth/me');
  },

  logout: async () => {
    return apiClient('/auth/logout', { method: 'POST' });
  },

  getHealth: async () => {
    return apiClient('/health');
  },

  // Citizen Portal APIs
  getCitizenDashboard: async () => {
    return apiClient('/citizen/dashboard');
  },

  getCitizenPickups: async (filter = 'all') => {
    return apiClient(`/citizen/pickups?filter=${encodeURIComponent(filter)}`);
  },

  getCitizenPickupById: async (id) => {
    return apiClient(`/citizen/pickups/${id}`);
  },

  createPickupRequest: async (pickupData) => {
    return apiClient('/citizen/pickups', {
      method: 'POST',
      body: pickupData
    });
  },

  uploadPhoto: async (photoData, filename) => {
    return apiClient('/citizen/upload-photo', {
      method: 'POST',
      body: { photo_data: photoData, filename }
    });
  },

  getTrackPickup: async (id = null) => {
    return apiClient(id ? `/citizen/track/${id}` : '/citizen/track');
  },

  getCitizenComplaints: async () => {
    return apiClient('/citizen/complaints');
  },

  createComplaint: async (complaintData) => {
    return apiClient('/citizen/complaints', {
      method: 'POST',
      body: complaintData
    });
  },

  getCitizenProfile: async () => {
    return apiClient('/citizen/profile');
  },

  updateCitizenProfile: async (profileData) => {
    return apiClient('/citizen/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  // Notifications Center APIs (Stage 7 - Unified for all roles)
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.unreadOnly) query.append('unreadOnly', 'true');
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient(`/notifications${qs}`);
  },

  getUnreadNotificationCount: async () => {
    return apiClient('/notifications/unread-count');
  },

  markNotificationRead: async (id) => {
    return apiClient(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  markAllNotificationsRead: async () => {
    return apiClient('/notifications/read-all', {
      method: 'PATCH'
    });
  },

  deleteNotification: async (id) => {
    return apiClient(`/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  // Admin / Panchayat Portal APIs
  getAdminDashboard: async () => {
    return apiClient('/admin/dashboard');
  },

  getAdminPickups: async (filter = 'all') => {
    return apiClient(`/admin/pickups?filter=${encodeURIComponent(filter)}`);
  },

  getAdminPickupById: async (id) => {
    return apiClient(`/admin/pickups/${id}`);
  },

  verifyPickup: async (id) => {
    return apiClient(`/admin/pickups/${id}/verify`, {
      method: 'PATCH'
    });
  },

  assignDriverToPickup: async (id, driverId) => {
    return apiClient(`/admin/pickups/${id}/assign`, {
      method: 'POST',
      body: { driver_id: driverId }
    });
  },

  getAdminDrivers: async () => {
    return apiClient('/admin/drivers');
  },

  toggleDriverDuty: async (id) => {
    return apiClient(`/admin/drivers/${id}/duty`, {
      method: 'PATCH'
    });
  },

  createAdminDriver: async (driverData) => {
    return apiClient('/admin/drivers', {
      method: 'POST',
      body: driverData
    });
  },

  getAdminCitizens: async () => {
    return apiClient('/admin/citizens');
  },

  getAdminComplaints: async () => {
    return apiClient('/admin/complaints');
  },

  updateComplaint: async (id, data) => {
    return apiClient(`/admin/complaints/${id}`, {
      method: 'PATCH',
      body: data
    });
  },

  // Admin Activity Feed (Stage 7)
  getAdminActivity: async (limit = 20) => {
    return apiClient(`/admin/activity?limit=${limit}`);
  },

  // Driver Portal APIs (Stage 5)
  getDriverDashboard: async () => {
    return apiClient('/driver/dashboard');
  },

  getDriverPickups: async (filter = 'all') => {
    return apiClient(`/driver/pickups?filter=${encodeURIComponent(filter)}`);
  },

  getDriverPickupById: async (id) => {
    return apiClient(`/driver/pickups/${id}`);
  },

  acceptDriverAssignment: async (id) => {
    return apiClient(`/driver/pickups/${id}/accept`, {
      method: 'POST'
    });
  },

  updateDriverPickupStatus: async (id, action) => {
    return apiClient(`/driver/pickups/${id}/status`, {
      method: 'PATCH',
      body: { action }
    });
  },

  uploadCompletionProofPhoto: async (photoData, filename = 'proof.jpg') => {
    return apiClient('/driver/upload-proof', {
      method: 'POST',
      body: { photo_data: photoData, filename }
    });
  },

  completeDriverPickup: async (id, payload) => {
    return apiClient(`/driver/pickups/${id}/complete`, {
      method: 'POST',
      body: payload
    });
  },

  getDriverTodaysRoute: async () => {
    return apiClient('/driver/route');
  },

  getDriverCompletedPickups: async () => {
    return apiClient('/driver/completed');
  },

  getDriverProfile: async () => {
    return apiClient('/driver/profile');
  },

  toggleMyDriverDuty: async () => {
    return apiClient('/driver/duty', {
      method: 'PATCH'
    });
  },

  // Live Tracking & Route Planning APIs (Stage 6)
  getAdminTracking: async () => {
    return apiClient('/admin/tracking');
  },

  getAdminRoutes: async () => {
    return apiClient('/admin/routes');
  },

  recalculateDriverRoute: async (driverId) => {
    return apiClient(`/admin/routes/${driverId}/recalculate`, {
      method: 'POST'
    });
  },

  updateDriverLocation: async (payload) => {
    return apiClient('/driver/location', {
      method: 'POST',
      body: payload
    });
  },

  getDriverLocation: async () => {
    return apiClient('/driver/location');
  },

  getDriverRouteMap: async () => {
    return apiClient('/driver/route/map');
  },

  getCitizenTrackMap: async (pickupId) => {
    return apiClient(`/citizen/track/${pickupId}/map`);
  },

  // Legacy Status APIs
  getCitizenStatus: async () => {
    return apiClient('/citizen/status');
  },

  getDriverStatus: async () => {
    return apiClient('/driver/status');
  },

  getAdminStatus: async () => {
    return apiClient('/admin/status');
  }
};
