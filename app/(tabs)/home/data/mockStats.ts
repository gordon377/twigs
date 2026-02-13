export const mockStats = {
  alternativesCalculated: {
    value: 23907,
    change: 20,
    trend: 'up' as const,
  },
  goalsProgressed: {
    value: 89,
    unit: '%',
    change: 33,
    trend: 'up' as const,
  },
  timeSaved: [
    { date: '23', hours: 3 },
    { date: '24', hours: 5 },
    { date: '25', hours: 8 },
    { date: '26', hours: 4 },
    { date: '27', hours: 6 },
    { date: '28', hours: 10 },
    { date: '29', hours: 7 },
    { date: '30', hours: 9 },
  ],
};
