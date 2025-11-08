import { Booking, Review, WorkerStatistics } from '../types';

/**
 * Calculate comprehensive statistics for a worker based on their bookings and reviews
 */
export const calculateWorkerStatistics = (
  workerId: string,
  allBookings: Booking[],
  workerReviews: Review[]
): WorkerStatistics => {
  // Filter bookings for this worker
  const workerBookings = allBookings.filter(b => b.workerId === workerId);

  // Count tasks by status
  const totalTasksCompleted = workerBookings.filter(b => b.status === 'completed').length;
  const totalTasksInProgress = workerBookings.filter(b => b.status === 'accepted' || b.status === 'in_progress').length;
  const totalTasksCancelled = workerBookings.filter(b => b.status === 'cancelled').length;
  const totalTasksRejected = workerBookings.filter(b => b.status === 'rejected' || b.status === 'expired').length;
  const totalTasksAssigned = workerBookings.length;

  // Calculate acceptance rate (accepted tasks out of assigned tasks)
  const acceptedTasks = workerBookings.filter(b =>
    b.status === 'accepted' ||
    b.status === 'in_progress' ||
    b.status === 'completed'
  ).length;
  const acceptanceRate = totalTasksAssigned > 0
    ? Math.round((acceptedTasks / totalTasksAssigned) * 100)
    : 0;

  // Calculate success rate (completed tasks out of assigned tasks)
  const successRate = totalTasksAssigned > 0
    ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100)
    : 0;

  // Calculate total earnings from completed bookings
  const totalEarnings = workerBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Calculate rating statistics
  const totalReviews = workerReviews.length;
  const averageRating = totalReviews > 0
    ? workerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Calculate rating distribution (1-5 stars)
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: workerReviews.filter(r => r.rating === rating).length,
  }));

  // Calculate monthly tasks completed (last 6 months)
  const monthlyTasksCompleted = calculateMonthlyTasks(workerBookings);

  return {
    totalTasksCompleted,
    totalTasksInProgress,
    totalTasksCancelled,
    totalTasksRejected,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    totalEarnings,
    successRate,
    totalTasksAssigned,
    acceptanceRate,
    monthlyTasksCompleted,
    ratingDistribution,
  };
};

/**
 * Calculate tasks completed per month for the last 6 months
 */
const calculateMonthlyTasks = (bookings: Booking[]): { month: string; count: number }[] => {
  const completedBookings = bookings.filter(b => b.status === 'completed');

  // Get last 6 months
  const months: { month: string; count: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    const count = completedBookings.filter(b => {
      const bookingDate = new Date(b.updatedAt);
      return bookingDate.getMonth() === date.getMonth() &&
             bookingDate.getFullYear() === date.getFullYear();
    }).length;

    months.push({ month: monthName, count });
  }

  return months;
};

/**
 * Get performance badge based on statistics
 */
export const getPerformanceBadge = (stats: WorkerStatistics): {
  label: string;
  color: string;
  icon: string;
} | null => {
  // Top Performer: High rating and good success rate
  if (stats.averageRating >= 4.5 && stats.totalReviews >= 5 && stats.successRate >= 80) {
    return {
      label: 'Top Performer',
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      icon: '🏆',
    };
  }

  // Rising Star: New worker with good ratings
  if (stats.totalReviews >= 3 && stats.totalReviews < 10 && stats.averageRating >= 4.5) {
    return {
      label: 'Rising Star',
      color: 'bg-gradient-to-r from-blue-400 to-purple-500',
      icon: '⭐',
    };
  }

  // Reliable Worker: Good success rate
  if (stats.successRate >= 90 && stats.totalTasksCompleted >= 10) {
    return {
      label: 'Reliable Worker',
      color: 'bg-gradient-to-r from-green-400 to-teal-500',
      icon: '✓',
    };
  }

  return null;
};

/**
 * Get color class based on success rate
 */
export const getSuccessRateColor = (successRate: number): string => {
  if (successRate >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (successRate >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

/**
 * Get color class based on average rating
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-yellow-600';
  return 'text-red-600';
};
