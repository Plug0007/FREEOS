const calculateMatchScore = (job, user) => {
  let score = 0;
  const explanations = [];

  // Skill Match (50 points)
  if (user.skills && user.skills.length > 0 && job.skills && job.skills.length > 0) {
    const userSkills = user.skills.map(s => s.toLowerCase());
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const matchedSkills = jobSkills.filter(skill => userSkills.includes(skill));
    
    if (matchedSkills.length > 0) {
      const skillScore = Math.min(50, (matchedSkills.length / job.skills.length) * 50);
      score += skillScore;
      explanations.push(`Matched skills: ${matchedSkills.join(', ')}`);
    }
  }

  // Budget Match (30 points)
  const userBudget = user.settings?.expectedBudget || 0;
  if (job.budget && userBudget) {
    if (job.budget >= userBudget) {
      score += 30;
    } else if (job.budget >= userBudget * 0.8) {
      score += 20;
    }
  } else {
    score += 30; 
  }

  // Experience Match (20 points)
  score += 20; 

  return {
    score: Math.min(100, Math.round(score)),
    explanation: explanations.join(' ')
  };
};

const calculateTrustScore = (job) => {
  let score = 100;
  const reasons = [];

  const redFlags = ['free', 'unpaid', 'test work', 'equity only', 'commission only'];
  const description = (job.description || '').toLowerCase();

  redFlags.forEach(flag => {
    if (description.includes(flag)) {
      score -= 30;
      reasons.push(`Flag: "${flag}"`);
    }
  });

  if (description.length < 100) {
    score -= 20;
    reasons.push('Short description');
  }

  return {
    score: Math.max(0, score),
    reasons
  };
};

module.exports = {
  calculateMatchScore,
  calculateTrustScore
};
