/**
 * ECHO ROUTE SMART WASTE
 * System Constants & Mappings
 */
const ROLES = Object.freeze({
  CITIZEN: 'CITIZEN',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN'
});

const PICKUP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  COLLECTED: 'COLLECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

const WASTE_TYPE_MAP = Object.freeze({
  'Household Waste': 'HOUSEHOLD',
  'Plastic Waste': 'DRY_PLASTIC',
  'E-Waste': 'E_WASTE',
  'Bulky Waste': 'BULKY',
  'Other': 'WET_ORGANIC',
  // Direct internal keys
  'HOUSEHOLD': 'HOUSEHOLD',
  'DRY_PLASTIC': 'DRY_PLASTIC',
  'WET_ORGANIC': 'WET_ORGANIC',
  'E_WASTE': 'E_WASTE',
  'BULKY': 'BULKY'
});

const WASTE_TYPE_LABELS = Object.freeze({
  'HOUSEHOLD': 'Household Waste',
  'DRY_PLASTIC': 'Plastic Waste',
  'WET_ORGANIC': 'Wet / Organic Waste',
  'E_WASTE': 'E-Waste',
  'BULKY': 'Bulky Waste'
});

const TIMELINE_STAGES = Object.freeze([
  { id: 'REQUESTED', label: 'Requested', order: 1, desc: 'Pickup request submitted by citizen' },
  { id: 'VERIFIED', label: 'Verified', order: 2, desc: 'Panchayat official verified ward & waste volume' },
  { id: 'DRIVER_ASSIGNED', label: 'Driver Assigned', order: 3, desc: 'Assigned to ward collection vehicle' },
  { id: 'DRIVER_ON_THE_WAY', label: 'Driver On The Way', order: 4, desc: 'Driver en-route to household stop' },
  { id: 'ARRIVED', label: 'Arrived', order: 5, desc: 'Collection vehicle arrived at location' },
  { id: 'PICKED_UP', label: 'Picked Up', order: 6, desc: 'Waste loaded into Panchayat vehicle' },
  { id: 'COMPLETED', label: 'Completed', order: 7, desc: 'Collection verified with photo proof & closed' }
]);

function calculateTimelineStage(pickupStatus, assignmentStatus) {
  if (pickupStatus === 'COMPLETED' || assignmentStatus === 'COMPLETED') return 'COMPLETED';
  if (pickupStatus === 'COLLECTED' || assignmentStatus === 'PICKED_UP') return 'PICKED_UP';
  if (assignmentStatus === 'ARRIVED') return 'ARRIVED';
  if (assignmentStatus === 'EN_ROUTE' || pickupStatus === 'IN_TRANSIT') return 'DRIVER_ON_THE_WAY';
  if (pickupStatus === 'ASSIGNED' || assignmentStatus === 'ASSIGNED') return 'DRIVER_ASSIGNED';
  if (pickupStatus === 'VERIFIED') return 'VERIFIED';
  return 'REQUESTED';
}

module.exports = {
  ROLES,
  PICKUP_STATUS,
  WASTE_TYPE_MAP,
  WASTE_TYPE_LABELS,
  TIMELINE_STAGES,
  calculateTimelineStage
};
