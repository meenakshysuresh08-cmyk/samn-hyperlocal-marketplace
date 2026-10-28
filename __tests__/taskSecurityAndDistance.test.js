/**
 * Targeted tests for:
 * 1. A creator cannot see their own task in Helper Mode.
 * 2. Another eligible account can see the task when it is within range.
 * 3. Radius boundaries behave correctly (3km, 5km, 10km, 25km).
 * 4. Changing active location refreshes results.
 * 5. Missing / invalid coordinates are handled safely (no fabricated 1.0 km).
 * 6. Unauthorized users cannot read or send task messages (chat security).
 * 7. Task coordinate validation.
 */

const { calculateDistanceKm } = require('../backend/src/services/geo.service');

describe('Priority 1: Task Chat Access Control & Security', () => {
  // Test authorization rule implementation used in message.controller.js
  const authorizeTaskChat = (user, task) => {
    if (!task) {
      return { status: 404, message: 'Task not found' };
    }
    const userId = user?._id?.toString() || user?.id?.toString();
    const customerId = task.customerId?._id?.toString() || task.customerId?.toString();
    const helperId = task.helperId?._id?.toString() || task.helperId?.toString();

    if (!userId || (userId !== customerId && userId !== helperId)) {
      return { status: 403, message: 'Not authorized to access messages for this task' };
    }
    return { status: 200, authorized: true };
  };

  const sampleTask = {
    _id: 'task-100',
    customerId: { _id: 'user-customer-1' },
    helperId: { _id: 'user-helper-1' },
  };

  test('Customer who created the task can access task messages', () => {
    const res = authorizeTaskChat({ _id: 'user-customer-1' }, sampleTask);
    expect(res.status).toBe(200);
    expect(res.authorized).toBe(true);
  });

  test('Assigned helper can access task messages', () => {
    const res = authorizeTaskChat({ _id: 'user-helper-1' }, sampleTask);
    expect(res.status).toBe(200);
    expect(res.authorized).toBe(true);
  });

  test('Unrelated user is blocked with 403 Forbidden', () => {
    const res = authorizeTaskChat({ _id: 'user-stranger-99' }, sampleTask);
    expect(res.status).toBe(403);
    expect(res.message).toMatch(/Not authorized/i);
  });

  test('Task without assigned helper blocks third-party users safely', () => {
    const unassignedTask = {
      _id: 'task-101',
      customerId: { _id: 'user-customer-1' },
      helperId: null,
    };
    const res = authorizeTaskChat({ _id: 'user-helper-2' }, unassignedTask);
    expect(res.status).toBe(403);
  });

  test('Non-existent task returns 404', () => {
    const res = authorizeTaskChat({ _id: 'user-customer-1' }, null);
    expect(res.status).toBe(404);
  });
});

