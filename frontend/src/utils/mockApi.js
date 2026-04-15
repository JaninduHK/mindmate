// Mock API for Guardian Dashboard
export const mockApi = {
  guardian: {
    // Get user summary for guardian view
    getUserSummary: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return {
        user: {
          name: 'Alex',
          email: 'alex@example.com',
          lastActiveAt: 'Today, 2:30 PM',
          status: 'active',
        },
        isEmergencyActive: false,
        moodData: [
          { date: 'Mon', mood: 3 },
          { date: 'Tue', mood: 3.5 },
          { date: 'Wed', mood: 4 },
          { date: 'Thu', mood: 3.2 },
          { date: 'Fri', mood: 3.8 },
          { date: 'Sat', mood: 4.2 },
          { date: 'Sun', mood: 4 },
        ],
        goals: [
          {
            id: 1,
            title: 'Exercise 3x per week',
            status: 'in_progress',
          },
          {
            id: 2,
            title: 'Meditation daily',
            status: 'completed',
          },
          {
            id: 3,
            title: 'Read 2 books',
            status: 'in_progress',
          },
        ],
        emergencyContacts: [
          {
            id: 1,
            name: 'Dr. Emily Chen',
            role: 'Therapist',
            phone: '+94719876543',
          },
          {
            id: 2,
            name: 'Kamal Perera',
            role: 'Friend',
            phone: '+94711234567',
          },
        ],
      }
    },

    // Get list of monitored users
    getMonitoredUsers: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))

      return [
        {
          id: 1,
          name: 'Alex',
          email: 'alex@example.com',
          status: 'active',
        },
      ]
    },
  },
}
