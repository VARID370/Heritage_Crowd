/**
 * Crowd Service - Consistent server-side crowd classification
 * 
 * Rules:
 *  - Low: below 40%
 *  - Moderate: 40% to below 70%
 *  - High: 70% to below 85%
 *  - Peak: 85% or above
 */

const getCrowdLevel = (booked, capacity) => {
  if (!capacity || capacity <= 0) {
    return {
      level: 'unknown',
      label: 'Crowd data unavailable',
      percent: 0,
      color: 'gray',
    };
  }

  const percent = Math.min(100, Math.round((booked / capacity) * 100));

  if (percent < 40) {
    return {
      level: 'low',
      label: 'Low Crowd',
      percent,
      color: 'emerald', // Green
      description: 'Comfortable visiting conditions with minimal waiting time.',
    };
  } else if (percent < 70) {
    return {
      level: 'moderate',
      label: 'Moderate Crowd',
      percent,
      color: 'blue', // Blue
      description: 'Normal visitor volume. Standard queue and moving times.',
    };
  } else if (percent < 85) {
    return {
      level: 'high',
      label: 'High Crowd',
      percent,
      color: 'amber', // Amber
      description: 'Heavy footfall expected. Early arrival recommended.',
    };
  } else {
    return {
      level: 'peak',
      label: 'Peak Crowd',
      percent,
      color: 'rose', // Red
      description: 'Near full capacity. Strict slot timing enforced.',
    };
  }
};

module.exports = {
  getCrowdLevel,
};