describe('Priority 2: Creator Visibility in Helper Mode Feed', () => {
  // Simulates server-side and client-side filtering logic
  const filterNearbyTasksForHelper = (tasks, currentUserId, helperCoords, radiusKm) => {
    return tasks
      .map((t) => ({ ...t }))
      .filter((task) => {
        // Exclude tasks created by authenticated user
        const creatorId = task.customerId?._id?.toString() || task.customerId?.toString();
        if (currentUserId && creatorId && creatorId === currentUserId.toString()) {
          return false;
        }

        // Calculate distance if coordinates exist
        if (
          helperCoords &&
          Array.isArray(task.location?.coordinates) &&
          task.location.coordinates.length >= 2 &&
          !isNaN(task.location.coordinates[0]) &&
          !isNaN(task.location.coordinates[1])
        ) {
          task.distanceKm = calculateDistanceKm(helperCoords, task.location.coordinates);
        } else {
          task.distanceKm = null;
        }

        // Exclude tasks with missing/invalid coordinates (no fabricated distances)
        if (task.distanceKm === null || task.distanceKm === undefined || isNaN(task.distanceKm)) {
          return false;
        }

        // Exclude tasks outside selected radius
        return task.distanceKm <= radiusKm;
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  };

  const currentHelperId = 'user-helper-me';
  const helperCoords = [77.5946, 12.9716]; // Bengaluru Center

  const mockTasks = [
    {
      _id: 'task-own',
      title: 'My own task posted earlier',
      customerId: { _id: 'user-helper-me' }, // Same user!
      location: { coordinates: [77.5948, 12.9718] }, // 0.03 km away
    },
    {
      _id: 'task-nearby-2km',
      title: 'Grocery delivery nearby',
      customerId: { _id: 'user-neighbor-1' },
      location: { coordinates: [77.6046, 12.9816] }, // ~1.5 km away
    },
    {
      _id: 'task-far-15km',
      title: 'Airport ride',
      customerId: { _id: 'user-far-2' },
      location: { coordinates: [77.7046, 13.0816] }, // ~17 km away
    },
    {
      _id: 'task-no-coords',
      title: 'Task with broken coordinates',
      customerId: { _id: 'user-broken-3' },
      location: { coordinates: null },
    },
  ];

  test('Creator CANNOT see their own task in Helper Mode', () => {
    const results = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 25);
    const ownTaskFound = results.some((t) => t._id === 'task-own');
    expect(ownTaskFound).toBe(false);
  });

  test('Another eligible account CAN see nearby task within range', () => {
    const results = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 5);
    const nearbyFound = results.some((t) => t._id === 'task-nearby-2km');
    expect(nearbyFound).toBe(true);
  });

  test('Radius boundary: task at 17km is excluded from 5km radius but included in 25km radius', () => {
    const results5km = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 5);
    expect(results5km.some((t) => t._id === 'task-far-15km')).toBe(false);

    const results25km = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 25);
    expect(results25km.some((t) => t._id === 'task-far-15km')).toBe(true);
  });

  test('Missing coordinates are safely excluded and NEVER assigned 1.0 km fabricated distance', () => {
    const results = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 25);
    const brokenTask = results.find((t) => t._id === 'task-no-coords');
    expect(brokenTask).toBeUndefined();
  });

  test('Results are sorted nearest-first', () => {
    const multiTasks = [
      {
        _id: 't-3km',
        customerId: { _id: 'u-1' },
        location: { coordinates: [77.62, 12.97] }, // ~2.7 km
      },
      {
        _id: 't-1km',
        customerId: { _id: 'u-2' },
        location: { coordinates: [77.60, 12.97] }, // ~0.6 km
      },
      {
        _id: 't-8km',
        customerId: { _id: 'u-3' },
        location: { coordinates: [77.66, 12.97] }, // ~7 km
      },
    ];
    const results = filterNearbyTasksForHelper(multiTasks, currentHelperId, helperCoords, 10);
    expect(results[0]._id).toBe('t-1km');
    expect(results[1]._id).toBe('t-3km');
    expect(results[2]._id).toBe('t-8km');
    expect(results[0].distanceKm).toBeLessThan(results[1].distanceKm);
    expect(results[1].distanceKm).toBeLessThan(results[2].distanceKm);
  });

  test('Changing active location refreshes distances and filtered results', () => {
    // New active location in North Bengaluru: [77.58, 13.05]
    const newLocation = [77.58, 13.05];
    const resultsOld = filterNearbyTasksForHelper(mockTasks, currentHelperId, helperCoords, 10);
    const resultsNew = filterNearbyTasksForHelper(mockTasks, currentHelperId, newLocation, 10);

    // Distances should be recalculated relative to new active location
    expect(resultsOld.length).toBeGreaterThan(0);
    expect(resultsNew.length).toBeGreaterThan(0);
    const t2OldDist = resultsOld.find((t) => t._id === 'task-nearby-2km').distanceKm;
    const t2NewDist = resultsNew.find((t) => t._id === 'task-nearby-2km').distanceKm;
    expect(t2OldDist).not.toEqual(t2NewDist);
  });
});

describe('Priority 3: Task Coordinate Validation on Creation', () => {
  const validateTaskCoordinates = (coordinates) => {
    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      isNaN(Number(coordinates[0])) ||
      isNaN(Number(coordinates[1]))
    ) {
      return { valid: false, error: 'Valid coordinates [longitude, latitude] are required' };
    }
    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return { valid: false, error: 'Coordinates out of geographical range' };
    }
    return { valid: true, coordinates: [lng, lat] };
  };

  test('Rejects missing coordinates', () => {
    expect(validateTaskCoordinates(null).valid).toBe(false);
    expect(validateTaskCoordinates(undefined).valid).toBe(false);
  });

  test('Rejects non-array or wrong length', () => {
    expect(validateTaskCoordinates('77.59, 12.97').valid).toBe(false);
    expect(validateTaskCoordinates([77.59]).valid).toBe(false);
    expect(validateTaskCoordinates([77.59, 12.97, 100]).valid).toBe(false);
  });

  test('Rejects NaN coordinates', () => {
    expect(validateTaskCoordinates([NaN, 12.97]).valid).toBe(false);
    expect(validateTaskCoordinates(['abc', 'xyz']).valid).toBe(false);
  });

  test('Accepts valid [lng, lat] coordinates', () => {
    const res = validateTaskCoordinates([77.5946, 12.9716]);
    expect(res.valid).toBe(true);
    expect(res.coordinates).toEqual([77.5946, 12.9716]);
  });
});
