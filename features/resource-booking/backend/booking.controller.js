const prisma = require('../../../shared/database');

const ACTIVE_BOOKING_STATUSES = ['UPCOMING', 'ONGOING'];

function parseDayRange(dateValue) {
  const day = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(day.getTime())) {
    return null;
  }

  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  return { start: day, end: nextDay };
}

async function getBookableResources(req, res) {
  try {
    const resources = await prisma.asset.findMany({
      where: { isBookable: true },
      select: {
        id: true,
        tag: true,
        name: true,
        location: true,
        status: true,
        category: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ resources });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load bookable resources.' });
  }
}

async function getAssetSchedule(req, res) {
  const { assetId } = req.params;
  const { date } = req.query;
  const range = parseDayRange(date);

  if (!range) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        assetId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startTime: { lt: range.end },
        endTime: { gt: range.start }
      },
      select: {
        id: true,
        purpose: true,
        startTime: true,
        endTime: true,
        status: true
      },
      orderBy: { startTime: 'asc' }
    });

    return res.json({ bookings });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load the resource schedule.' });
  }
}

async function createBooking(req, res) {
  const { assetId, bookedById, startTime, endTime, purpose } = req.body;
  const bookingOwnerId = req.user.employeeId;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!assetId || !startTime || !endTime) {
    return res.status(400).json({ error: 'assetId, startTime, and endTime are required.' });
  }

  if (bookedById && bookedById !== bookingOwnerId) {
    return res.status(403).json({ error: 'You can only create bookings for yourself.' });
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ error: 'Provide a valid start time that occurs before the end time.' });
  }

  try {
    const asset = await prisma.asset.findFirst({
      where: { id: assetId, isBookable: true },
      select: { id: true }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Bookable resource not found.' });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        startTime: { lt: end },
        endTime: { gt: start }
      },
      select: { id: true }
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Schedule Conflict: This time slot overlaps with an existing reservation.'
      });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
        bookedById: bookingOwnerId,
        purpose: purpose?.trim() || null,
        startTime: start,
        endTime: end,
        status: 'UPCOMING'
      }
    });

    return res.status(201).json({ booking });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create booking.' });
  }
}

module.exports = { getBookableResources, getAssetSchedule, createBooking };
