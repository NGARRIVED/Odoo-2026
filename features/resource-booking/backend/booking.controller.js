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
      where: {
        isBookable: true,
        status: { notIn: ['UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'] }
      },
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

async function listBookings(req, res) {
  try {
    const where = req.user.role === 'EMPLOYEE' ? { bookedById: req.user.employeeId } : {};

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        asset: { select: { id: true, tag: true, name: true, location: true, status: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return res.json({ bookings });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load bookings.' });
  }
}

async function getBooking(req, res) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        asset: { select: { id: true, tag: true, name: true, location: true, status: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER' && booking.bookedById !== req.user.employeeId) {
      return res.status(403).json({ error: 'You can only view your own bookings.' });
    }

    return res.json({ booking });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load booking.' });
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
        status: true,
        bookedById: true
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
      where: {
        id: assetId,
        isBookable: true,
        status: { notIn: ['UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'] }
      },
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


async function updateBooking(req, res) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER' && booking.bookedById !== req.user.employeeId) {
      return res.status(403).json({ error: 'You can only update your own bookings.' });
    }

    if (booking.status !== 'UPCOMING') {
      return res.status(409).json({ error: 'Only upcoming bookings can be edited.' });
    }

    const { startTime, endTime, purpose } = req.body;
    const start = startTime ? new Date(startTime) : booking.startTime;
    const end = endTime ? new Date(endTime) : booking.endTime;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: 'Provide a valid start time that occurs before the end time.' });
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        assetId: booking.assetId,
        id: { not: booking.id },
        status: { in: ACTIVE_BOOKING_STATUSES },
        startTime: { lt: end },
        endTime: { gt: start }
      },
      select: { id: true }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Schedule conflict: another reservation already occupies that slot.' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        purpose: purpose?.trim() || booking.purpose,
        startTime: start,
        endTime: end
      }
    });

    return res.json({ booking: updatedBooking });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update booking.' });
  }
}

async function cancelBooking(req, res) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER' && booking.bookedById !== req.user.employeeId) {
      return res.status(403).json({ error: 'You can only cancel your own bookings.' });
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' }
    });

    return res.json({ booking: cancelledBooking });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel booking.' });
  }
}

module.exports = { getBookableResources, listBookings, getBooking, getAssetSchedule, createBooking, updateBooking, cancelBooking };
